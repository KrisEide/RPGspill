import {
  calculateDamage,
  calculateFixedDamage,
} from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { combineDamageReductions } from "./damageMitigation";
import { absorbDirectDamage, addBarrier } from "./barrier";
import { getPartyHealingReceivedBonus } from "./healing";
import { nextRandom } from "./random";
import { getActiveBloodpactRoles } from "./bloodpact";
import { isEnemySleeping, isEnemyTargetable } from "./targeting";
import {
  applyCharacterHp,
  applyGhostIncomingDamage,
  applyGhostReceivedHealing,
  getCharacterEventState,
  getCharacterMaxHp,
  getCharacterMaxPp,
  canCharacterUseGhostAbility,
  GHOST_UPGRADE_VALUES,
  hasAvailablePhoenixRebirth,
  reviveGhost,
} from "../ghost/ghostSystem";
import {
  createEnemyActionsFromIntents,
  prepareEnemyIntents,
} from "./enemyIntents";
import {
  getSpiritTurnResolutionPriority,
  prepareRoundTurnPriorities,
} from "./spiritTurnPriority";
import { STATUS_DEFINITIONS } from "../../data/statuses";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { ITEM_DEFINITIONS, getItemUseProfile } from "../../data/items";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { generateRewardOffers } from "../rewards/rewardSystem";
import {
  drawNormalItemReward,
  grantEncounterItemRewards,
} from "../items/itemSystem";
import { startEncounter } from "../state/encounterState";
import {
  createStatusFromSource,
  refreshStatusWithoutDowngrade,
} from "../passives/statusPassives";
import {
  characterHasPassive,
  getEffectiveAbilityPpCost,
  PASSIVE_VALUES,
} from "../passives/passiveSystem";
import {
  getSpiritForActiveAbility,
  getSpiritPassive,
} from "../../data/spirits";
import {
  CHARACTER_ORDER,
  isCharacterInstanceId,
} from "../playerControl";
import {
  getKnownAbilityRank,
  resolveAbility,
} from "../abilities/abilityProgression";
import type {
  AbilityId,
  AbilityCombatAction,
  ActiveStatus,
  CombatAction,
  CombatantId,
  CombatEvent,
  CombatState,
  CharacterInstanceId,
  Element,
  ItemId,
  ItemCombatAction,
  ItemUseEvent,
  ItemUseImpact,
  MultiTargetSupportImpact,
  PhoenixRebirthEvent,
  RoundResult,
  RoundOutcomePhase,
  RoundSelections,
  StatusChange,
  StatusDamageEvent,
  StatusId,
  SoulTransferEvent,
  SpiritId,
} from "../types";

function getCombatant(state: CombatState, id: CombatantId) {
  if (isCharacterInstanceId(id)) {
    return state.characters[id];
  }

  return state.enemies.find((enemy) => enemy.instanceId === id);
}

function getCombatantAbility(
  state: CombatState,
  actorId: CombatantId,
  abilityId: AbilityId,
) {
  const actor = getCombatant(state, actorId);
  const isGhostActor =
    actor &&
    isCharacterInstanceId(actorId) &&
    state.characters[actorId].form === "ghost";
  const knownRank = actor
    ? getKnownAbilityRank(actor.abilityRanks, abilityId)
    : null;
  const activeSpirit =
    actor && isCharacterInstanceId(actorId)
      ? getSpiritForActiveAbility(
          state.characters[actorId].spirits,
          abilityId,
        )
      : null;
  const rank = isGhostActor
    ? canCharacterUseGhostAbility(state.characters[actorId], abilityId)
      ? 1
      : null
    : knownRank ?? activeSpirit?.rank ?? null;

  return rank ? resolveAbility(abilityId, rank) : null;
}

function updateHp(
  state: CombatState,
  id: CombatantId,
  hp: number,
): CombatState {
  if (isCharacterInstanceId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: applyCharacterHp(character, hp),
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, hp } : enemy,
    ),
  };
}

function resolveSoulTransfer(
  state: CombatState,
  targetId: CharacterInstanceId,
  incomingHpDamage: number,
): { state: CombatState; event: SoulTransferEvent } | null {
  const target = state.characters[targetId];

  if (hasAvailablePhoenixRebirth(target)) {
    return null;
  }

  const ghostId = CHARACTER_ORDER.find(
    (characterId) =>
      characterId !== targetId &&
      state.characters[characterId].form === "ghost" &&
      state.characters[characterId].soulLinkActive,
  );

  if (target.form !== "living" || !ghostId) {
    return null;
  }

  const ghost = state.characters[ghostId];
  const remainingPartyHp = ghost.hp + target.hp - incomingHpDamage;

  if (remainingPartyHp < 2) {
    return null;
  }

  const ghostRemainingHp = Math.floor(remainingPartyHp / 2);
  const targetRemainingHp = Math.ceil(remainingPartyHp / 2);
  const nextGhost = applyCharacterHp(
    { ...ghost, soulLinkActive: false },
    ghostRemainingHp,
  );
  const nextTarget = applyCharacterHp(target, targetRemainingHp);
  const nextState: CombatState = {
    ...state,
    characters: {
      ...state.characters,
      [ghostId]: nextGhost,
      [targetId]: nextTarget,
    },
  };

  return {
    state: nextState,
    event: {
      type: "soulTransfer",
      ghostId,
      targetId,
      ghostHpLost: ghost.hp - ghostRemainingHp,
      targetHpRestored: targetRemainingHp,
      ghostRemainingHp,
      targetRemainingHp,
      ghostCharacterState: getCharacterEventState(nextGhost),
      targetCharacterState: getCharacterEventState(nextTarget),
    },
  };
}

function getEventCharacterState(
  state: CombatState,
  id: CombatantId,
) {
  return isCharacterInstanceId(id)
    ? getCharacterEventState(state.characters[id])
    : undefined;
}

function getPhoenixRebirthEvent(
  before: CombatState["characters"][CharacterInstanceId],
  after: CombatState["characters"][CharacterInstanceId],
): PhoenixRebirthEvent | null {
  const usesBefore = before.spirits.phoenix?.activeUsesRemaining ?? 0;
  const usesAfter = after.spirits.phoenix?.activeUsesRemaining ?? 0;

  if (
    before.form !== "living" ||
    after.form !== "living" ||
    usesBefore <= 0 ||
    usesAfter !== 0
  ) {
    return null;
  }

  return {
    type: "phoenixRebirth",
    targetId: after.instanceId,
    remainingHp: after.hp,
    remainingBarrier: after.barrier,
    phoenixActiveUsesRemaining: usesAfter,
    characterState: getCharacterEventState(after),
  };
}

function updateBarrier(
  state: CombatState,
  id: CombatantId,
  barrier: number,
): CombatState {
  if (isCharacterInstanceId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...character, barrier },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, barrier } : enemy,
    ),
  };
}

function updatePp(
  state: CombatState,
  id: CombatantId,
  pp: number,
): CombatState {
  if (isCharacterInstanceId(id)) {
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...state.characters[id], pp },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, pp } : enemy,
    ),
  };
}

function consumeItem(
  state: CombatState,
  characterId: CharacterInstanceId,
  itemId: string,
): CombatState {
  const character = state.characters[characterId];
  const currentQuantity = character.inventory[itemId] ?? 0;

  if (currentQuantity <= 0) {
    return state;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        inventory: {
          ...character.inventory,
          [itemId]: currentQuantity - 1,
        },
      },
    },
  };
}

function updateStatuses(
  state: CombatState,
  id: CombatantId,
  statuses: ActiveStatus[],
): CombatState {
  if (isCharacterInstanceId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...character, statuses },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, statuses } : enemy,
    ),
  };
}

function isSameStatusInstance(
  first: ActiveStatus,
  second: ActiveStatus,
) {
  const definition = STATUS_DEFINITIONS[first.id];

  return (
    first.id === second.id &&
    (definition.stackingScope !== "source" ||
      first.sourceId === second.sourceId)
  );
}

function getHealingReceivedMultiplier(statuses: ActiveStatus[]) {
  return statuses.reduce(
    (multiplier, status) =>
      Math.min(multiplier, status.healingReceivedMultiplier ?? 1),
    1,
  );
}

function applyStatusToTarget(
  state: CombatState,
  targetId: CombatantId,
  incomingStatus: ActiveStatus,
) {
  const target = getCombatant(state, targetId);

  if (!target || target.hp <= 0) {
    return { state, status: null, wasAlreadyActive: false };
  }

  const existingStatus = target.statuses.find((status) =>
    isSameStatusInstance(status, incomingStatus),
  );
  const definition = STATUS_DEFINITIONS[incomingStatus.id];
  const status = existingStatus && definition.stackingRule === "increaseTickPower"
    ? {
        ...existingStatus,
        appliedRound: incomingStatus.appliedRound,
        tickBasePower:
          (existingStatus.tickBasePower ??
            definition.endOfRoundDamage?.basePower ??
            0) + (definition.tickPowerIncreasePerApplication ?? 0),
      }
    : existingStatus && definition.stackingRule === "increaseMagnitude"
      ? {
          ...existingStatus,
          appliedRound: incomingStatus.appliedRound,
          magnitude: Math.min(
            definition.maxMagnitude ?? Number.POSITIVE_INFINITY,
            (existingStatus.magnitude ?? 0) +
              (incomingStatus.magnitude ?? 0),
          ),
        }
      : incomingStatus.id === "rootseed" && existingStatus
        ? existingStatus
        : refreshStatusWithoutDowngrade(existingStatus, incomingStatus);

  return {
    state: updateStatuses(state, targetId, [
      ...target.statuses.filter(
        (candidate) => !isSameStatusInstance(candidate, status),
      ),
      status,
    ]),
    status,
    wasAlreadyActive: Boolean(existingStatus),
  };
}

function spreadWildfireAfterEnemyDeath(
  state: CombatState,
  defeatedId: CombatantId,
  seed: number,
  burnOverride?: ActiveStatus,
) {
  if (isCharacterInstanceId(defeatedId)) {
    return { state, nextSeed: seed, statusChange: null };
  }

  const defeated = getCombatant(state, defeatedId);
  const burn =
    burnOverride ?? defeated?.statuses.find((status) => status.id === "burn");
  const source =
    burn && isCharacterInstanceId(burn.sourceId)
      ? state.characters[burn.sourceId]
      : null;
  const eligibleTargets = state.enemies.filter(
    (enemy) =>
      enemy.instanceId !== defeatedId &&
      isEnemyTargetable(enemy) &&
      !enemy.statuses.some((status) => status.id === "burn"),
  );

  if (
    !burn ||
    (burn.remainingRounds ?? 0) <= 0 ||
    !source ||
    !characterHasPassive(source, "wildfire") ||
    eligibleTargets.length === 0
  ) {
    return { state, nextSeed: seed, statusChange: null };
  }

  const roll = nextRandom(seed);
  const target =
    eligibleTargets[Math.floor(roll.value * eligibleTargets.length)];
  const spreadStatus: ActiveStatus = {
    ...burn,
    appliedRound: state.round,
  };
  const result = applyStatusToTarget(
    state,
    target.instanceId,
    spreadStatus,
  );

  return {
    state: result.state,
    nextSeed: roll.nextSeed,
    statusChange: result.status
      ? ({
          type: "applied",
          combatantId: target.instanceId,
          status: result.status,
        } satisfies StatusChange)
      : null,
  };
}

function consumeSpiritActiveUse(
  state: CombatState,
  characterId: CharacterInstanceId,
  spiritId: SpiritId,
): CombatState {
  const character = state.characters[characterId];
  const spirit = character.spirits[spiritId];

  if (!spirit) {
    return state;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: {
          ...character.spirits,
          [spiritId]: {
            ...spirit,
            activeUsesRemaining: Math.max(
              0,
              spirit.activeUsesRemaining - 1,
            ),
          },
        },
      },
    },
  };
}

function addSteelDartAbilityBonusStacks(
  state: CombatState,
  characterId: CharacterInstanceId,
  count: number,
): CombatState {
  const character = state.characters[characterId];
  const ironquill = character.spirits.ironquill;
  const amplifier = ironquill
    ? getSpiritPassive(ironquill).steelDartAbilityAmplifier
    : undefined;

  if (character.form !== "living" || !ironquill || !amplifier || count <= 0) {
    return state;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: {
          ...character.spirits,
          ironquill: {
            ...ironquill,
            steelDartAbilityBonusStacks:
              (ironquill.steelDartAbilityBonusStacks ?? 0) + count,
          },
        },
      },
    },
  };
}

function clearSteelDartAbilityBonusStacks(
  state: CombatState,
  characterId: CharacterInstanceId,
): CombatState {
  const character = state.characters[characterId];
  const ironquill = character.spirits.ironquill;

  if (!ironquill || (ironquill.steelDartAbilityBonusStacks ?? 0) === 0) {
    return state;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: {
          ...character.spirits,
          ironquill: {
            ...ironquill,
            steelDartAbilityBonusStacks: 0,
          },
        },
      },
    },
  };
}

function markSpiritEncounterPassiveTriggered(
  state: CombatState,
  characterId: CharacterInstanceId,
  spiritId: SpiritId,
): CombatState {
  const character = state.characters[characterId];
  const spirit = character.spirits[spiritId];

  if (!spirit) {
    return state;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: {
          ...character.spirits,
          [spiritId]: {
            ...spirit,
            passiveTriggeredThisEncounter: true,
          },
        },
      },
    },
  };
}

function actionCanTriggerGuardDog(
  effects: Array<{ type: string; statusId?: StatusId }>,
) {
  return !effects.some(
    (effect) =>
      effect.type === "damage" ||
      (effect.type === "applyStatus" &&
        effect.statusId !== undefined &&
        STATUS_DEFINITIONS[effect.statusId].endOfRoundDamage !== undefined),
  );
}

function physicalSpiritHitCanTriggerJaggedStrikes(abilityId: AbilityId) {
  // Ironquill's spectral projectiles explicitly count as Steel Darts, which
  // are excluded from Jagged Strikes just like inventory Steel Darts.
  return abilityId !== "ironquill";
}

function resolveGuardDogPassive(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
): {
  state: CombatState;
  nextSeed: number;
  event: CombatEvent | null;
} {
  const character = state.characters[characterId];
  const spirit = character.spirits.guardDog;
  const passive = spirit
    ? getSpiritPassive(spirit).nonDamagingActionSpiritAttack
    : undefined;
  const eligibleEnemies = state.enemies.filter(isEnemyTargetable);

  if (
    character.form !== "living" ||
    !spirit ||
    !passive ||
    eligibleEnemies.length === 0
  ) {
    return { state, nextSeed: seed, event: null };
  }

  const targetRoll = nextRandom(seed);
  const target =
    eligibleEnemies[
      Math.floor(targetRoll.value * eligibleEnemies.length)
    ];
  // Guard Dog deals true fixed damage: Defense and the normal damage
  // variance must not reduce its small, reliable passive hit.
  let amount = passive.basePower;

  if (
    characterHasPassive(character, "bloodScent") &&
    target.statuses.some((status) => status.id === "bleed")
  ) {
    amount = Math.max(
      1,
      Math.round(amount * (1 + PASSIVE_VALUES.bloodScentDamageBonus)),
    );
  }

  const barrierResult = absorbDirectDamage(target.barrier, amount);
  const remainingHp = Math.max(0, target.hp - barrierResult.hpDamage);
  let nextState = updateBarrier(
    state,
    target.instanceId,
    barrierResult.remainingBarrier,
  );
  nextState = updateHp(nextState, target.instanceId, remainingHp);
  let randomSeed = targetRoll.nextSeed;
  const statusChanges: StatusChange[] = [];

  if (
    remainingHp > 0 &&
    passive.damageType === "physical" &&
    characterHasPassive(character, "jaggedStrikes")
  ) {
    const jaggedRoll = nextRandom(randomSeed);
    randomSeed = jaggedRoll.nextSeed;

    if (jaggedRoll.value < PASSIVE_VALUES.jaggedStrikesChance) {
      const result = applyStatusToTarget(
        nextState,
        target.instanceId,
        createStatusFromSource(
          nextState,
          characterId,
          "bleed",
        ),
      );
      nextState = result.state;
      if (result.status) {
        statusChanges.push({
          type: "applied",
          combatantId: target.instanceId,
          status: result.status,
        });
      }
    }
  }

  if (remainingHp <= 0) {
    const wildfire = spreadWildfireAfterEnemyDeath(
      nextState,
      target.instanceId,
      randomSeed,
    );
    nextState = wildfire.state;
    randomSeed = wildfire.nextSeed;
    if (wildfire.statusChange) {
      statusChanges.push(wildfire.statusChange);
    }
  }

  return {
    state: nextState,
    nextSeed: randomSeed,
    event: {
      type: "spiritDamage",
      sourceId: characterId,
      targetId: target.instanceId,
      spiritId: "guardDog",
      damageType: passive.damageType,
      element: null,
      amount: barrierResult.hpDamage,
      remainingHp,
      absorbedByBarrier: barrierResult.absorbedByBarrier,
      remainingBarrier: barrierResult.remainingBarrier,
      isCritical: false,
      statusChanges,
    },
  };
}

function grantBarrierToTarget(
  state: CombatState,
  targetId: CombatantId,
  requestedAmount: number,
  sourceId?: CombatantId,
) {
  const target = getCombatant(state, targetId);

  if (!target) {
    return { state, grantedAmount: 0, sourceBarrierGranted: 0 };
  }

  let nextState = state;
  let barrierPower = requestedAmount;
  const baseRemainingBarrier = addBarrier(
    target.barrier,
    barrierPower,
    target.stats.maxHp,
  );

  if (
    baseRemainingBarrier > target.barrier &&
    isCharacterInstanceId(targetId) &&
    nextState.characters[targetId].form === "living"
  ) {
    const characterTarget = nextState.characters[targetId];
    const barrierPassives = Object.values(characterTarget.spirits).filter(
      (spirit) => {
        if (!spirit || spirit.passiveTriggeredThisEncounter) {
          return false;
        }

        return Boolean(
          getSpiritPassive(spirit).firstBarrierGainEachEncounter,
        );
      },
    );

    for (const spirit of barrierPassives) {
      if (!spirit) {
        continue;
      }

      const passive = getSpiritPassive(spirit).firstBarrierGainEachEncounter;

      if (!passive) {
        continue;
      }

      barrierPower += passive.additionalBarrier;
      nextState = markSpiritEncounterPassiveTriggered(
        nextState,
        targetId,
        spirit.id,
      );
    }
  }

  const remainingBarrier = addBarrier(
    target.barrier,
    barrierPower,
    target.stats.maxHp,
  );
  nextState = updateBarrier(nextState, targetId, remainingBarrier);

  let sourceBarrierGranted = 0;
  if (
    sourceId &&
    isCharacterInstanceId(sourceId) &&
    isCharacterInstanceId(targetId) &&
    sourceId !== targetId &&
    remainingBarrier > target.barrier &&
    characterHasPassive(nextState.characters[sourceId], "shieldmate")
  ) {
    const source = nextState.characters[sourceId];
    const sourceRemainingBarrier = addBarrier(
      source.barrier,
      PASSIVE_VALUES.shieldmateBarrier,
      source.stats.maxHp,
    );
    sourceBarrierGranted = sourceRemainingBarrier - source.barrier;
    nextState = updateBarrier(
      nextState,
      sourceId,
      sourceRemainingBarrier,
    );
  }

  return {
    state: nextState,
    grantedAmount: remainingBarrier - target.barrier,
    sourceBarrierGranted,
  };
}

function resolveBloodpact(
  state: CombatState,
  ownerId: CharacterInstanceId,
  hpCost: number,
  barrierAmount: number,
  active: boolean,
  events: CombatEvent[],
): CombatState {
  const roles = getActiveBloodpactRoles(state, ownerId);
  if (!roles) return state;

  const sacrifice = state.characters[roles.sacrificeId];
  let nextState = updateHp(state, roles.sacrificeId, sacrifice.hp - hpCost);
  const afterCost = nextState.characters[roles.sacrificeId];
  events.push({
    type: "bloodpact",
    actorId: ownerId,
    targetId: roles.sacrificeId,
    abilityId: "bloodpact",
    abilityRank: 1,
    stage: "sacrifice",
    active,
    hpLoss: Math.min(sacrifice.hp, hpCost),
    barrierAmount: 0,
    remainingHp: afterCost.hp,
    remainingBarrier: afterCost.barrier,
    characterState: getCharacterEventState(afterCost),
  });

  // Finish this payment even if it sent Sacrifice into Ghost Form.
  const barrierResult = grantBarrierToTarget(
    nextState, roles.protectedId, barrierAmount, ownerId,
  );
  nextState = barrierResult.state;
  const protectedCharacter = nextState.characters[roles.protectedId];
  const source = nextState.characters[ownerId];
  events.push({
    type: "bloodpact",
    actorId: ownerId,
    targetId: roles.protectedId,
    abilityId: "bloodpact",
    abilityRank: 1,
    stage: "protected",
    active,
    hpLoss: 0,
    barrierAmount: barrierResult.grantedAmount,
    remainingHp: protectedCharacter.hp,
    remainingBarrier: protectedCharacter.barrier,
    characterState: getCharacterEventState(protectedCharacter),
    secondaryImpacts: barrierResult.sourceBarrierGranted > 0
      ? [{
          targetId: ownerId,
          healingAmount: 0,
          remainingHp: source.hp,
          barrierAmount: barrierResult.sourceBarrierGranted,
          remainingBarrier: source.barrier,
          statusChanges: [],
          characterState: getCharacterEventState(source),
        }]
      : [],
  });
  return nextState;
}

function applyDamageLinkedAbilityHealing(
  state: CombatState,
  healerId: CharacterInstanceId,
  targetId: CharacterInstanceId,
  baseHealingPower: number,
) {
  let nextState = state;
  const healer = nextState.characters[healerId];
  const target = nextState.characters[targetId];
  const secondaryImpacts: MultiTargetSupportImpact[] = [];

  const recordSecondarySupport = (
    supportTargetId: CharacterInstanceId,
    values: { healingAmount?: number; barrierAmount?: number },
  ) => {
    const supportTarget = nextState.characters[supportTargetId];
    const existing = secondaryImpacts.find(
      (impact) => impact.targetId === supportTargetId,
    );

    if (existing) {
      existing.healingAmount += values.healingAmount ?? 0;
      existing.barrierAmount += values.barrierAmount ?? 0;
      existing.remainingHp = supportTarget.hp;
      existing.remainingBarrier = supportTarget.barrier;
      existing.remainingPp = supportTarget.pp;
      return;
    }

    secondaryImpacts.push({
      targetId: supportTargetId,
      healingAmount: values.healingAmount ?? 0,
      remainingHp: supportTarget.hp,
      barrierAmount: values.barrierAmount ?? 0,
      remainingBarrier: supportTarget.barrier,
      remainingPp: supportTarget.pp,
      statusChanges: [],
      characterState: getCharacterEventState(supportTarget),
    });
  };

  let healingPower = Math.max(0, baseHealingPower);
  let healingAmount = 0;
  let barrierAmount = 0;

  if (healingPower > 0 && target.hp < getCharacterMaxHp(target)) {
    if (
      characterHasPassive(healer, "shelteredRecovery") &&
      target.barrier > 0
    ) {
      healingPower += PASSIVE_VALUES.shelteredRecoveryHealing;
    }

    if (
      characterHasPassive(healer, "triage") &&
      target.hp / getCharacterMaxHp(target) < PASSIVE_VALUES.triageThreshold
    ) {
      healingPower += PASSIVE_VALUES.triageHealing;
    }

    const lifeCurrentTriggers =
      characterHasPassive(healer, "lifeCurrent") &&
      !healer.passiveCombatState.firstHealUsed;

    if (lifeCurrentTriggers) {
      healingPower = Math.round(
        healingPower * PASSIVE_VALUES.lifeCurrentMultiplier,
      );
    }

    healingPower += getPartyHealingReceivedBonus(nextState);
    healingPower = applyGhostReceivedHealing(target, healingPower);
    healingPower = Math.round(
      healingPower * getHealingReceivedMultiplier(target.statuses),
    );

    const remainingHp = Math.min(
      getCharacterMaxHp(target),
      target.hp + healingPower,
    );
    healingAmount = remainingHp - target.hp;
    nextState = updateHp(nextState, targetId, remainingHp);

    if (healingAmount > 0) {
      if (lifeCurrentTriggers) {
        nextState = {
          ...nextState,
          characters: {
            ...nextState.characters,
            [healerId]: {
              ...nextState.characters[healerId],
              passiveCombatState: {
                ...nextState.characters[healerId].passiveCombatState,
                firstHealUsed: true,
              },
            },
          },
        };
      }

      if (targetId !== healerId) {
        if (characterHasPassive(healer, "refreshingWaters")) {
          const ally = nextState.characters[targetId];
          nextState = updatePp(
            nextState,
            targetId,
            Math.min(
              getCharacterMaxPp(ally),
              ally.pp + PASSIVE_VALUES.refreshingWatersPp,
            ),
          );
        }

        if (characterHasPassive(healer, "sharedRecovery")) {
          const currentHealer = nextState.characters[healerId];
          const selfHealingPower =
            PASSIVE_VALUES.sharedRecoveryHealing +
            getPartyHealingReceivedBonus(nextState);
          const selfRemainingHp = Math.min(
            getCharacterMaxHp(currentHealer),
            currentHealer.hp + selfHealingPower,
          );
          const selfHealingAmount = selfRemainingHp - currentHealer.hp;
          nextState = updateHp(nextState, healerId, selfRemainingHp);

          if (selfHealingAmount > 0) {
            recordSecondarySupport(healerId, {
              healingAmount: selfHealingAmount,
            });
          }
        }
      }

      if (characterHasPassive(healer, "lastingCare")) {
        const barrierResult = grantBarrierToTarget(
          nextState,
          targetId,
          PASSIVE_VALUES.lastingCareBarrier,
          healerId,
        );
        nextState = barrierResult.state;
        barrierAmount += barrierResult.grantedAmount;

        if (barrierResult.sourceBarrierGranted > 0) {
          recordSecondarySupport(healerId, {
            barrierAmount: barrierResult.sourceBarrierGranted,
          });
        }
      }
    }
  }

  const healedTarget = nextState.characters[targetId];

  return {
    state: nextState,
    impact: {
      targetId,
      healingAmount,
      remainingHp: healedTarget.hp,
      barrierAmount,
      remainingBarrier: healedTarget.barrier,
      remainingPp: healedTarget.pp,
      statusChanges: [],
      characterState: getCharacterEventState(healedTarget),
    } satisfies MultiTargetSupportImpact,
    secondaryImpacts,
  };
}

function applyTwinFlamesPartyHealing(
  state: CombatState,
  healerId: CharacterInstanceId,
  amount: number,
) {
  let nextState = state;
  const collectedImpacts: MultiTargetSupportImpact[] = [];

  for (const targetId of CHARACTER_ORDER) {
    const result = applyDamageLinkedAbilityHealing(
      nextState,
      healerId,
      targetId,
      amount,
    );
    nextState = result.state;
    collectedImpacts.push(result.impact, ...result.secondaryImpacts);
  }

  const impacts = collectedImpacts.reduce<MultiTargetSupportImpact[]>(
    (merged, impact) => {
      const existing = merged.find(
        (candidate) => candidate.targetId === impact.targetId,
      );

      if (!existing) {
        merged.push({ ...impact });
        return merged;
      }

      existing.healingAmount += impact.healingAmount;
      existing.barrierAmount += impact.barrierAmount;
      existing.remainingHp = impact.remainingHp;
      existing.remainingBarrier = impact.remainingBarrier;
      existing.remainingPp = impact.remainingPp;
      existing.characterState = impact.characterState;
      existing.statusChanges.push(...impact.statusChanges);
      return merged;
    },
    [],
  );

  return { state: nextState, impacts };
}

function resolveEndOfRoundStatuses(
  state: CombatState,
  events: CombatEvent[],
  seed: number,
) {
  let nextState = state;
  let randomSeed = seed;
  const combatantIds: CombatantId[] = [
    ...CHARACTER_ORDER,
    ...nextState.enemies.map((enemy) => enemy.instanceId),
  ];

  for (const combatantId of combatantIds) {
    const combatant = getCombatant(nextState, combatantId);
    const endOfRoundStatuses =
      combatant?.statuses.filter(
        (status) => STATUS_DEFINITIONS[status.id].endOfRoundDamage,
      ) ?? [];

    for (const status of endOfRoundStatuses) {
      const currentCombatant = getCombatant(nextState, combatantId);
      const definition = STATUS_DEFINITIONS[status.id];
      const damage = definition.endOfRoundDamage;

      if (!currentCombatant || currentCombatant.hp <= 0 || !damage) {
        break;
      }

      const ticksTriggered = status.ticksTriggered ?? 0;
      const isEmpowered =
        status.empowerAfterTicks !== undefined &&
        ticksTriggered >= status.empowerAfterTicks;
      const tickBasePower = isEmpowered
        ? (status.empoweredTickBasePower ??
          status.tickBasePower ??
          damage.basePower)
        : (status.tickBasePower ?? damage.basePower);
      let amount = damage.ignoresMitigation
        ? Math.max(1, Math.round(tickBasePower))
        : calculateFixedDamage({
            basePower: tickBasePower,
            damageType: damage.damageType,
            defender: currentCombatant.stats,
            defenderStatuses: currentCombatant.statuses,
          });
      if (isCharacterInstanceId(combatantId)) {
        amount = applyGhostIncomingDamage(
          nextState.characters[combatantId],
          amount,
        );
      }
      const calculatedRemainingHp = Math.max(
        0,
        currentCombatant.hp - amount,
      );
      const persistsUntilCombatEnd =
        definition.persistsUntilCombatEnd === true;
      const remainingRounds = persistsUntilCombatEnd
        ? undefined
        : (status.remainingRounds ?? 1) - 1;
      const statusChanges: StatusChange[] = [];
      const previousCharacterForm = isCharacterInstanceId(combatantId)
        ? nextState.characters[combatantId].form
        : null;
      const characterBeforeLethalStatus = isCharacterInstanceId(combatantId)
        ? nextState.characters[combatantId]
        : null;
      const soulTransfer =
        calculatedRemainingHp <= 0 &&
        !isCharacterInstanceId(status.sourceId) &&
        isCharacterInstanceId(combatantId)
          ? resolveSoulTransfer(nextState, combatantId, amount)
          : null;

      if (soulTransfer) {
        nextState = soulTransfer.state;
      } else {
        nextState = updateHp(nextState, combatantId, calculatedRemainingHp);
      }
      const phoenixRebirth =
        characterBeforeLethalStatus && isCharacterInstanceId(combatantId)
          ? getPhoenixRebirthEvent(
              characterBeforeLethalStatus,
              nextState.characters[combatantId],
            )
          : null;
      const remainingHp = soulTransfer || phoenixRebirth
        ? 0
        : (getCombatant(nextState, combatantId)?.hp ?? 0);
      const actualRemainingHp =
        getCombatant(nextState, combatantId)?.hp ?? 0;
      let sourceHealingAmount = 0;
      let sourceRemainingHp: number | undefined;

      if (
        status.sourceHealingPerTick !== undefined &&
        isCharacterInstanceId(status.sourceId)
      ) {
        const source = nextState.characters[status.sourceId];

        if (source.form === "living" && source.hp > 0) {
          const maxHp = getCharacterMaxHp(source);
          const baseHealing = isEmpowered
            ? (status.empoweredSourceHealingPerTick ??
              status.sourceHealingPerTick)
            : status.sourceHealingPerTick;
          const healingWithRiverheart =
            baseHealing + getPartyHealingReceivedBonus(nextState);
          sourceRemainingHp = Math.min(maxHp, source.hp + healingWithRiverheart);
          sourceHealingAmount = sourceRemainingHp - source.hp;

          if (sourceHealingAmount > 0) {
            nextState = updateHp(
              nextState,
              status.sourceId,
              sourceRemainingHp,
            );
          }
        }
      }
      const characterChangedForm =
        isCharacterInstanceId(combatantId) &&
        nextState.characters[combatantId].form !== previousCharacterForm;
      const characterEndedStatusCycle = characterChangedForm || phoenixRebirth !== null;

      if (characterEndedStatusCycle) {
        statusChanges.push(
          ...currentCombatant.statuses.map((activeStatus) => ({
            type: "removed" as const,
            combatantId,
            statusId: activeStatus.id,
          })),
        );
      } else if (persistsUntilCombatEnd && actualRemainingHp > 0) {
        if (status.id === "rootseed") {
          const refreshedStatus = {
            ...status,
            ticksTriggered: ticksTriggered + 1,
          };
          nextState = updateStatuses(
            nextState,
            combatantId,
            currentCombatant.statuses.map((candidate) =>
              isSameStatusInstance(candidate, status)
                ? refreshedStatus
                : candidate,
            ),
          );
          statusChanges.push({
            type: "applied",
            combatantId,
            status: refreshedStatus,
          });
        }
      } else if ((remainingRounds ?? 0) > 0 && actualRemainingHp > 0) {
        const refreshedStatus = { ...status, remainingRounds };
        nextState = updateStatuses(
          nextState,
          combatantId,
          currentCombatant.statuses.map((candidate) =>
            isSameStatusInstance(candidate, status)
              ? refreshedStatus
              : candidate,
          ),
        );
        statusChanges.push({
          type: "applied",
          combatantId,
          status: refreshedStatus,
        });
      } else {
        nextState = updateStatuses(
          nextState,
          combatantId,
          currentCombatant.statuses.filter(
            (candidate) => !isSameStatusInstance(candidate, status),
          ),
        );
        statusChanges.push({
          type: "removed",
          combatantId,
          statusId: status.id,
          sourceId: status.sourceId,
        });
      }

      if (remainingHp <= 0 && status.id === "burn") {
        const wildfire = spreadWildfireAfterEnemyDeath(
          nextState,
          combatantId,
          randomSeed,
          { ...status, remainingRounds },
        );
        nextState = wildfire.state;
        randomSeed = wildfire.nextSeed;
        if (wildfire.statusChange) {
          statusChanges.push(wildfire.statusChange);
        }
      }

      events.push({
        type: "statusDamage",
        sourceId: status.sourceId,
        targetId: combatantId,
        statusId: status.id,
        element: damage.element,
        amount,
        remainingHp,
        isCritical: false,
        statusChanges,
        characterState: phoenixRebirth && characterBeforeLethalStatus
          ? getCharacterEventState(characterBeforeLethalStatus)
          : getEventCharacterState(nextState, combatantId),
        sourceHealingAmount,
        sourceRemainingHp,
        sourceCharacterState:
          sourceRemainingHp !== undefined
            ? getEventCharacterState(nextState, status.sourceId)
            : undefined,
      });

      if (phoenixRebirth) {
        events.push(phoenixRebirth);
      }

      if (soulTransfer) {
        events.push({
          ...soulTransfer.event,
          ghostCharacterState: getCharacterEventState(
            nextState.characters[soulTransfer.event.ghostId],
          ),
          targetCharacterState: getCharacterEventState(
            nextState.characters[soulTransfer.event.targetId],
          ),
        });
      }

      if (characterEndedStatusCycle) {
        break;
      }
    }
  }

  return { state: nextState, nextSeed: randomSeed };
}

function advanceTimedNonDamageStatuses(state: CombatState): CombatState {
  const advanceStatuses = (statuses: ActiveStatus[]) =>
    statuses.flatMap((status) => {
      const definition = STATUS_DEFINITIONS[status.id];

      if (
        definition.durationRounds === undefined ||
        definition.endOfRoundDamage
      ) {
        return [status];
      }

      const remainingRounds =
        (status.remainingRounds ?? definition.durationRounds) - 1;

      return remainingRounds > 0 ? [{ ...status, remainingRounds }] : [];
    });

  return {
    ...state,
    characters: {
      "character-1": {
        ...state.characters["character-1"],
        statuses: advanceStatuses(state.characters["character-1"].statuses),
      },
      "character-2": {
        ...state.characters["character-2"],
        statuses: advanceStatuses(state.characters["character-2"].statuses),
      },
    },
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      statuses: advanceStatuses(enemy.statuses),
    })),
  };
}

function isSourcePartner(
  attackerId: CombatantId,
  sourceId: CombatantId,
) {
  return (
    isCharacterInstanceId(attackerId) &&
    isCharacterInstanceId(sourceId) &&
    attackerId !== sourceId
  );
}

function spendPp(
  state: CombatState,
  id: CombatantId,
  amount: number,
): CombatState {
  if (amount === 0) {
    return state;
  }

  if (isCharacterInstanceId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...character, pp: character.pp - amount },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, pp: enemy.pp - amount } : enemy,
    ),
  };
}

const POST_COMBAT_HP_RECOVERY = 5;
const POST_COMBAT_PP_RECOVERY = 5;

function restoreLivingCharactersAfterCombat(
  state: CombatState,
): CombatState {
  return {
    ...state,
    characters: {
      "character-1": {
        ...state.characters["character-1"],
        hp:
          state.characters["character-1"].form === "living"
            ? Math.min(
                getCharacterMaxHp(state.characters["character-1"]),
                state.characters["character-1"].hp +
                  POST_COMBAT_HP_RECOVERY,
              )
            : state.characters["character-1"].hp,
        pp:
          state.characters["character-1"].form === "living"
            ? Math.min(
                state.characters["character-1"].stats.maxPp,
                state.characters["character-1"].pp +
                  POST_COMBAT_PP_RECOVERY,
              )
            : state.characters["character-1"].pp,
      },
      "character-2": {
        ...state.characters["character-2"],
        hp:
          state.characters["character-2"].form === "living"
            ? Math.min(
                getCharacterMaxHp(state.characters["character-2"]),
                state.characters["character-2"].hp +
                  POST_COMBAT_HP_RECOVERY,
              )
            : state.characters["character-2"].hp,
        pp:
          state.characters["character-2"].form === "living"
            ? Math.min(
                state.characters["character-2"].stats.maxPp,
                state.characters["character-2"].pp +
                  POST_COMBAT_PP_RECOVERY,
              )
            : state.characters["character-2"].pp,
      },
    },
  };
}

function createPostCombatRecoveryEvent(
  before: CombatState,
  after: CombatState,
): CombatEvent {
  return {
    type: "postCombatRecovery",
    impacts: CHARACTER_ORDER.map((targetId) => ({
      targetId,
      hpRestored:
        after.characters[targetId].hp - before.characters[targetId].hp,
      ppRestored:
        after.characters[targetId].pp - before.characters[targetId].pp,
      remainingHp: after.characters[targetId].hp,
      remainingPp: after.characters[targetId].pp,
    })),
  };
}

function completeVictory(state: CombatState, seed: number): CombatState {
  const recoveredState = restoreLivingCharactersAfterCombat(state);
  const nextEncounterId =
    ENCOUNTER_DEFINITIONS[recoveredState.encounterId].nextEncounterId;

  if (
    nextEncounterId &&
    ENCOUNTER_DEFINITIONS[nextEncounterId].kind === "rest" &&
    ENCOUNTER_DEFINITIONS[recoveredState.encounterId].skipRewardsBeforeRest
  ) {
    const generatedItems = grantEncounterItemRewards(
      { ...recoveredState, randomSeed: seed },
      seed,
    );
    const restState = startEncounter(
      {
        ...generatedItems.state,
        randomSeed: generatedItems.nextSeed,
      },
      nextEncounterId,
    );

    return {
      ...restState,
      itemRewards: generatedItems.rewards,
    };
  }

  let randomSeed = seed;
  let rewardOffers = recoveredState.rewardOffers;

  if (!rewardOffers) {
    const generatedRewards = generateRewardOffers(recoveredState, randomSeed);
    rewardOffers = generatedRewards.offers;
    randomSeed = generatedRewards.nextSeed;
  }

  let nextState: CombatState = {
    ...recoveredState,
    phase: "victory",
    randomSeed,
    rewardOffers,
    characters: {
      "character-1": {
        ...recoveredState.characters["character-1"],
        barrier: 0,
        itemDamageBonus: null,
        abilityDamageBonus: null,
      },
      "character-2": {
        ...recoveredState.characters["character-2"],
        barrier: 0,
        itemDamageBonus: null,
        abilityDamageBonus: null,
      },
    },
  };

  if (!nextState.itemRewards) {
    const generatedItems = grantEncounterItemRewards(nextState, randomSeed);
    nextState = {
      ...generatedItems.state,
      randomSeed: generatedItems.nextSeed,
      itemRewards: generatedItems.rewards,
    };
  }

  return nextState;
}

export function resolveImmediateItemUse(
  state: CombatState,
  action: ItemCombatAction,
) {
  const definition = ITEM_DEFINITIONS[action.itemId];
  const actor = state.characters[action.actorId];
  const useProfile = definition
    ? getItemUseProfile(definition, actor.form)
    : null;

  if (
    useProfile?.resolutionTiming !== "preRound" ||
    actor.statuses.some((status) => status.id === "stunned")
  ) {
    return null;
  }

  const result = resolveItemUse(state, action, state.randomSeed);

  if (!result || result.nextState.enemies.some((enemy) => enemy.hp > 0)) {
    return result
      ? {
          ...result,
          nextState: { ...result.nextState, randomSeed: result.nextSeed },
        }
      : null;
  }

  return {
    ...result,
    nextState: completeVictory(result.nextState, result.nextSeed),
  };
}

function resolveItemUse(
  state: CombatState,
  action: ItemCombatAction,
  seed: number,
  options: {
    itemAlreadyConsumed?: boolean;
    allowDefeatedActor?: boolean;
  } = {},
): {
  nextState: CombatState;
  event: ItemUseEvent;
  followUpEvents: PhoenixRebirthEvent[];
  nextSeed: number;
} | null {
  const definition = ITEM_DEFINITIONS[action.itemId];
  const actor = state.characters[action.actorId];
  const useProfile = definition
    ? getItemUseProfile(definition, actor.form)
    : null;

  if (
    !definition ||
    (!options.allowDefeatedActor && !useProfile) ||
    (!options.itemAlreadyConsumed &&
      (actor.inventory[action.itemId] ?? 0) <= 0)
  ) {
    return null;
  }

  const requestedTargetIds: CombatantId[] =
    definition.target === "allEnemies"
      ? state.enemies
          .filter(isEnemyTargetable)
          .map((enemy) => enemy.instanceId)
      : definition.target === "allAllies"
        ? CHARACTER_ORDER.filter(
            (characterId) => state.characters[characterId].hp > 0,
          )
        : definition.target === "self"
          ? [action.actorId]
          : action.targetId
            ? [action.targetId]
            : [];
  const targetIds = requestedTargetIds.filter((targetId) => {
    const target = getCombatant(state, targetId);

    return target && "enemyId" in target
      ? isEnemyTargetable(target)
      : target !== undefined;
  });

  if (targetIds.length === 0) {
    return null;
  }

  let nextState = options.itemAlreadyConsumed
    ? state
    : consumeItem(state, action.actorId, action.itemId);
  const impacts: ItemUseImpact[] = [];
  const phoenixRebirthEvents: PhoenixRebirthEvent[] = [];
  const characterBeforeRebirth = new Map<CharacterInstanceId, CombatState["characters"][CharacterInstanceId]>();
  let randomSeed = seed;

  for (const targetId of targetIds) {
    let damageAmount = 0;
    let absorbedByBarrier = 0;
    let healingAmount = 0;
    let ppRestored = 0;
    let barrierAmount = 0;
    let revived = false;
    const statusChanges: StatusChange[] = [];

    for (const effect of useProfile?.effects ?? definition.effects) {
      const currentTarget = getCombatant(nextState, targetId);

      if (!currentTarget) {
        continue;
      }

      if (effect.type === "damage") {
        if (currentTarget.hp <= 0) {
          continue;
        }

        const bombardierMultiplier =
          (action.itemId === "blastBomb" || action.itemId === "razorBomb") &&
          characterHasPassive(actor, "bombardier")
            ? 1 + PASSIVE_VALUES.bombardierDamageBonus
            : 1;
        let mitigatedDamage = calculateFixedDamage({
          basePower: Math.round(effect.amount * bombardierMultiplier),
          damageType: effect.damageType,
          defender: currentTarget.stats,
          defenderStatuses: currentTarget.statuses,
        });
        if (effect.usesDamageVariance) {
          const varianceResult = nextRandom(randomSeed);
          randomSeed = varianceResult.nextSeed;
          mitigatedDamage = applyDamageVariance(
            mitigatedDamage,
            varianceResult.value,
          );
        }
        if (
          effect.damageType !== "true" &&
          characterHasPassive(actor, "bloodScent") &&
          currentTarget.statuses.some((status) => status.id === "bleed")
        ) {
          mitigatedDamage = Math.max(
            1,
            Math.round(
              mitigatedDamage *
                (1 + PASSIVE_VALUES.bloodScentDamageBonus),
            ),
          );
        }
        const barrierResult = absorbDirectDamage(
          currentTarget.barrier,
          mitigatedDamage,
        );
        const remainingHp = Math.max(
          0,
          currentTarget.hp - barrierResult.hpDamage,
        );
        damageAmount += barrierResult.hpDamage;
        absorbedByBarrier += barrierResult.absorbedByBarrier;
        nextState = updateBarrier(
          nextState,
          targetId,
          barrierResult.remainingBarrier,
        );
        nextState = updateHp(nextState, targetId, remainingHp);

        if (
          remainingHp > 0 &&
          (action.itemId === "throwingKnife" ||
            action.itemId === "razorBomb") &&
          characterHasPassive(actor, "jaggedStrikes")
        ) {
          const jaggedRoll = nextRandom(randomSeed);
          randomSeed = jaggedRoll.nextSeed;

          if (jaggedRoll.value < PASSIVE_VALUES.jaggedStrikesChance) {
            const result = applyStatusToTarget(
              nextState,
              targetId,
              createStatusFromSource(
                nextState,
                action.actorId,
                "bleed",
              ),
            );
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: targetId,
                status: result.status,
              });
            }
          }
        }

        if (remainingHp <= 0) {
          const wildfire = spreadWildfireAfterEnemyDeath(
            nextState,
            targetId,
            randomSeed,
          );
          nextState = wildfire.state;
          randomSeed = wildfire.nextSeed;
          if (wildfire.statusChange) {
            statusChanges.push(wildfire.statusChange);
          }
        }
        continue;
      }

      if (effect.type === "restoreHp") {
        if (currentTarget.hp <= 0) {
          continue;
        }

        const receivedHealingBonus = isCharacterInstanceId(targetId)
          ? getPartyHealingReceivedBonus(nextState)
          : 0;
        const baseHealing = effect.amount + receivedHealingBonus;
        const healingAfterFormModifier = isCharacterInstanceId(targetId)
          ? applyGhostReceivedHealing(
              nextState.characters[targetId],
              baseHealing,
            )
          : baseHealing;
        const receivedHealing = Math.round(
          healingAfterFormModifier *
            getHealingReceivedMultiplier(currentTarget.statuses),
        );
        const maxHp = isCharacterInstanceId(targetId)
          ? getCharacterMaxHp(nextState.characters[targetId])
          : currentTarget.stats.maxHp;
        const remainingHp = Math.min(
          maxHp,
          currentTarget.hp + receivedHealing,
        );
        healingAmount += remainingHp - currentTarget.hp;
        nextState = updateHp(nextState, targetId, remainingHp);
        continue;
      }

      if (effect.type === "restoreGhostHp") {
        if (
          !isCharacterInstanceId(targetId) ||
          currentTarget.hp <= 0 ||
          nextState.characters[targetId].form !== "ghost"
        ) {
          continue;
        }

        const remainingHp = Math.min(
          getCharacterMaxHp(nextState.characters[targetId]),
          currentTarget.hp + effect.amount,
        );
        healingAmount += remainingHp - currentTarget.hp;
        nextState = updateHp(nextState, targetId, remainingHp);
        continue;
      }

      if (effect.type === "directHpLoss") {
        if (!isCharacterInstanceId(targetId) || currentTarget.hp <= 0) {
          continue;
        }

        const characterBeforeHpLoss = nextState.characters[targetId];
        const hpLoss = Math.min(effect.amount, currentTarget.hp);
        damageAmount += hpLoss;
        nextState = updateHp(nextState, targetId, currentTarget.hp - hpLoss);
        const phoenixRebirth = getPhoenixRebirthEvent(
          characterBeforeHpLoss,
          nextState.characters[targetId],
        );
        if (phoenixRebirth) {
          phoenixRebirthEvents.push(phoenixRebirth);
          characterBeforeRebirth.set(targetId, characterBeforeHpLoss);
        }
        continue;
      }

      if (effect.type === "restorePp") {
        if (
          isCharacterInstanceId(targetId) &&
          nextState.characters[targetId].form !== "living"
        ) {
          continue;
        }
        const remainingPp = Math.min(
          currentTarget.stats.maxPp,
          currentTarget.pp + effect.amount,
        );
        ppRestored += remainingPp - currentTarget.pp;
        nextState = updatePp(nextState, targetId, remainingPp);
        continue;
      }

      if (effect.type === "grantBarrier") {
        if (currentTarget.hp <= 0) {
          continue;
        }

        const result = grantBarrierToTarget(
          nextState,
          targetId,
          effect.amount,
          action.actorId,
        );
        nextState = result.state;
        barrierAmount += result.grantedAmount;
        continue;
      }

      if (effect.type === "cleanse") {
        if (
          isCharacterInstanceId(targetId) &&
          nextState.characters[targetId].form !== "living"
        ) {
          continue;
        }
        const statusesToRemove =
          effect.statusIds === "all"
            ? currentTarget.statuses
            : currentTarget.statuses.filter((status) =>
                effect.statusIds.includes(status.id),
              );

        if (statusesToRemove.length > 0) {
          nextState = updateStatuses(
            nextState,
            targetId,
            currentTarget.statuses.filter(
              (status) =>
                !statusesToRemove.some(
                  (removedStatus) => removedStatus.id === status.id,
                ),
            ),
          );
          statusChanges.push(
            ...statusesToRemove.map((status) => ({
              type: "removed" as const,
              combatantId: targetId,
              statusId: status.id,
            })),
          );
        }
        continue;
      }

      if (effect.type === "applyStatus") {
        if (currentTarget.hp <= 0) {
          continue;
        }

        const incomingStatus = createStatusFromSource(
          nextState,
          action.actorId,
          effect.statusId,
          {
            magnitude: effect.magnitude,
            durationRounds: effect.durationRounds,
          },
        );
        const result = applyStatusToTarget(
          nextState,
          targetId,
          incomingStatus,
        );
        nextState = result.state;
        if (result.status) {
          statusChanges.push({
            type: "applied",
            combatantId: targetId,
            status: result.status,
          });
        }
        continue;
      }

      if (effect.type === "nextDamagingAbilityBonus") {
        const currentBonus = nextState.characters[action.actorId].itemDamageBonus;
        nextState = {
          ...nextState,
          characters: {
            ...nextState.characters,
            [action.actorId]: {
              ...nextState.characters[action.actorId],
              itemDamageBonus: {
                amount:
                  (currentBonus?.expiresRound === state.round
                    ? currentBonus.amount
                    : 0) + effect.amount,
                expiresRound: state.round,
              },
            },
          },
        };
        continue;
      }

      if (effect.type === "revive") {
        if (
          !isCharacterInstanceId(targetId) ||
          nextState.characters[targetId].form !== "ghost"
        ) {
          continue;
        }

        const phoenixTonicBonus =
          actor.spirits.phoenix
            ? (getSpiritPassive(actor.spirits.phoenix)
                .phoenixTonicReviveBonus?.amount ?? 0)
            : 0;
        const revivedState = reviveGhost(
          nextState,
          targetId,
          effect.hp + phoenixTonicBonus,
        );
        if (!revivedState) {
          continue;
        }
        nextState = revivedState;
        healingAmount += nextState.characters[targetId].hp;
        revived = true;
      }
    }

    const targetAfterItem = getCombatant(nextState, targetId);
    const rebirthBeforeState = isCharacterInstanceId(targetId)
      ? characterBeforeRebirth.get(targetId)
      : undefined;

    if (targetAfterItem) {
      impacts.push({
        targetId,
        damageAmount,
        absorbedByBarrier,
        healingAmount,
        ppRestored,
        barrierAmount,
        remainingHp: rebirthBeforeState ? 0 : targetAfterItem.hp,
        remainingPp: targetAfterItem.pp,
        remainingBarrier: rebirthBeforeState
          ? rebirthBeforeState.barrier
          : targetAfterItem.barrier,
        revived,
        statusChanges,
        characterState: rebirthBeforeState
          ? getCharacterEventState(rebirthBeforeState)
          : getEventCharacterState(nextState, targetId),
      });
    }
  }

  if (action.itemId === "steelDart") {
    nextState = addSteelDartAbilityBonusStacks(
      nextState,
      action.actorId,
      1,
    );
  }

  const actorAfterTriggers = nextState.characters[action.actorId];

  return {
    nextState,
    nextSeed: randomSeed,
    followUpEvents: phoenixRebirthEvents,
    event: {
      type: "itemUse",
      actorId: action.actorId,
      itemId: action.itemId,
      targetId: action.targetId,
      visualPhase: "impact",
      impacts,
      remainingQuantity: actorAfterTriggers.inventory[action.itemId] ?? 0,
      damageBonus: actorAfterTriggers.itemDamageBonus,
    },
  };
}

function getSelectedPlayerActions(
  state: CombatState,
  selections: RoundSelections,
  includeReadiedAbilities = true,
) {
  const actions: Array<{
    action: CombatAction;
    requiredPossessionSourceId: CharacterInstanceId | null;
    isQuickAction: boolean;
  }> = [];

  for (const characterId of CHARACTER_ORDER) {
    const selection = selections[characterId];
    actions.push(
      ...selection.quickActions.map((action) => ({
        action,
        requiredPossessionSourceId: null,
        isQuickAction: true,
      })),
    );

    if (selection.action) {
      actions.push({
        action: selection.action,
        requiredPossessionSourceId: null,
        isQuickAction: false,
      });
    }

    if (selection.bonusAction) {
      const sourceEntry = CHARACTER_ORDER.map((sourceId) => ({
        sourceId,
        action: selections[sourceId].action,
      })).find(
        ({ action }) =>
          action?.kind === "ability" &&
          action.abilityId === "possession" &&
          action.targetId === characterId,
      );

      if (sourceEntry) {
        actions.push({
          action: selection.bonusAction,
          requiredPossessionSourceId: sourceEntry.sourceId,
          isQuickAction: false,
        });
      }
    }

    const charge = state.characters[characterId].statuses.find(
      (status) => status.id === "abilityCharge",
    );

    if (
      includeReadiedAbilities &&
      state.characters[characterId].form === "living" &&
      charge?.readiedAbilityId &&
      charge.readiedTargetId
    ) {
      actions.push({
        action: {
          kind: "ability",
          actorId: characterId,
          abilityId: charge.readiedAbilityId,
          targetId: charge.readiedTargetId,
          isChargeRelease: true,
        },
        requiredPossessionSourceId: null,
        isQuickAction: false,
      });
    }
  }

  return actions;
}

export function resolveImmediateWarhoundAutoAttack(
  state: CombatState,
  action: AbilityCombatAction,
): RoundResult | null {
  if (
    state.phase !== "selectingActions" ||
    action.abilityId !== "autoAttack" ||
    !isCharacterInstanceId(action.actorId) ||
    action.targetId === null ||
    isCharacterInstanceId(action.targetId)
  ) {
    return null;
  }

  const actor = state.characters[action.actorId];
  const warhound = actor.spirits.warhound;
  const target = state.enemies.find(
    (enemy) => enemy.instanceId === action.targetId,
  );

  if (
    actor.form !== "living" ||
    actor.statuses.some(
      (status) => status.id === "stunned" || status.id === "abilityCharge",
    ) ||
    !getKnownAbilityRank(actor.abilityRanks, "autoAttack") ||
    !warhound ||
    warhound.passiveTriggeredThisEncounter ||
    !getSpiritPassive(warhound).firstAutoAttackEachEncounterIsQuick ||
    !target ||
    !isEnemyTargetable(target)
  ) {
    return null;
  }

  const triggeredState = markSpiritEncounterPassiveTriggered(
    state,
    action.actorId,
    "warhound",
  );
  const selections: RoundSelections = {
    "character-1": { action: null, bonusAction: null, quickActions: [] },
    "character-2": { action: null, bonusAction: null, quickActions: [] },
  };
  selections[action.actorId].quickActions.push(action);

  const result = resolveRound(triggeredState, selections, {
    immediateActionsOnly: true,
  });

  return result.events.length > 0 ? result : null;
}

export function resolveImmediateQuickAbility(
  state: CombatState,
  action: AbilityCombatAction,
): RoundResult | null {
  if (
    state.phase !== "selectingActions" ||
    !isCharacterInstanceId(action.actorId)
  ) {
    return null;
  }

  const actor = state.characters[action.actorId];
  const ability = getCombatantAbility(state, action.actorId, action.abilityId);

  if (
    actor.form !== "living" ||
    actor.statuses.some(
      (status) => status.id === "stunned" || status.id === "abilityCharge",
    ) ||
    ability?.useTiming !== "quickAction"
  ) {
    return null;
  }

  const selections: RoundSelections = {
    "character-1": { action: null, bonusAction: null, quickActions: [] },
    "character-2": { action: null, bonusAction: null, quickActions: [] },
  };
  selections[action.actorId].quickActions.push(action);
  const result = resolveRound(state, selections, {
    immediateActionsOnly: true,
  });

  return result.events.length > 0 ? result : null;
}

export function resolveRound(
  state: CombatState,
  selections: RoundSelections,
  options: { immediateActionsOnly?: boolean } = {},
): RoundResult {
  if (state.phase !== "selectingActions") {
    return { nextState: state, events: [] };
  }
  let nextState: CombatState = {
    ...state,
    characters: {
      "character-1": {
        ...state.characters["character-1"],
        spirits: { ...state.characters["character-1"].spirits },
        statuses: [...state.characters["character-1"].statuses],
      },
      "character-2": {
        ...state.characters["character-2"],
        spirits: { ...state.characters["character-2"].spirits },
        statuses: [...state.characters["character-2"].statuses],
      },
    },
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      statuses: [...enemy.statuses],
    })),
  };

  let randomSeed = state.randomSeed;
  const orderedActions = [
    ...getSelectedPlayerActions(
      state,
      selections,
      !options.immediateActionsOnly,
    ),
    ...(options.immediateActionsOnly
      ? []
      : createEnemyActionsFromIntents(state).map((action) => ({
          action,
          requiredPossessionSourceId: null,
          isQuickAction: false,
        }))),
  ]
    .map(
      (
        { action, requiredPossessionSourceId, isQuickAction },
        originalOrder,
      ) => {
        const normalSelectedAction = isCharacterInstanceId(action.actorId)
          ? selections[action.actorId].action
          : null;
        const normalActionPriority =
          normalSelectedAction?.kind === "ability"
            ? (getCombatantAbility(
                state,
                normalSelectedAction.actorId,
                normalSelectedAction.abilityId,
              )?.resolutionPriority ?? 0)
            : 0;
        const abilityPriority =
          action.kind === "ability"
            ? (getCombatantAbility(
                state,
                action.actorId,
                action.abilityId,
              )?.resolutionPriority ?? 0)
            : 0;

        return {
          action,
          requiredPossessionSourceId,
          originalOrder,
          lastActionTier:
            action.kind !== "ability"
              ? 0
              : getCombatantAbility(state, action.actorId, action.abilityId)
                    ?.turnOrderRule === "absoluteLast"
                ? 2
                : getCombatantAbility(state, action.actorId, action.abilityId)
                      ?.turnOrderRule === "alwaysLast"
                  ? 1
                  : 0,
          resolutionPriority: Math.max(
            abilityPriority,
            isQuickAction &&
              action.kind === "ability" &&
              action.abilityId === "autoAttack"
              ? normalActionPriority
              : 0,
            getSpiritTurnResolutionPriority(state, action.actorId),
          ),
          agility:
            getCombatant(state, action.actorId)?.stats.agility ?? 0,
        };
      },
    )
    .sort((first, second) => {
      const alwaysLastOrder = first.lastActionTier - second.lastActionTier;

      if (alwaysLastOrder !== 0) {
        return alwaysLastOrder;
      }

      if (first.lastActionTier > 0 && second.lastActionTier > 0) {
        return (
          second.agility - first.agility ||
          first.originalOrder - second.originalOrder
        );
      }

      return (
        second.resolutionPriority - first.resolutionPriority ||
        second.agility - first.agility ||
        first.originalOrder - second.originalOrder
      );
    });

  const actions = [...orderedActions];
  let tieStartIndex = 0;

  while (tieStartIndex < actions.length) {
    const first = actions[tieStartIndex];
    let tieEndIndex = tieStartIndex + 1;

    while (tieEndIndex < actions.length) {
      const candidate = actions[tieEndIndex];
      const sameTurnOrder =
        candidate.lastActionTier === first.lastActionTier &&
        candidate.agility === first.agility &&
        (first.lastActionTier > 0 ||
          candidate.resolutionPriority === first.resolutionPriority);

      if (!sameTurnOrder) {
        break;
      }

      tieEndIndex += 1;
    }

    for (let index = tieEndIndex - 1; index > tieStartIndex; index -= 1) {
      const roll = nextRandom(randomSeed);
      randomSeed = roll.nextSeed;
      const swapIndex =
        tieStartIndex + Math.floor(roll.value * (index - tieStartIndex + 1));
      [actions[index], actions[swapIndex]] = [
        actions[swapIndex],
        actions[index],
      ];
    }

    tieStartIndex = tieEndIndex;
  }

  const events: CombatEvent[] = [];
  const delayedItemActions: ItemCombatAction[] = [];
  const activeDamageReductions = new Map<CombatantId, number[]>();
  const resolvedPossessions = new Set<CharacterInstanceId>();
  const latestDamagingElementByCharacter = new Map<
    CharacterInstanceId,
    Element
  >();
  const damagedTargetsByElementByCharacter = new Map<
    CharacterInstanceId,
    Map<Element, Set<CombatantId>>
  >();
  const damagedTargetsByGhostCharacter = new Map<
    CharacterInstanceId,
    Set<CombatantId>
  >();
  const stunnedActorIds = new Set<CombatantId>();
  const resolvedStunnedActorIds = new Set<CombatantId>();
  if (!options.immediateActionsOnly) {
    for (const ownerId of CHARACTER_ORDER) {
      const bloodpact = nextState.characters[ownerId].spirits.bloodpact;
      const bloodpactPassive = bloodpact
        ? getSpiritPassive(bloodpact).roundStartBloodpact
        : undefined;
      if (!bloodpactPassive) continue;
      nextState = resolveBloodpact(
        nextState,
        ownerId,
        bloodpactPassive.hpCost,
        bloodpactPassive.barrierAmount,
        false,
        events,
      );
    }

    for (const ownerId of CHARACTER_ORDER) {
      const owner = nextState.characters[ownerId];
      const phoenix = owner.spirits.phoenix;
      const phoenixHealing = phoenix
        ? getSpiritPassive(phoenix).roundStartHealing?.amount ?? 0
        : 0;

      if (
        owner.form !== "living" ||
          !phoenix ||
        owner.hp >= owner.stats.maxHp
      ) {
        continue;
      }

      const remainingHp = Math.min(
        owner.stats.maxHp,
        owner.hp + phoenixHealing,
      );
      nextState = updateHp(nextState, ownerId, remainingHp);
      const healedOwner = nextState.characters[ownerId];
      events.push({
        type: "support",
        actorId: ownerId,
        targetId: ownerId,
        abilityId: "phoenixRebirth",
        abilityRank: 1,
        healingAmount: remainingHp - owner.hp,
        remainingHp,
        barrierAmount: 0,
        remainingBarrier: healedOwner.barrier,
        remainingPp: healedOwner.pp,
        statusChanges: [],
        characterState: getCharacterEventState(healedOwner),
      });
    }
  }

  for (const { action, requiredPossessionSourceId } of actions) {
    if (
      !CHARACTER_ORDER.some(
        (characterId) => nextState.characters[characterId].form === "living",
      )
    ) {
      break;
    }

    if (
      requiredPossessionSourceId &&
      !resolvedPossessions.has(requiredPossessionSourceId)
    ) {
      continue;
    }

    const actor = getCombatant(nextState, action.actorId);
    const stunnedStatus = actor?.statuses.find(
      (status) => status.id === "stunned",
    );

    if (stunnedStatus) {
      stunnedActorIds.add(action.actorId);
    }

    if (
      actor &&
      actor.hp > 0 &&
      stunnedActorIds.has(action.actorId)
    ) {
      if (resolvedStunnedActorIds.has(action.actorId)) {
        continue;
      }

      resolvedStunnedActorIds.add(action.actorId);
      const interruptedCharge = actor.statuses.find(
        (status) => status.id === "abilityCharge",
      );
      nextState = updateStatuses(
        nextState,
        action.actorId,
        actor.statuses.filter(
          (status) =>
            status.id !== "stunned" &&
            (!interruptedCharge || status.id !== "abilityCharge"),
        ),
      );
      events.push({
        type: "skipTurn",
        actorId: action.actorId,
        targetId: action.actorId,
        reason: "stunned",
        ...(action.kind === "ability"
          ? { skippedAbilityId: action.abilityId }
          : { skippedItemId: action.itemId }),
        statusChanges: [
          {
            type: "removed",
            combatantId: action.actorId,
            statusId: "stunned",
          },
          ...(interruptedCharge
            ? [
                {
                  type: "removed" as const,
                  combatantId: action.actorId,
                  statusId: "abilityCharge" as const,
                },
              ]
            : []),
        ],
      });
      continue;
    }

    if (action.kind === "item") {
      const definition = ITEM_DEFINITIONS[action.itemId];

      if (
        !actor ||
        !isCharacterInstanceId(action.actorId) ||
        nextState.characters[action.actorId].form !== "living" ||
        !definition ||
        (nextState.characters[action.actorId].inventory[action.itemId] ?? 0) <=
          0
      ) {
        continue;
      }

      if (definition.resolutionTiming === "endOfRound") {
        nextState = consumeItem(nextState, action.actorId, action.itemId);
        delayedItemActions.push(action);
        const actorAfterItem = nextState.characters[action.actorId];
        events.push({
          type: "itemUse",
          actorId: action.actorId,
          itemId: action.itemId,
          targetId: action.targetId,
          visualPhase: "activation",
          impacts: [],
          remainingQuantity:
            actorAfterItem.inventory[action.itemId] ?? 0,
          damageBonus: actorAfterItem.itemDamageBonus,
        });
        continue;
      }

      const itemResult = resolveItemUse(nextState, action, randomSeed);

      if (itemResult) {
        nextState = itemResult.nextState;
        randomSeed = itemResult.nextSeed;
        events.push(itemResult.event);
        events.push(...itemResult.followUpEvents);

        if (
          isCharacterInstanceId(action.actorId) &&
          actionCanTriggerGuardDog(definition.effects)
        ) {
          const guardDogResult = resolveGuardDogPassive(
            nextState,
            action.actorId,
            randomSeed,
          );
          nextState = guardDogResult.state;
          randomSeed = guardDogResult.nextSeed;
          if (guardDogResult.event) {
            events.push(guardDogResult.event);
          }
        }
      }
      continue;
    }

    const ability = getCombatantAbility(
      nextState,
      action.actorId,
      action.abilityId,
    );
    if (!actor || actor.hp <= 0 || !ability) {
      continue;
    }

    const partnerId = isCharacterInstanceId(action.actorId)
      ? CHARACTER_ORDER.find(
          (characterId) => characterId !== action.actorId,
        )
      : undefined;
    const twinFlamesElement =
      action.abilityId === "twinFlames" &&
      partnerId !== undefined
        ? (latestDamagingElementByCharacter.get(partnerId) ?? null)
        : null;

    let resolvedTargetId = action.targetId;

    if (
      ability.aiTargeting === "randomLivingCharacter" &&
      !isCharacterInstanceId(action.actorId) &&
      resolvedTargetId === null
    ) {
      const livingCharacterIds = CHARACTER_ORDER.filter(
        (characterId) => nextState.characters[characterId].hp > 0,
      );

      if (livingCharacterIds.length === 0) {
        continue;
      }

      const targetRoll = nextRandom(randomSeed);
      randomSeed = targetRoll.nextSeed;
      resolvedTargetId =
        livingCharacterIds[
          Math.floor(targetRoll.value * livingCharacterIds.length)
        ];
    }

    if (
      ability.aiTargeting === "lowestHpPercentageLivingAlly" &&
      !isCharacterInstanceId(action.actorId)
    ) {
      const woundedLivingAllies = nextState.enemies
        .filter((enemy) => enemy.hp > 0 && enemy.hp < enemy.stats.maxHp)
        .sort(
          (first, second) =>
            first.hp / first.stats.maxHp - second.hp / second.stats.maxHp ||
            first.instanceId.localeCompare(second.instanceId),
        );

      if (woundedLivingAllies.length === 0) {
        continue;
      }

      resolvedTargetId = woundedLivingAllies[0].instanceId;
    }

    if (
      isCharacterInstanceId(action.actorId) &&
      ability.target === "singleEnemy" &&
      !action.isChargeRelease &&
      resolvedTargetId !== null &&
      !isCharacterInstanceId(resolvedTargetId)
    ) {
      const selectedEnemy = nextState.enemies.find(
        (enemy) => enemy.instanceId === resolvedTargetId,
      );

      if (!selectedEnemy || !isEnemyTargetable(selectedEnemy)) {
        const eligibleEnemies = nextState.enemies.filter(isEnemyTargetable);

        if (eligibleEnemies.length > 0) {
          const targetRoll = nextRandom(randomSeed);
          randomSeed = targetRoll.nextSeed;
          resolvedTargetId =
            eligibleEnemies[
              Math.floor(targetRoll.value * eligibleEnemies.length)
            ].instanceId;
        }
      }
    }

    const initialTargetIds =
      ability?.target === "allEnemies"
        ? isCharacterInstanceId(action.actorId)
          ? nextState.enemies
              .filter(isEnemyTargetable)
              .map((enemy) => enemy.instanceId)
          : CHARACTER_ORDER.filter(
              (characterId) => nextState.characters[characterId].hp > 0,
            )
        : ability?.target === "allAllies"
          ? isCharacterInstanceId(action.actorId)
            ? CHARACTER_ORDER.filter(
                (characterId) => nextState.characters[characterId].hp > 0,
              )
            : nextState.enemies
                .filter((enemy) => enemy.hp > 0)
                .map((enemy) => enemy.instanceId)
          : resolvedTargetId
          ? [resolvedTargetId]
          : [];

    const chargeReleaseStatusChanges: StatusChange[] = [];

    if (action.isChargeRelease) {
      const chargingActor = getCombatant(nextState, action.actorId);
      if (!chargingActor) {
        continue;
      }
      const hasStoredCharge = chargingActor.statuses.some(
        (status) =>
          status.id === "abilityCharge" &&
          status.readiedAbilityId === action.abilityId,
      );

      if (
        !hasStoredCharge ||
        (isCharacterInstanceId(action.actorId) &&
          nextState.characters[action.actorId].form !== "living")
      ) {
        continue;
      }

      nextState = updateStatuses(
        nextState,
        action.actorId,
        chargingActor.statuses.filter(
          (status) => status.id !== "abilityCharge",
        ),
      );
      chargeReleaseStatusChanges.push({
        type: "removed",
        combatantId: action.actorId,
        statusId: "abilityCharge",
      });
    }

    if (
      isCharacterInstanceId(action.actorId) &&
      initialTargetIds.some((targetId) => {
        const target = getCombatant(nextState, targetId);

        return target && "enemyId" in target && !isEnemyTargetable(target);
      })
    ) {
      if (action.isChargeRelease) {
        events.push({
          type: "skipTurn",
          actorId: action.actorId,
          targetId: action.actorId,
          reason: "chargeTargetUnavailable",
          skippedAbilityId: action.abilityId,
          statusChanges: chargeReleaseStatusChanges,
        });
      }
      continue;
    }

    if (
      initialTargetIds.length === 0 ||
      initialTargetIds.every(
        (targetId) => (getCombatant(nextState, targetId)?.hp ?? 0) <= 0,
      )
    ) {
      if (action.isChargeRelease) {
        events.push({
          type: "skipTurn",
          actorId: action.actorId,
          targetId: action.actorId,
          reason: "chargeTargetUnavailable",
          skippedAbilityId: action.abilityId,
          statusChanges: chargeReleaseStatusChanges,
        });
      }
      continue;
    }

    const abilityPpCost = action.isChargeRelease
      ? 0
      : isCharacterInstanceId(action.actorId)
        ? getEffectiveAbilityPpCost(
            nextState.characters[action.actorId],
            ability.category,
            ability.ppCost,
          )
        : ability.ppCost;

    if (actor.pp < abilityPpCost) {
      continue;
    }

    if (
      action.abilityId === "magicBag" &&
      isCharacterInstanceId(action.actorId) &&
      nextState.characters[action.actorId].magicBagLastUsedRound ===
        nextState.round
    ) {
      continue;
    }

    if (action.abilityId === "earthDemon" && nextState.earthDemon) {
      continue;
    }

    const characterActorId = isCharacterInstanceId(action.actorId)
      ? action.actorId
      : null;
    const activeSpirit = characterActorId
      ? getSpiritForActiveAbility(
          nextState.characters[characterActorId].spirits,
          action.abilityId,
        )
      : null;

    if (ability.category === "spirit") {
      if (
        !characterActorId ||
        !activeSpirit ||
        activeSpirit.activeUsesRemaining <= 0
      ) {
        continue;
      }

      if (
        ability.id === "bloodpact" &&
        (action.targetId !== characterActorId ||
          !getActiveBloodpactRoles(nextState, characterActorId))
      ) {
        continue;
      }

      nextState = consumeSpiritActiveUse(
        nextState,
        characterActorId,
        activeSpirit.id,
      );
    }

    const ghostHpCostEffect = ability.effects.find(
      (effect) => effect.type === "ghostHpCost",
    );
    const additionalActionEffect = ability.effects.find(
      (effect) => effect.type === "grantAdditionalAction",
    );

    if (ghostHpCostEffect || additionalActionEffect) {
      if (
        !characterActorId ||
        !resolvedTargetId ||
        !isCharacterInstanceId(resolvedTargetId)
      ) {
        continue;
      }

      const ghost = nextState.characters[characterActorId];
      const livingAlly = nextState.characters[resolvedTargetId];
      const hpCost = ghostHpCostEffect?.amount ?? 0;

      if (
        ghost.form !== "ghost" ||
        livingAlly.form !== "living" ||
        livingAlly.instanceId === characterActorId ||
        ghost.hp < hpCost
      ) {
        continue;
      }

      nextState = updateHp(
        nextState,
        characterActorId,
        ghost.hp - hpCost,
      );
      const ghostAfterCost = nextState.characters[characterActorId];
      resolvedPossessions.add(characterActorId);
      events.push({
        type: "support",
        actorId: characterActorId,
        targetId: resolvedTargetId,
        abilityId: action.abilityId,
        abilityRank: ability.rank,
        healingAmount: 0,
        remainingHp: livingAlly.hp,
        barrierAmount: 0,
        remainingBarrier: livingAlly.barrier,
        remainingPp: livingAlly.pp,
        statusChanges: [],
        characterState: getCharacterEventState(livingAlly),
        actorRemainingHp: ghostAfterCost.hp,
        actorCharacterState: getCharacterEventState(ghostAfterCost),
      });
      continue;
    }

    nextState = spendPp(nextState, action.actorId, abilityPpCost);

    if (action.abilityId === "magicBag" && characterActorId) {
      nextState = {
        ...nextState,
        characters: {
          ...nextState.characters,
          [characterActorId]: {
            ...nextState.characters[characterActorId],
            magicBagLastUsedRound: nextState.round,
          },
        },
      };
    }

    if (
      characterActorId &&
      !action.isChargeRelease &&
      ability.category === "ability" &&
      ability.ppCost >= PASSIVE_VALUES.manaWardMinimumBasePpCost &&
      characterHasPassive(nextState.characters[characterActorId], "manaWard")
    ) {
      const barrierResult = grantBarrierToTarget(
        nextState,
        characterActorId,
        PASSIVE_VALUES.manaWardBarrier,
        characterActorId,
      );
      nextState = barrierResult.state;
      if (barrierResult.grantedAmount > 0) {
        events.push({
          type: "manaWard",
          actorId: characterActorId,
          targetId: characterActorId,
          passiveId: "manaWard",
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          barrierAmount: barrierResult.grantedAmount,
          remainingBarrier: nextState.characters[characterActorId].barrier,
        });
      }
    }

    if (!isCharacterInstanceId(action.actorId)) {
      const enemyActor = nextState.enemies.find(
        (enemy) => enemy.instanceId === action.actorId,
      );

      if (enemyActor?.enemyId === "orcMage") {
        nextState = {
          ...nextState,
          enemies: nextState.enemies.map((enemy) =>
            enemy.instanceId === action.actorId
              ? {
                  ...enemy,
                  orcMageDarkBoltsSinceShatter:
                    action.abilityId === "shatterWard"
                      ? 0
                      : action.abilityId === "darkBolt"
                        ? Math.min(
                            2,
                            (enemy.orcMageDarkBoltsSinceShatter ?? 0) + 1,
                          )
                        : enemy.orcMageDarkBoltsSinceShatter,
                }
              : enemy,
          ),
        };
      }
    }

    const removeBarrierEffect = ability.effects.find(
      (effect) => effect.type === "removeBarrier",
    );
    if (removeBarrierEffect) {
      const impacts = CHARACTER_ORDER.map((characterId) => ({
        targetId: characterId,
        barrierRemoved: nextState.characters[characterId].barrier,
        remainingBarrier: 0 as const,
      }));

      nextState = {
        ...nextState,
        characters: {
          "character-1": {
            ...nextState.characters["character-1"],
            barrier: 0,
          },
          "character-2": {
            ...nextState.characters["character-2"],
            barrier: 0,
          },
        },
      };
      events.push({
        type: "barrierRemoved",
        actorId: action.actorId,
        abilityId: action.abilityId,
        abilityRank: ability.rank,
        impacts,
      });
      continue;
    }

    const bloodpactEffect = ability.effects.find(
      (effect) => effect.type === "bloodpact",
    );
    if (bloodpactEffect && characterActorId) {
      nextState = resolveBloodpact(
        nextState, characterActorId,
        bloodpactEffect.hpCost, bloodpactEffect.barrierAmount, true, events,
      );
      const guardDogResult = resolveGuardDogPassive(
        nextState, characterActorId, randomSeed,
      );
      nextState = guardDogResult.state;
      randomSeed = guardDogResult.nextSeed;
      if (guardDogResult.event) events.push(guardDogResult.event);
      continue;
    }

    const earthDemonEffect = ability.effects.find(
      (effect) => effect.type === "summonEarthDemon",
    );
    if (earthDemonEffect && characterActorId) {
      const earthPower = actor.stats.elementalPower.earth;
      const maxHp = Math.round(
        earthDemonEffect.baseHp + earthPower * earthDemonEffect.hpScaling,
      );
      const summon = {
        ownerId: characterActorId,
        rank: ability.rank,
        hp: maxHp,
        maxHp,
        attackPower: Math.round(
          earthDemonEffect.attackBasePower +
            earthPower * earthDemonEffect.attackScaling,
        ),
      };
      nextState = { ...nextState, earthDemon: summon };
      events.push({
        type: "earthDemonSummoned",
        actorId: characterActorId,
        targetId: characterActorId,
        abilityId: "earthDemon",
        abilityRank: ability.rank,
        summon,
      });
      continue;
    }

    if (characterActorId) {
      for (const effect of ability.effects) {
        if (effect.type === "countAsItemUse" && effect.itemId === "steelDart") {
          nextState = addSteelDartAbilityBonusStacks(
            nextState,
            characterActorId,
            effect.count,
          );
        }
      }
    }

    const chargeEffect = ability.effects.find(
      (effect) => effect.type === "charge",
    );

    if (chargeEffect && !action.isChargeRelease) {
      if (resolvedTargetId !== null) {
        const incomingStatus: ActiveStatus = {
          ...createStatusFromSource(
            nextState,
            action.actorId,
            "abilityCharge",
          ),
          readiedAbilityId: chargeEffect.readiesAbilityId,
          readiedTargetId: resolvedTargetId,
        };
        const result = applyStatusToTarget(
          nextState,
          action.actorId,
          incomingStatus,
        );
        nextState = result.state;
        const statusChanges: StatusChange[] = result.status
          ? [
              {
                type: "applied",
                combatantId: action.actorId,
                status: result.status,
              },
            ]
          : [];

        events.push({
          type: "charge",
          actorId: action.actorId,
          targetId: resolvedTargetId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          readiedAbilityId: chargeEffect.readiesAbilityId,
          statusChanges,
        });
      } else {
        events.push({
          type: "charge",
          actorId: action.actorId,
          targetId: resolvedTargetId ?? action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          readiedAbilityId: chargeEffect.readiesAbilityId,
          statusChanges: [],
        });
      }

      if (characterActorId) {
        const guardDogResult = resolveGuardDogPassive(
          nextState,
          characterActorId,
          randomSeed,
        );
        nextState = guardDogResult.state;
        randomSeed = guardDogResult.nextSeed;
        if (guardDogResult.event) {
          events.push(guardDogResult.event);
        }
      }

      continue;
    }

    const ghostHealingEffect = ability.effects.find(
      (effect) => effect.type === "ghostHealing",
    );

    if (ghostHealingEffect) {
      if (!characterActorId) {
        continue;
      }

      const ghost = nextState.characters[characterActorId];
      if (ghost.form !== "ghost") {
        continue;
      }

      const remainingHp = Math.min(
        getCharacterMaxHp(ghost),
        ghost.hp + ghostHealingEffect.amount,
      );
      const healingAmount = remainingHp - ghost.hp;
      nextState = updateHp(nextState, characterActorId, remainingHp);
      const healedGhost = nextState.characters[characterActorId];
      events.push({
        type: "support",
        actorId: characterActorId,
        targetId: characterActorId,
        abilityId: action.abilityId,
        abilityRank: ability.rank,
        healingAmount,
        remainingHp: healedGhost.hp,
        barrierAmount: 0,
        remainingBarrier: healedGhost.barrier,
        remainingPp: healedGhost.pp,
        statusChanges: [],
        characterState: getCharacterEventState(healedGhost),
      });
      continue;
    }

    const gainsRandomItem = ability.effects.some(
      (effect) => effect.type === "gainRandomItem",
    );

    if (
      ability.target === "singleAlly" ||
      ability.target === "allAllies" ||
      gainsRandomItem
    ) {
      const supportTargetIds =
        ability.target === "allAllies"
          ? initialTargetIds
          : resolvedTargetId &&
              isCharacterInstanceId(action.actorId) ===
                isCharacterInstanceId(resolvedTargetId)
            ? [resolvedTargetId]
            : [];
      const impacts: MultiTargetSupportImpact[] = [];
      const secondaryImpacts: MultiTargetSupportImpact[] = [];
      const recordSecondarySupport = (
        targetId: CharacterInstanceId,
        values: { healingAmount?: number; barrierAmount?: number },
      ) => {
        const target = nextState.characters[targetId];
        const existing = secondaryImpacts.find(
          (impact) => impact.targetId === targetId,
        );

        if (existing) {
          existing.healingAmount += values.healingAmount ?? 0;
          existing.barrierAmount += values.barrierAmount ?? 0;
          existing.remainingHp = target.hp;
          existing.remainingBarrier = target.barrier;
          existing.remainingPp = target.pp;
          return;
        }

        secondaryImpacts.push({
          targetId,
          healingAmount: values.healingAmount ?? 0,
          remainingHp: target.hp,
          barrierAmount: values.barrierAmount ?? 0,
          remainingBarrier: target.barrier,
          remainingPp: target.pp,
          statusChanges: [],
        });
      };

      for (const supportTargetId of supportTargetIds) {
        let healingAmount = 0;
        let barrierAmount = 0;
        let gainedItemId: ItemId | undefined;
        let gainedItemQuantity: number | undefined;
        const gainedItemIds: ItemId[] = [];
        const statusChanges: StatusChange[] = [
          ...chargeReleaseStatusChanges,
        ];

        for (const effect of ability.effects) {
          const currentTarget = getCombatant(nextState, supportTargetId);

          if (!currentTarget) {
            continue;
          }

          if (effect.type === "healing") {
            const characterHealer = isCharacterInstanceId(action.actorId)
              ? nextState.characters[action.actorId]
              : null;
            const receivedHealingBonus = isCharacterInstanceId(
              supportTargetId,
            )
              ? getPartyHealingReceivedBonus(nextState)
              : 0;
            let healingPower = Math.round(
              effect.basePower +
                (ability.element
                  ? actor.stats.elementalPower[ability.element]
                  : 0) *
                  effect.elementalPowerScaling,
            );

            if (
              characterHealer &&
              currentTarget.hp < currentTarget.stats.maxHp
            ) {
              if (
                characterHasPassive(characterHealer, "shelteredRecovery") &&
                currentTarget.barrier > 0
              ) {
                healingPower += PASSIVE_VALUES.shelteredRecoveryHealing;
              }

              if (
                characterHasPassive(characterHealer, "triage") &&
                currentTarget.hp / currentTarget.stats.maxHp <
                  PASSIVE_VALUES.triageThreshold
              ) {
                healingPower += PASSIVE_VALUES.triageHealing;
              }

              if (
                characterHasPassive(characterHealer, "lifeCurrent") &&
                !characterHealer.passiveCombatState.firstHealUsed
              ) {
                healingPower = Math.round(
                  healingPower * PASSIVE_VALUES.lifeCurrentMultiplier,
                );
              }
            }

            healingPower += receivedHealingBonus;
            if (isCharacterInstanceId(supportTargetId)) {
              healingPower = applyGhostReceivedHealing(
                nextState.characters[supportTargetId],
                healingPower,
              );
            }
            healingPower = Math.round(
              healingPower *
                getHealingReceivedMultiplier(currentTarget.statuses),
            );
            const targetMaxHp = isCharacterInstanceId(supportTargetId)
              ? getCharacterMaxHp(nextState.characters[supportTargetId])
              : currentTarget.stats.maxHp;
            const remainingHp = Math.min(
              targetMaxHp,
              currentTarget.hp + healingPower,
            );
            const restoredHp = remainingHp - currentTarget.hp;
            healingAmount += restoredHp;
            nextState = updateHp(nextState, supportTargetId, remainingHp);

            if (characterHealer && characterActorId && restoredHp > 0) {
              if (
                characterHasPassive(characterHealer, "lifeCurrent") &&
                !characterHealer.passiveCombatState.firstHealUsed
              ) {
                nextState = {
                  ...nextState,
                  characters: {
                    ...nextState.characters,
                    [characterActorId]: {
                      ...nextState.characters[characterActorId],
                      passiveCombatState: {
                        ...nextState.characters[characterActorId]
                          .passiveCombatState,
                        firstHealUsed: true,
                      },
                    },
                  },
                };
              }

              if (
                isCharacterInstanceId(supportTargetId) &&
                supportTargetId !== action.actorId
              ) {
                if (
                  characterHasPassive(characterHealer, "refreshingWaters")
                ) {
                  const ally = nextState.characters[supportTargetId];
                  nextState = updatePp(
                    nextState,
                    supportTargetId,
                    Math.min(
                      getCharacterMaxPp(ally),
                      ally.pp + PASSIVE_VALUES.refreshingWatersPp,
                    ),
                  );
                }

                if (characterHasPassive(characterHealer, "sharedRecovery")) {
                  const healer = nextState.characters[characterActorId];
                  const selfHealingPower =
                    PASSIVE_VALUES.sharedRecoveryHealing +
                    getPartyHealingReceivedBonus(nextState);
                  const selfRemainingHp = Math.min(
                    healer.stats.maxHp,
                    healer.hp + selfHealingPower,
                  );
                  const selfHealing = selfRemainingHp - healer.hp;
                  nextState = updateHp(
                    nextState,
                    characterActorId,
                    selfRemainingHp,
                  );

                  if (selfHealing > 0) {
                    recordSecondarySupport(characterActorId, {
                      healingAmount: selfHealing,
                    });
                  }
                }
              }

              if (characterHasPassive(characterHealer, "lastingCare")) {
                const barrierResult = grantBarrierToTarget(
                  nextState,
                  supportTargetId,
                  PASSIVE_VALUES.lastingCareBarrier,
                  action.actorId,
                );
                nextState = barrierResult.state;
                barrierAmount += barrierResult.grantedAmount;
                if (
                  characterActorId &&
                  barrierResult.sourceBarrierGranted > 0
                ) {
                  recordSecondarySupport(characterActorId, {
                    barrierAmount: barrierResult.sourceBarrierGranted,
                  });
                }
              }
            }
            continue;
          }

          if (effect.type === "barrier") {
            const scaledBarrierAmount = Math.round(
              effect.amount +
                (currentTarget.barrier <= 0
                  ? (effect.bonusIfNoBarrier ?? 0)
                  : 0) +
                (ability.element
                  ? actor.stats.elementalPower[ability.element]
                  : 0) *
                  (effect.elementalPowerScaling ?? 0),
            );
            const result = grantBarrierToTarget(
              nextState,
              supportTargetId,
              scaledBarrierAmount,
              action.actorId,
            );
            nextState = result.state;
            barrierAmount += result.grantedAmount;
            if (
              characterActorId &&
              result.sourceBarrierGranted > 0
            ) {
              recordSecondarySupport(characterActorId, {
                barrierAmount: result.sourceBarrierGranted,
              });
            }
            continue;
          }

          if (effect.type === "cleanse") {
            const statusExists = currentTarget.statuses.some(
              (status) => status.id === effect.statusId,
            );

            if (statusExists) {
              nextState = updateStatuses(
                nextState,
                supportTargetId,
                currentTarget.statuses.filter(
                  (status) => status.id !== effect.statusId,
                ),
              );
              statusChanges.push({
                type: "removed",
                combatantId: supportTargetId,
                statusId: effect.statusId,
              });
            }
            continue;
          }

          if (effect.type === "applyStatus") {
            const scaledElementalPower =
              (ability.element
                ? actor.stats.elementalPower[ability.element]
                : 0) * effect.elementalPowerScaling;
            const incomingStatus = {
              ...createStatusFromSource(
                nextState,
                action.actorId,
                effect.statusId,
                {
                  tickBasePower: Math.round(
                    effect.tickBasePower + scaledElementalPower,
                  ),
                },
              ),
              healingReceivedMultiplier:
                effect.healingReceivedMultiplier,
              magnitude: effect.magnitude,
            };
            const result = applyStatusToTarget(
              nextState,
              supportTargetId,
              incomingStatus,
            );
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: supportTargetId,
                status: result.status,
              });
            }
            continue;
          }

          if (
            effect.type === "gainRandomItem" &&
            effect.pool === "normal" &&
            isCharacterInstanceId(supportTargetId)
          ) {
            let drawCount = effect.drawCount ?? 1;

            if (effect.bonusDrawChance !== undefined) {
              const bonusRoll = nextRandom(randomSeed);
              randomSeed = bonusRoll.nextSeed;
              if (bonusRoll.value < effect.bonusDrawChance) {
                drawCount += 1;
              }
            }

            for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
              const draw = drawNormalItemReward(randomSeed);
              randomSeed = draw.nextSeed;

              if (!draw.itemId) {
                continue;
              }

              const character = nextState.characters[supportTargetId];
              gainedItemId = draw.itemId;
              gainedItemIds.push(draw.itemId);
              gainedItemQuantity =
                (character.inventory[draw.itemId] ?? 0) + 1;
              nextState = {
                ...nextState,
                characters: {
                  ...nextState.characters,
                  [supportTargetId]: {
                    ...character,
                    inventory: {
                      ...character.inventory,
                      [draw.itemId]: gainedItemQuantity,
                    },
                  },
                },
              };
            }
          }
        }

        const targetAfterSupport = getCombatant(nextState, supportTargetId);

        if (targetAfterSupport) {
          impacts.push({
            targetId: supportTargetId,
            healingAmount,
            remainingHp: targetAfterSupport.hp,
            barrierAmount,
            remainingBarrier: targetAfterSupport.barrier,
            remainingPp: targetAfterSupport.pp,
            statusChanges,
            ...(gainedItemId
              ? { gainedItemId, gainedItemQuantity }
              : {}),
            ...(gainedItemIds.length > 0 ? { gainedItemIds } : {}),
            characterState: getEventCharacterState(
              nextState,
              supportTargetId,
            ),
          });
        }
      }

      if (impacts.length === 0) {
        continue;
      }

      if (ability.target === "allAllies") {
        events.push({
          type: "multiTargetSupport",
          actorId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          impacts,
          ...(secondaryImpacts.length > 0
            ? { secondaryImpacts }
            : {}),
        });
      } else {
        events.push({
          type: "support",
          actorId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          ...impacts[0],
          secondaryImpacts,
        });
      }

      if (
        characterActorId &&
        !action.isChargeRelease &&
        actionCanTriggerGuardDog(ability.effects)
      ) {
        const guardDogResult = resolveGuardDogPassive(
          nextState,
          characterActorId,
          randomSeed,
        );
        nextState = guardDogResult.state;
        randomSeed = guardDogResult.nextSeed;
        if (guardDogResult.event) {
          events.push(guardDogResult.event);
        }
      }
      continue;
    }

    const outgoingDamageStatuses = actor.statuses.filter(
      (status) =>
        STATUS_DEFINITIONS[status.id].outgoingDamageModifier !==
        undefined,
    );
    const outgoingDamageMultiplier = outgoingDamageStatuses.reduce(
      (multiplier, status) => {
        const modifier =
          STATUS_DEFINITIONS[status.id].outgoingDamageModifier;
        const magnitude = status.magnitude ?? 0;

        return modifier?.operation === "increase"
          ? multiplier * (1 + magnitude)
          : multiplier * (1 - magnitude);
      },
      1,
    );
    const itemDamageBonus =
      isCharacterInstanceId(action.actorId) &&
      ability.category === "ability" &&
      nextState.characters[action.actorId].itemDamageBonus?.expiresRound ===
        state.round
        ? nextState.characters[action.actorId].itemDamageBonus
        : null;
    const ironquillAbilityDamageBonus =
      isCharacterInstanceId(action.actorId) &&
      ability.category === "ability"
        ? (nextState.characters[action.actorId].spirits.ironquill
            ?.steelDartAbilityBonusStacks ?? 0) *
          (nextState.characters[action.actorId].spirits.ironquill
            ? getSpiritPassive(
                nextState.characters[action.actorId].spirits.ironquill!,
              ).steelDartAbilityAmplifier?.damageBonusPerDart ?? 0
            : 0)
        : 0;
    const tailwindPassiveOwned = Boolean(
      characterActorId &&
        characterHasPassive(
          nextState.characters[characterActorId],
          "tailwind",
        ),
    );
    const tailwindWasActive = Boolean(
      characterActorId &&
        nextState.characters[characterActorId].passiveCombatState
          .tailwindActive,
    );
    const tailwindEmpowersAction = Boolean(
      tailwindWasActive &&
        ability.category === "ability" &&
        ability.element === "wind" &&
        ability.effects.some((effect) => effect.type === "damage"),
    );
    const galeFocusCanTrigger = Boolean(
      characterActorId &&
        ability.category === "ability" &&
        ability.element === "wind" &&
        characterHasPassive(
          nextState.characters[characterActorId],
          "galeFocus",
        ) &&
        nextState.characters[characterActorId].passiveCombatState
          .galeFocusLastUsedRound !== state.round,
    );
    let firstDamageStatusChanges: StatusChange[] | null = null;
    let actionDealtDamage = false;
    let actionLandedCritical = false;
    let galeFocusTriggered = false;
    let partnerElementDamageBonusApplied = false;
    const damagedTargetIdsThisAction = new Set<CombatantId>();
  const bodyguardProtectedTargetIds = new Set<CombatantId>();
  const bodyguardCounteredSourceIds = new Set<CharacterInstanceId>();

    const effectsForAction = ability.effects.flatMap((effect) => {
      if (
        effect.type !== "damage" ||
        !effect.twinFlamesCombo ||
        twinFlamesElement === null
      ) {
        return [effect];
      }

      if (twinFlamesElement === "fire") {
        return [
          effect,
          {
            ...effect,
            basePower: effect.twinFlamesCombo.fire.basePower,
            elementalPowerScaling:
              effect.twinFlamesCombo.fire.elementalPowerScaling,
            twinFlamesCombo: undefined,
            twinFlamesFollowUp: true,
          },
        ];
      }

      if (twinFlamesElement === "wind") {
        return [
          effect,
          {
            ...effect,
            twinFlamesCombo: undefined,
            twinFlamesFollowUp: true,
            targetRule: "randomOtherEnemy" as const,
          },
        ];
      }

      return [effect];
    });

    for (const effect of effectsForAction) {
      if (effect.type === "wakeEnemy") {
        const sleepingTarget = nextState.enemies.find(
          (enemy) =>
            enemy.enemyId === effect.enemyId &&
            enemy.hp > 0 &&
            isEnemySleeping(enemy),
        );

        if (sleepingTarget) {
          const statusChanges: StatusChange[] = [
            {
              type: "removed",
              combatantId: sleepingTarget.instanceId,
              statusId: "sleeping",
            },
          ];
          nextState = updateStatuses(
            nextState,
            sleepingTarget.instanceId,
            sleepingTarget.statuses.filter(
              (status) => status.id !== "sleeping",
            ),
          );
          events.push({
            type: "wake",
            actorId: action.actorId,
            targetId: sleepingTarget.instanceId,
            abilityId: action.abilityId,
            abilityRank: ability.rank,
            statusChanges,
          });
        }
        continue;
      }

      if (effect.type === "wait") {
        const waitingActor = getCombatant(nextState, action.actorId);
        const statusesToCleanse = effect.cleansesDamageStatuses
          ? (waitingActor?.statuses.filter(
              (status) =>
                STATUS_DEFINITIONS[status.id].endOfRoundDamage !== undefined,
            ) ?? [])
          : [];
        const statusChanges: StatusChange[] = statusesToCleanse.map(
          (status) => ({
            type: "removed",
            combatantId: action.actorId,
            statusId: status.id,
            sourceId: status.sourceId,
          }),
        );

        if (waitingActor && statusesToCleanse.length > 0) {
          nextState = updateStatuses(
            nextState,
            action.actorId,
            waitingActor.statuses.filter(
              (status) =>
                !statusesToCleanse.some(
                  (cleansedStatus) => cleansedStatus === status,
                ),
            ),
          );
        }

        events.push({
          type: "wait",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          statusChanges,
        });
        continue;
      }

      if (effect.type === "charge") {
        if (action.isChargeRelease) {
          continue;
        }

        if (
          isCharacterInstanceId(action.actorId) &&
          resolvedTargetId !== null
        ) {
          const incomingStatus: ActiveStatus = {
            ...createStatusFromSource(
              nextState,
              action.actorId,
              "abilityCharge",
            ),
            readiedAbilityId: effect.readiesAbilityId,
            readiedTargetId: resolvedTargetId,
          };
          const result = applyStatusToTarget(
            nextState,
            action.actorId,
            incomingStatus,
          );
          nextState = result.state;
          const statusChanges: StatusChange[] = result.status
            ? [
                {
                  type: "applied",
                  combatantId: action.actorId,
                  status: result.status,
                },
              ]
            : [];

          events.push({
            type: "charge",
            actorId: action.actorId,
            targetId: resolvedTargetId,
            abilityId: action.abilityId,
            abilityRank: ability.rank,
            readiedAbilityId: effect.readiesAbilityId,
            statusChanges,
          });
          break;
        }

        events.push({
          type: "charge",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          readiedAbilityId: effect.readiesAbilityId,
          statusChanges: [],
        });
        continue;
      }

      if (effect.type === "goatStompMark") {
        const livingCharacterIds = CHARACTER_ORDER.filter(
          (characterId) => nextState.characters[characterId].hp > 0,
        );

        if (livingCharacterIds.length === 0) {
          continue;
        }

        const targetRoll = nextRandom(randomSeed);
        randomSeed = targetRoll.nextSeed;
        const targetId =
          livingCharacterIds[
            Math.floor(targetRoll.value * livingCharacterIds.length)
          ];
        const incomingStatus: ActiveStatus = {
          ...createStatusFromSource(
            nextState,
            action.actorId,
            "cracked",
          ),
          readiedAbilityId: "goatCharge",
        };
        const result = applyStatusToTarget(
          nextState,
          targetId,
          incomingStatus,
        );
        nextState = result.state;

        if (result.status) {
          events.push({
            type: "statusApplied",
            actorId: action.actorId,
            targetId,
            abilityId: action.abilityId,
            abilityRank: ability.rank,
            statusChanges: [
              {
                type: "applied",
                combatantId: targetId,
                status: result.status,
              },
            ],
          });
        }
        continue;
      }

      if (effect.type === "applyStatus") {
        for (const targetId of initialTargetIds) {
          const target = getCombatant(nextState, targetId);

          if (!target || target.hp <= 0) {
            continue;
          }

          const scaledElementalPower =
            (ability.element
              ? actor.stats.elementalPower[ability.element]
              : 0) * effect.elementalPowerScaling;
          const tickBasePower = Math.round(
            effect.tickBasePower + scaledElementalPower,
          );
          const incomingStatus = {
            ...createStatusFromSource(
              nextState,
              action.actorId,
              effect.statusId,
              { tickBasePower },
            ),
            healingReceivedMultiplier:
              effect.healingReceivedMultiplier,
            magnitude: effect.magnitude,
            ticksTriggered:
              effect.empowerAfterTicks !== undefined ? 0 : undefined,
            sourceHealingPerTick: effect.sourceHealingPerTick,
            empowerAfterTicks: effect.empowerAfterTicks,
            empoweredTickBasePower:
              effect.empoweredTickBasePower === undefined
                ? undefined
                : Math.round(
                    effect.empoweredTickBasePower + scaledElementalPower,
                  ),
            empoweredSourceHealingPerTick:
              effect.empoweredSourceHealingPerTick,
          };
          const result = applyStatusToTarget(
            nextState,
            targetId,
            incomingStatus,
          );
          nextState = result.state;

          if (result.status) {
            events.push({
              type: "statusApplied",
              actorId: action.actorId,
              targetId,
              abilityId: action.abilityId,
              abilityRank: ability.rank,
              statusChanges: [
                {
                  type: "applied",
                  combatantId: targetId,
                  status: result.status,
                },
              ],
            });
          }
        }
        continue;
      }

      if (effect.type === "defend") {
        const currentReductions =
          activeDamageReductions.get(action.actorId) ?? [];
        activeDamageReductions.set(action.actorId, [
          ...currentReductions,
          effect.damageReduction,
        ]);
        let barrierAmount = 0;
        let remainingBarrier = actor.barrier;

        if (
          isCharacterInstanceId(action.actorId) &&
          characterHasPassive(nextState.characters[action.actorId], "brace")
        ) {
          const barrierResult = grantBarrierToTarget(
            nextState,
            action.actorId,
            PASSIVE_VALUES.braceBarrier,
            action.actorId,
          );
          nextState = barrierResult.state;
          barrierAmount = barrierResult.grantedAmount;
          remainingBarrier = nextState.characters[action.actorId].barrier;
        }
        events.push({
          type: "defend",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          barrierAmount,
          remainingBarrier,
        });

        if (
          isCharacterInstanceId(action.actorId) &&
          characterHasPassive(
            nextState.characters[action.actorId],
            "leaveItToMe",
          )
        ) {
          const allyId = CHARACTER_ORDER.find(
            (characterId) => characterId !== action.actorId,
          );

          if (allyId) {
            nextState = {
              ...nextState,
              characters: {
                ...nextState.characters,
                [allyId]: {
                  ...nextState.characters[allyId],
                  abilityDamageBonus: {
                    amount: PASSIVE_VALUES.leaveItToMeDamageBonus,
                    expiresAfterRound: state.round + 1,
                    sourceId: action.actorId,
                    sourcePassiveId: "leaveItToMe",
                  },
                },
              },
            };
          }
        }
        continue;
      }

      if (effect.type !== "damage") {
        continue;
      }

      if (
        effect.retargetOnDefeat &&
        resolvedTargetId !== null &&
        !isCharacterInstanceId(resolvedTargetId)
      ) {
        const currentTarget = nextState.enemies.find(
          (enemy) => enemy.instanceId === resolvedTargetId,
        );

        if (!currentTarget || !isEnemyTargetable(currentTarget)) {
          const eligibleEnemies = nextState.enemies.filter(isEnemyTargetable);

          if (eligibleEnemies.length === 0) {
            continue;
          }

          const targetRoll = nextRandom(randomSeed);
          randomSeed = targetRoll.nextSeed;
          resolvedTargetId =
            eligibleEnemies[
              Math.floor(targetRoll.value * eligibleEnemies.length)
            ].instanceId;
        }
      }

      let targetIds =
        effect.targetRule === "randomOtherEnemy"
          ? nextState.enemies
              .filter(
                (enemy) =>
                  isEnemyTargetable(enemy) &&
                  enemy.instanceId !== resolvedTargetId,
              )
              .map((enemy) => enemy.instanceId)
          : effect.retargetOnDefeat && resolvedTargetId !== null
            ? [resolvedTargetId]
          : ability.target === "allEnemies"
          ? initialTargetIds.filter(
              (targetId) => {
                const target = getCombatant(nextState, targetId);

                return target && "enemyId" in target
                  ? isEnemyTargetable(target)
                  : (target?.hp ?? 0) > 0;
              },
            )
          : initialTargetIds;

      if (effect.targetRule === "randomOtherEnemy") {
        if (targetIds.length > 1) {
          const targetRoll = nextRandom(randomSeed);
          randomSeed = targetRoll.nextSeed;
          targetIds = [
            targetIds[Math.floor(targetRoll.value * targetIds.length)],
          ];
        } else {
          targetIds = targetIds.slice(0, 1);
        }
      }

      const galeFocusAppliesToWave: boolean = Boolean(
        galeFocusCanTrigger &&
          !galeFocusTriggered &&
          effect.criticalHit &&
          targetIds.length > 0,
      );
      galeFocusTriggered ||= galeFocusAppliesToWave;

      const preHitStatusChanges = new Map<CombatantId, StatusChange[]>();
      const barrierRemovedBeforeHit = new Map<CombatantId, number>();

      if (effect.twinFlamesCombo && twinFlamesElement === "water") {
        for (const targetId of targetIds) {
          const target = getCombatant(nextState, targetId);
          const burnStatuses =
            target?.statuses.filter((status) => status.id === "burn") ?? [];

          if (!target || burnStatuses.length === 0) {
            continue;
          }

          nextState = updateStatuses(
            nextState,
            targetId,
            target.statuses.filter((status) => status.id !== "burn"),
          );
          preHitStatusChanges.set(targetId, [
            {
              type: "removed",
              combatantId: targetId,
              statusId: effect.twinFlamesCombo.water.cleanseStatusId,
            },
          ]);
        }
      }

      if (effect.twinFlamesCombo && twinFlamesElement === "earth") {
        for (const targetId of targetIds) {
          const target = getCombatant(nextState, targetId);

          if (!target || target.hp <= 0) {
            continue;
          }

          const removed = Math.min(
            target.barrier,
            effect.twinFlamesCombo.earth.barrierRemoval,
          );
          if (removed > 0) {
            nextState = updateBarrier(
              nextState,
              targetId,
              target.barrier - removed,
            );
            barrierRemovedBeforeHit.set(targetId, removed);
          }
        }
      }
      const spreadSourceStatus = effect.spreadStatus
        ? targetIds.flatMap(
            (targetId) =>
              getCombatant(nextState, targetId)?.statuses.filter(
                (status) => status.id === effect.spreadStatus?.statusId,
              ) ?? [],
          )[0]
        : undefined;
      const impacts = [];
      const followUpStatusEvents: StatusDamageEvent[] = [];
      const soulTransferEvents: SoulTransferEvent[] = [];
      const phoenixRebirthEvents: PhoenixRebirthEvent[] = [];
      let linkedSupportImpact: MultiTargetSupportImpact | undefined;
      let linkedSecondarySupportImpacts:
        | MultiTargetSupportImpact[]
        | undefined;
      let twinFlamesGhostPartnerId: CharacterInstanceId | undefined;

      for (const targetId of targetIds) {
        const currentTarget = getCombatant(nextState, targetId);
        if (!currentTarget || currentTarget.hp <= 0) {
          continue;
        }

        const damageReductions =
          activeDamageReductions.get(targetId) ?? [];
        const earthDemonWillIntercept = Boolean(
          nextState.earthDemon &&
            !isCharacterInstanceId(action.actorId) &&
            isCharacterInstanceId(targetId) &&
            ability.target !== "allEnemies" &&
            targetIds.length === 1,
        );
        const hasLivingAllyBonus =
          effect.damagePerOtherLivingSameEnemy !== undefined &&
          !isCharacterInstanceId(action.actorId);
        const characterActor = isCharacterInstanceId(action.actorId)
          ? nextState.characters[action.actorId]
          : null;
        const ghostStrikeDamageBonus =
          characterActor?.form === "ghost" &&
          action.abilityId === "ghostStrike" &&
          characterActor.ghostUpgrades.heavyHaunt
            ? GHOST_UPGRADE_VALUES.heavyHauntDamageBonus
            : 0;
        const effectiveDamageEffect = ghostStrikeDamageBonus
          ? {
              ...effect,
              basePower: effect.basePower + ghostStrikeDamageBonus,
            }
          : effect;
        const normalDamage = calculateDamage({
          attacker: actor.stats,
          defender: currentTarget.stats,
          defenderStatuses: currentTarget.statuses,
          element: ability.element,
          effect: effectiveDamageEffect,
          additionalDamageReductions:
            hasLivingAllyBonus || earthDemonWillIntercept
              ? []
              : damageReductions,
        });
        let isCritical = false;
        let amount = normalDamage;
        const bloodScentBonus =
          characterActor &&
          characterHasPassive(characterActor, "bloodScent") &&
          currentTarget.statuses.some((status) => status.id === "bleed")
            ? PASSIVE_VALUES.bloodScentDamageBonus
            : 0;
        const passiveAbilityDamageBonus =
          characterActor &&
          ability.category === "ability" &&
          characterActor.abilityDamageBonus &&
          characterActor.abilityDamageBonus.expiresAfterRound >= state.round
            ? characterActor.abilityDamageBonus.amount
            : 0;
        const closerToTheVeilDamageBonus =
          characterActor?.form === "ghost" &&
          characterActor.hp <
            GHOST_UPGRADE_VALUES.closerToTheVeilHpThreshold &&
          characterActor.ghostUpgrades.closerToTheVeil &&
          (action.abilityId === "ghostStrike" ||
            action.abilityId === "ghostBolt")
            ? GHOST_UPGRADE_VALUES.closerToTheVeilDamageBonus
            : 0;
        const warhoundQuickDamageMultiplier =
          options.immediateActionsOnly &&
          action.abilityId === "autoAttack" &&
          characterActor?.spirits.warhound
            ? (getSpiritPassive(characterActor.spirits.warhound)
                .firstAutoAttackDamageMultiplier ?? 1)
            : 1;

        if (effect.usesDamageVariance !== false) {
          const varianceResult = nextRandom(randomSeed);
          randomSeed = varianceResult.nextSeed;
          amount = applyDamageVariance(normalDamage, varianceResult.value);
        }
        const statusChanges: StatusChange[] = [
          ...(preHitStatusChanges.get(targetId) ?? []),
        ];
        let immediateStatusTick: ActiveStatus | null = null;

        if (
          hasLivingAllyBonus &&
          "enemyId" in actor
        ) {
          const otherLivingSameEnemies = nextState.enemies.filter(
            (enemy) =>
              enemy.hp > 0 &&
              enemy.instanceId !== actor.instanceId &&
              enemy.enemyId === actor.enemyId,
          ).length;
          amount +=
            otherLivingSameEnemies *
            (effect.damagePerOtherLivingSameEnemy ?? 0);

          if (damageReductions.length > 0) {
            amount = Math.max(
              1,
              Math.round(
                amount *
                  (1 - combineDamageReductions(damageReductions)),
              ),
            );
          }
        }

        if (effect.criticalHit) {
          const randomResult = nextRandom(randomSeed);
          randomSeed = randomResult.nextSeed;
          const criticalChance = Math.min(
            1,
            effect.criticalHit.chance + actor.stats.criticalChance,
          );
          isCritical =
            galeFocusAppliesToWave || randomResult.value < criticalChance;

          if (isCritical) {
            actionLandedCritical = true;
            amount = Math.round(
              amount * effect.criticalHit.damageMultiplier,
            );
          }
        }

        const partnerElementDamageBonusApplies =
          effect.partnerElementDamageBonus !== undefined &&
          partnerId !== undefined &&
          (damagedTargetsByElementByCharacter
            .get(partnerId)
            ?.get(effect.partnerElementDamageBonus.element)
            ?.has(targetId) ?? false);
        partnerElementDamageBonusApplied ||=
          partnerElementDamageBonusApplies;

        amount = Math.max(
          1,
          Math.round(
            amount *
              (partnerElementDamageBonusApplies &&
              effect.partnerElementDamageBonus
                ? effect.partnerElementDamageBonus.multiplier
                : 1) *
              outgoingDamageMultiplier *
              (1 + (itemDamageBonus?.amount ?? 0)) *
              (1 + bloodScentBonus) *
              (1 + passiveAbilityDamageBonus) *
              (1 + ironquillAbilityDamageBonus) *
              (1 +
                (tailwindEmpowersAction
                  ? PASSIVE_VALUES.tailwindDamageBonus
                  : 0)) *
              (1 + closerToTheVeilDamageBonus) *
              warhoundQuickDamageMultiplier,
          ),
        );

        if (isCharacterInstanceId(targetId)) {
          amount = applyGhostIncomingDamage(
            nextState.characters[targetId],
            amount,
          );
        }

        const incomingDamageStatus = currentTarget.statuses.find(
          (status) => {
            const modifier =
              STATUS_DEFINITIONS[status.id].incomingDamageModifier;

            return (
              modifier?.triggeringAttacker === "sourcePartner" &&
              isSourcePartner(action.actorId, status.sourceId)
            );
          },
        );

        if (incomingDamageStatus) {
          const modifier =
            STATUS_DEFINITIONS[incomingDamageStatus.id]
              .incomingDamageModifier;

          if (modifier) {
            amount = Math.max(1, Math.round(amount * modifier.multiplier));

            if (modifier.consumeOnTrigger) {
              nextState = updateStatuses(
                nextState,
                targetId,
                currentTarget.statuses.filter(
                  (status) => status.id !== incomingDamageStatus.id,
                ),
              );
              statusChanges.push({
                type: "removed" as const,
                combatantId: targetId,
                statusId: incomingDamageStatus.id,
              });
            }
          }
        }

        const goatChargeMark =
          action.abilityId === "goatCharge"
            ? currentTarget.statuses.find(
                (status) =>
                  status.id === "cracked" &&
                  status.readiedAbilityId === "goatCharge",
              )
            : undefined;

        const consumeGoatChargeMark = () => {
          if (!goatChargeMark) {
            return;
          }

          const target = getCombatant(nextState, targetId);
          if (!target) {
            return;
          }

          nextState = updateStatuses(
            nextState,
            targetId,
            target.statuses.filter(
              (status) =>
                !(
                  status.id === "cracked" &&
                  status.readiedAbilityId === "goatCharge"
                ),
            ),
          );
          statusChanges.push({
            type: "removed",
            combatantId: targetId,
            statusId: "cracked",
            sourceId: goatChargeMark.sourceId,
          });
        };

        if (earthDemonWillIntercept && nextState.earthDemon && amount > 0) {
          consumeGoatChargeMark();
          const currentDemon = nextState.earthDemon;
          const remainingHp = Math.max(0, currentDemon.hp - amount);
          const destroyed = remainingHp === 0;
          nextState = {
            ...nextState,
            earthDemon: destroyed
              ? null
              : { ...nextState.earthDemon, hp: remainingHp },
          };
          events.push({
            type: "earthDemonHit",
            actorId: action.actorId,
            targetId: currentDemon.ownerId,
            abilityId: action.abilityId,
            abilityRank: ability.rank,
            amount,
            remainingHp,
            maxHp: currentDemon.maxHp,
            destroyed,
          });
          continue;
        }

        let bodyguardCounterSourceId: CharacterInstanceId | null = null;
        const bodyguardStatus = currentTarget.statuses.find(
          (status) => status.id === "bodyguard",
        );
        const bodyguardBlocksThisAttack =
          !isCharacterInstanceId(action.actorId) &&
          isCharacterInstanceId(targetId) &&
          amount > 0 &&
          (bodyguardProtectedTargetIds.has(targetId) ||
            bodyguardStatus !== undefined);

        if (bodyguardBlocksThisAttack) {
          amount = 0;

          if (bodyguardStatus) {
            if (
              isCharacterInstanceId(bodyguardStatus.sourceId) &&
              !bodyguardCounteredSourceIds.has(bodyguardStatus.sourceId)
            ) {
              const guardDog =
                nextState.characters[bodyguardStatus.sourceId].spirits.guardDog;
              if (
                guardDog &&
                (getSpiritPassive(guardDog).bodyguardCounterDamage ?? 0) > 0
              ) {
                bodyguardCounterSourceId = bodyguardStatus.sourceId;
                bodyguardCounteredSourceIds.add(bodyguardStatus.sourceId);
              }
            }
            bodyguardProtectedTargetIds.add(targetId);
            const protectedTarget = getCombatant(nextState, targetId);
            if (protectedTarget) {
              nextState = updateStatuses(
                nextState,
                targetId,
                protectedTarget.statuses.filter(
                  (status) => status.id !== "bodyguard",
                ),
              );
            }
            statusChanges.push({
              type: "removed",
              combatantId: targetId,
              statusId: "bodyguard",
            });
          }
        }

        consumeGoatChargeMark();

        if (isCritical && effect.statusOnCriticalHit) {
          const targetAfterConsumption = getCombatant(nextState, targetId);
          const newStatus = createStatusFromSource(
            nextState,
            action.actorId,
            effect.statusOnCriticalHit,
          );

          if (targetAfterConsumption) {
            const result = applyStatusToTarget(nextState, targetId, newStatus);
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied" as const,
                combatantId: targetId,
                status: result.status,
              });
              if (
                result.wasAlreadyActive &&
                result.status.id === "burn" &&
                characterActor &&
                characterHasPassive(characterActor, "flashpoint")
              ) {
                immediateStatusTick = newStatus;
              }
            }
          }
        }

        if (effect.statusOnHit) {
          let appliesStatus = true;
          if (effect.statusOnHit.chance !== undefined) {
            const statusRoll = nextRandom(randomSeed);
            randomSeed = statusRoll.nextSeed;
            appliesStatus = statusRoll.value < effect.statusOnHit.chance;
          }

          const targetAfterOtherStatuses = appliesStatus
            ? getCombatant(nextState, targetId)
            : null;

          if (targetAfterOtherStatuses) {
            const existingStatus = targetAfterOtherStatuses.statuses.find(
              (status) => status.id === effect.statusOnHit?.statusId,
            );
            const newStatus = createStatusFromSource(
              nextState,
              action.actorId,
              effect.statusOnHit.statusId,
              {
                magnitude: effect.statusOnHit.magnitude,
                durationRounds: effect.statusOnHit.durationRounds,
              },
            );
            const result = applyStatusToTarget(nextState, targetId, newStatus);
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: targetId,
                status: result.status,
              });
              const triggersIfNew =
                !result.wasAlreadyActive &&
                effect.statusOnHit.triggerTickIfNew === true;
              const triggersIfAlreadyActive =
                result.wasAlreadyActive &&
                effect.statusOnHit.triggerTickIfAlreadyActive === true;
              const triggersFromFlashpoint =
                result.status.id === "burn" &&
                result.wasAlreadyActive &&
                characterActor &&
                characterHasPassive(characterActor, "flashpoint");

              if (
                triggersIfNew ||
                triggersIfAlreadyActive ||
                triggersFromFlashpoint
              ) {
                immediateStatusTick = triggersIfAlreadyActive
                  ? (existingStatus ?? newStatus)
                  : newStatus;
              }
            }
          }
        }


        if (
          characterActor &&
          isCritical &&
          characterHasPassive(characterActor, "openWound")
        ) {
          const result = applyStatusToTarget(
            nextState,
            targetId,
            createStatusFromSource(
              nextState,
              action.actorId,
              "bleed",
            ),
          );
          nextState = result.state;
          if (result.status) {
            statusChanges.push({
              type: "applied",
              combatantId: targetId,
              status: result.status,
            });
          }
        }

        if (
          characterActor &&
          effect.damageType === "physical" &&
          (ability.category !== "spirit" ||
            physicalSpiritHitCanTriggerJaggedStrikes(ability.id)) &&
          characterHasPassive(characterActor, "jaggedStrikes")
        ) {
          const jaggedRoll = nextRandom(randomSeed);
          randomSeed = jaggedRoll.nextSeed;

          if (jaggedRoll.value < PASSIVE_VALUES.jaggedStrikesChance) {
            const result = applyStatusToTarget(
              nextState,
              targetId,
              createStatusFromSource(
                nextState,
                action.actorId,
                "bleed",
              ),
            );
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: targetId,
                status: result.status,
              });
            }
          }
        }

        const barrierResult = absorbDirectDamage(
          currentTarget.barrier,
          amount,
        );
        const actualHpDamage = Math.min(
          currentTarget.hp,
          barrierResult.hpDamage,
        );
        const calculatedRemainingHp = Math.max(
          0,
          currentTarget.hp - barrierResult.hpDamage,
        );
        nextState = updateBarrier(
          nextState,
          targetId,
          barrierResult.remainingBarrier,
        );
        const characterBeforeLethalDamage = isCharacterInstanceId(targetId)
          ? nextState.characters[targetId]
          : null;
        const soulTransfer =
          calculatedRemainingHp <= 0 &&
          !isCharacterInstanceId(action.actorId) &&
          isCharacterInstanceId(targetId)
            ? resolveSoulTransfer(
                nextState,
                targetId,
                barrierResult.hpDamage,
              )
            : null;
        let damageCharacterState = getEventCharacterState(
          nextState,
          targetId,
        );

        if (soulTransfer) {
          nextState = soulTransfer.state;
          soulTransferEvents.push(soulTransfer.event);
        } else {
          nextState = updateHp(
            nextState,
            targetId,
            calculatedRemainingHp,
          );
          const phoenixRebirth = characterBeforeLethalDamage && isCharacterInstanceId(targetId)
            ? getPhoenixRebirthEvent(
                characterBeforeLethalDamage,
                nextState.characters[targetId],
              )
            : null;
          if (phoenixRebirth && characterBeforeLethalDamage) {
            phoenixRebirthEvents.push(phoenixRebirth);
            damageCharacterState = getCharacterEventState(
              characterBeforeLethalDamage,
            );
          } else {
            damageCharacterState = getEventCharacterState(nextState, targetId);
          }
        }
        const phoenixRebirthTriggered = phoenixRebirthEvents.some(
          (event) => event.targetId === targetId,
        );
        const remainingHp = soulTransfer || phoenixRebirthTriggered
          ? 0
          : (getCombatant(nextState, targetId)?.hp ?? 0);

        if (
          effect.statusOnHpDamage &&
          barrierResult.hpDamage > 0 &&
          calculatedRemainingHp > 0
        ) {
          let appliesStatus = true;
          if (effect.statusOnHpDamage.chance !== undefined) {
            const statusRoll = nextRandom(randomSeed);
            randomSeed = statusRoll.nextSeed;
            appliesStatus =
              statusRoll.value < effect.statusOnHpDamage.chance;
          }

          if (appliesStatus) {
            const result = applyStatusToTarget(
              nextState,
              targetId,
              createStatusFromSource(
                nextState,
                action.actorId,
                effect.statusOnHpDamage.statusId,
                { magnitude: effect.statusOnHpDamage.magnitude },
              ),
            );
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: targetId,
                status: result.status,
              });
            }
          }
        }

        let reflectedDamage;

        if (
          !isCharacterInstanceId(action.actorId) &&
          isCharacterInstanceId(targetId)
        ) {
          const defendingCharacter = state.characters[targetId];
          const passiveIds: Array<"thorns" | "counterguard" | "guardDog"> = [];

          if (
            currentTarget.barrier > 0 &&
            characterHasPassive(defendingCharacter, "thorns")
          ) {
            passiveIds.push("thorns");
          }
          if (
            damageReductions.length > 0 &&
            characterHasPassive(defendingCharacter, "counterguard")
          ) {
            passiveIds.push("counterguard");
          }
          if (bodyguardCounterSourceId) {
            passiveIds.push("guardDog");
          }

          const reflectedTarget = getCombatant(nextState, action.actorId);

          if (reflectedTarget && reflectedTarget.hp > 0 && passiveIds.length > 0) {
            const totalReflectedDamage = passiveIds.reduce(
              (total, passiveId) => {
                if (passiveId === "guardDog") {
                  return total +
                    (bodyguardCounterSourceId
                      ? (getSpiritPassive(
                          nextState.characters[bodyguardCounterSourceId]
                            .spirits.guardDog!,
                        ).bodyguardCounterDamage ?? 0)
                      : 0);
                }

                return total + calculateFixedDamage({
                  basePower:
                    passiveId === "thorns"
                      ? PASSIVE_VALUES.thornsDamage
                      : PASSIVE_VALUES.counterguardDamage,
                  damageType: "physical",
                  defender: reflectedTarget.stats,
                  defenderStatuses: reflectedTarget.statuses,
                });
              },
              0,
            );
            const reflectedBarrierResult = absorbDirectDamage(
              reflectedTarget.barrier,
              totalReflectedDamage,
            );
            const reflectedRemainingHp = Math.max(
              0,
              reflectedTarget.hp - reflectedBarrierResult.hpDamage,
            );
            nextState = updateBarrier(
              nextState,
              action.actorId,
              reflectedBarrierResult.remainingBarrier,
            );
            nextState = updateHp(
              nextState,
              action.actorId,
              reflectedRemainingHp,
            );
            const reflectedStatusChanges: StatusChange[] = [];

            if (reflectedRemainingHp <= 0) {
              const wildfire = spreadWildfireAfterEnemyDeath(
                nextState,
                action.actorId,
                randomSeed,
              );
              nextState = wildfire.state;
              randomSeed = wildfire.nextSeed;
              if (wildfire.statusChange) {
                reflectedStatusChanges.push(wildfire.statusChange);
              }
            }
            reflectedDamage = {
              sourceId: bodyguardCounterSourceId ?? targetId,
              targetId: action.actorId,
              passiveIds,
              amount: reflectedBarrierResult.hpDamage,
              remainingHp: reflectedRemainingHp,
              absorbedByBarrier: reflectedBarrierResult.absorbedByBarrier,
              remainingBarrier: reflectedBarrierResult.remainingBarrier,
              statusChanges: reflectedStatusChanges,
            };
          }
        }


        if (calculatedRemainingHp <= 0) {
          const wildfire = spreadWildfireAfterEnemyDeath(
            nextState,
            targetId,
            randomSeed,
          );
          nextState = wildfire.state;
          randomSeed = wildfire.nextSeed;
          if (wildfire.statusChange) {
            statusChanges.push(wildfire.statusChange);
          }
        } else if (immediateStatusTick) {
          const targetAfterDirectDamage = getCombatant(nextState, targetId);
          const statusDamage =
            STATUS_DEFINITIONS[immediateStatusTick.id].endOfRoundDamage;

          if (targetAfterDirectDamage && statusDamage) {
            const tickBasePower =
              immediateStatusTick.tickBasePower ?? statusDamage.basePower;
            let immediateStatusAmount = statusDamage.ignoresMitigation
              ? Math.max(1, Math.round(tickBasePower))
              : calculateFixedDamage({
                  basePower: tickBasePower,
                  damageType: statusDamage.damageType,
                  defender: targetAfterDirectDamage.stats,
                  defenderStatuses: targetAfterDirectDamage.statuses,
                });
            if (isCharacterInstanceId(targetId)) {
              immediateStatusAmount = applyGhostIncomingDamage(
                nextState.characters[targetId],
                immediateStatusAmount,
              );
            }
            const immediateStatusRemainingHp = Math.max(
              0,
              targetAfterDirectDamage.hp - immediateStatusAmount,
            );
            const immediateStatusChanges: StatusChange[] = [];
            nextState = updateHp(
              nextState,
              targetId,
              immediateStatusRemainingHp,
            );

            if (immediateStatusRemainingHp <= 0) {
              const wildfire = spreadWildfireAfterEnemyDeath(
                nextState,
                targetId,
                randomSeed,
              );
              nextState = wildfire.state;
              randomSeed = wildfire.nextSeed;
              if (wildfire.statusChange) {
                immediateStatusChanges.push(wildfire.statusChange);
              }
            }

            followUpStatusEvents.push({
              type: "statusDamage",
              sourceId: immediateStatusTick.sourceId,
              targetId,
              statusId: immediateStatusTick.id,
              element: statusDamage.element,
              amount: immediateStatusAmount,
              remainingHp: immediateStatusRemainingHp,
              isCritical: false,
              statusChanges: immediateStatusChanges,
            });
          }
        }

        const healingFromDamageTargetId =
          effect.healingFromDamage?.target === "self"
            ? characterActorId
            : effect.healingFromDamage?.target === "secondaryTarget" &&
                action.secondaryTargetId &&
                isCharacterInstanceId(action.secondaryTargetId)
              ? action.secondaryTargetId
              : null;

        if (
          effect.healingFromDamage &&
          characterActorId &&
          healingFromDamageTargetId &&
          nextState.characters[healingFromDamageTargetId].form !==
            "permanentlyDead"
        ) {
          const healingResult = applyDamageLinkedAbilityHealing(
            nextState,
            characterActorId,
            healingFromDamageTargetId,
            Math.round(actualHpDamage * effect.healingFromDamage.ratio),
          );
          nextState = healingResult.state;
          linkedSupportImpact = healingResult.impact;
          linkedSecondarySupportImpacts = healingResult.secondaryImpacts;
        }
        actionDealtDamage = true;
        damagedTargetIdsThisAction.add(targetId);
        firstDamageStatusChanges ??= statusChanges;
        impacts.push({
          targetId,
          amount: barrierResult.hpDamage,
          remainingHp,
          absorbedByBarrier: barrierResult.absorbedByBarrier,
          remainingBarrier: barrierResult.remainingBarrier,
          isCritical,
          statusChanges,
          characterState: damageCharacterState,
          reflectedDamage,
          ...(barrierRemovedBeforeHit.has(targetId)
            ? {
                barrierRemovedBeforeHit:
                  barrierRemovedBeforeHit.get(targetId),
              }
            : {}),
        });
      }

      if (impacts.length === 0) {
        continue;
      }

      if (
        effect.twinFlamesCombo &&
        twinFlamesElement === "water" &&
        characterActorId
      ) {
        const healing = applyTwinFlamesPartyHealing(
          nextState,
          characterActorId,
          effect.twinFlamesCombo.water.partyHealing,
        );
        nextState = healing.state;
        linkedSupportImpact = healing.impacts[0];
        linkedSecondarySupportImpacts = healing.impacts.slice(1);
      }

      if (
        effect.twinFlamesCombo &&
        action.abilityId === "twinFlames" &&
        partnerId !== undefined &&
        nextState.characters[partnerId].form === "ghost" &&
        impacts.some((impact) =>
          damagedTargetsByGhostCharacter
            .get(partnerId)
            ?.has(impact.targetId),
        )
      ) {
        const ghost = nextState.characters[partnerId];
        const remainingHp = Math.min(
          getCharacterMaxHp(ghost),
          ghost.hp + effect.twinFlamesCombo.ghost.healing,
        );
        const healingAmount = remainingHp - ghost.hp;
        nextState = updateHp(nextState, partnerId, remainingHp);
        const healedGhost = nextState.characters[partnerId];
        twinFlamesGhostPartnerId = partnerId;
        linkedSupportImpact = {
          targetId: partnerId,
          healingAmount,
          remainingHp,
          barrierAmount: 0,
          remainingBarrier: healedGhost.barrier,
          statusChanges: [],
          characterState: getCharacterEventState(healedGhost),
        };
      }

      if (effect.spreadStatus && spreadSourceStatus) {
        const spread = effect.spreadStatus;
        const eligibleImpacts = impacts.filter((impact) => {
          const target = getCombatant(nextState, impact.targetId);

          return (
            impact.remainingHp > 0 &&
            target !== undefined &&
            !target.statuses.some((status) => status.id === spread.statusId)
          );
        });
        const spreadCount = Math.min(
          spread.maxAdditionalTargets,
          eligibleImpacts.length,
        );

        for (let index = 0; index < spreadCount; index += 1) {
          let selectedIndex = 0;

          if (eligibleImpacts.length > 1) {
            const targetRoll = nextRandom(randomSeed);
            randomSeed = targetRoll.nextSeed;
            selectedIndex = Math.floor(
              targetRoll.value * eligibleImpacts.length,
            );
          }

          const [selectedImpact] = eligibleImpacts.splice(selectedIndex, 1);
          const target = getCombatant(nextState, selectedImpact.targetId);

          if (!target) {
            continue;
          }

          const newStatus: ActiveStatus = {
            ...spreadSourceStatus,
            appliedRound: state.round,
          };

          nextState = updateStatuses(nextState, selectedImpact.targetId, [
            ...target.statuses,
            newStatus,
          ]);
          selectedImpact.statusChanges.push({
            type: "applied",
            combatantId: selectedImpact.targetId,
            status: newStatus,
          });
        }
      }

      const ghostRecoveryEffect = ability.effects.find(
        (candidate) => candidate.type === "ghostRecoveryOnHit",
      );
      let ghostRecovery:
        | {
            actorHealingAmount: number;
            actorPpRecoveryAmount: number;
            actorRemainingHp: number;
            actorCharacterState: ReturnType<typeof getCharacterEventState>;
          }
        | undefined;

      if (ghostRecoveryEffect && characterActorId) {
        const ghost = nextState.characters[characterActorId];

        if (ghost.form === "ghost") {
          const remainingHp = Math.min(
            getCharacterMaxHp(ghost),
            ghost.hp + ghostRecoveryEffect.amount,
          );
          const healingAmount = remainingHp - ghost.hp;
          nextState = updateHp(nextState, characterActorId, remainingHp);
          const remainingPp = Math.min(
            getCharacterMaxPp(ghost),
            ghost.pp + (ghostRecoveryEffect.ppAmount ?? 0),
          );
          const ppRecoveryAmount = remainingPp - ghost.pp;
          nextState = updatePp(nextState, characterActorId, remainingPp);
          const healedGhost = nextState.characters[characterActorId];
          ghostRecovery = {
            actorHealingAmount: healingAmount,
            actorPpRecoveryAmount: ppRecoveryAmount,
            actorRemainingHp: healedGhost.hp,
            actorCharacterState: getCharacterEventState(healedGhost),
          };
        }
      }

      if (ability.target === "allEnemies") {
        events.push({
          type: "multiTargetDamage",
          actorId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          impacts,
        });
      } else {
        events.push({
          type: "damage",
          actorId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          ...impacts[0],
          ...ghostRecovery,
          ...(linkedSupportImpact ? { linkedSupportImpact } : {}),
          ...(linkedSecondarySupportImpacts?.length
            ? { linkedSecondarySupportImpacts }
            : {}),
          ...(action.abilityId === "twinFlames"
            ? {
                twinFlamesElement,
                twinFlamesFollowUp:
                  effect.twinFlamesFollowUp === true,
                ...(twinFlamesGhostPartnerId
                  ? { twinFlamesGhostPartnerId }
                  : {}),
              }
            : {}),
          ...(action.abilityId === "backwind"
            ? { backwindBonus: partnerElementDamageBonusApplied }
            : {}),
          ...(effect.multiHitIndex !== undefined
            ? { multiHitIndex: effect.multiHitIndex }
            : {}),
        });
      }
      events.push(...phoenixRebirthEvents);
      events.push(...soulTransferEvents);
      events.push(...followUpStatusEvents);
    }

    if (
      actionDealtDamage &&
      action.abilityId === "autoAttack" &&
      isCharacterInstanceId(action.actorId) &&
      characterHasPassive(
        nextState.characters[action.actorId],
        "battleRhythm",
      )
    ) {
      const character = nextState.characters[action.actorId];
      const remainingPp = Math.min(
        getCharacterMaxPp(character),
        character.pp + PASSIVE_VALUES.battleRhythmPp,
      );
      const recoveredPp = remainingPp - character.pp;
      nextState = updatePp(nextState, action.actorId, remainingPp);

      const damageEvent = [...events]
        .reverse()
        .find(
          (event) =>
            event.type === "damage" &&
            event.actorId === action.actorId &&
            event.abilityId === "autoAttack",
        );

      if (damageEvent?.type === "damage") {
        damageEvent.actorPpRecoveryAmount = recoveredPp;
        damageEvent.actorCharacterState = getCharacterEventState(
          nextState.characters[action.actorId],
        );
      }
    }

    if (
      isCharacterInstanceId(action.actorId) &&
      actionCanTriggerGuardDog(ability.effects)
    ) {
      const guardDogResult = resolveGuardDogPassive(
        nextState,
        action.actorId,
        randomSeed,
      );
      nextState = guardDogResult.state;
      randomSeed = guardDogResult.nextSeed;
      if (guardDogResult.event) {
        events.push(guardDogResult.event);
      }
    }

    if (
      actionDealtDamage &&
      outgoingDamageStatuses.some(
        (status) =>
          STATUS_DEFINITIONS[status.id].outgoingDamageModifier
            ?.consumeOnNextDamageAction,
      ) &&
      firstDamageStatusChanges
    ) {
      const actorAfterAction = getCombatant(nextState, action.actorId);

      if (actorAfterAction) {
        const consumedStatusIds = new Set(
          outgoingDamageStatuses
            .filter(
              (status) =>
                STATUS_DEFINITIONS[status.id].outgoingDamageModifier
                  ?.consumeOnNextDamageAction,
            )
            .map((status) => status.id),
        );
        nextState = updateStatuses(
          nextState,
          action.actorId,
          actorAfterAction.statuses.filter(
            (status) => !consumedStatusIds.has(status.id),
          ),
        );
        firstDamageStatusChanges.push(
          ...[...consumedStatusIds].map((statusId) => ({
            type: "removed" as const,
            combatantId: action.actorId,
            statusId,
          })),
        );
      }
    }

    if (characterActorId && galeFocusTriggered) {
      nextState = {
        ...nextState,
        characters: {
          ...nextState.characters,
          [characterActorId]: {
            ...nextState.characters[characterActorId],
            passiveCombatState: {
              ...nextState.characters[characterActorId].passiveCombatState,
              galeFocusLastUsedRound: state.round,
            },
          },
        },
      };
    }

    if (characterActorId && tailwindPassiveOwned) {
      const tailwindWasConsumed =
        tailwindEmpowersAction && actionDealtDamage;
      const tailwindRearmed = tailwindWasConsumed && actionLandedCritical;
      const tailwindActive = actionLandedCritical
        ? true
        : tailwindWasConsumed
          ? false
          : tailwindWasActive;

      if (tailwindActive !== tailwindWasActive || tailwindRearmed) {
        nextState = {
          ...nextState,
          characters: {
            ...nextState.characters,
            [characterActorId]: {
              ...nextState.characters[characterActorId],
              passiveCombatState: {
                ...nextState.characters[characterActorId].passiveCombatState,
                tailwindActive,
              },
            },
          },
        };
        events.push({
          type: "tailwind",
          actorId: characterActorId,
          targetId: characterActorId,
          passiveId: "tailwind",
          active: tailwindActive,
          rearmed: tailwindRearmed,
        });
      }
    }

    if (
      actionDealtDamage &&
      isCharacterInstanceId(action.actorId) &&
      ability.element !== null &&
      ability.effects.some(
        (effect) =>
          effect.type === "damage" && effect.damageType === "elemental",
      )
    ) {
      latestDamagingElementByCharacter.set(
        action.actorId,
        ability.element,
      );
      const targetsByElement =
        damagedTargetsByElementByCharacter.get(action.actorId) ??
        new Map<Element, Set<CombatantId>>();
      const damagedTargets =
        targetsByElement.get(ability.element) ?? new Set<CombatantId>();
      for (const targetId of damagedTargetIdsThisAction) {
        damagedTargets.add(targetId);
      }
      targetsByElement.set(ability.element, damagedTargets);
      damagedTargetsByElementByCharacter.set(action.actorId, targetsByElement);
    }

    if (
      actionDealtDamage &&
      isCharacterInstanceId(action.actorId) &&
      nextState.characters[action.actorId].form === "ghost"
    ) {
      const damagedTargets =
        damagedTargetsByGhostCharacter.get(action.actorId) ??
        new Set<CombatantId>();
      for (const targetId of damagedTargetIdsThisAction) {
        damagedTargets.add(targetId);
      }
      damagedTargetsByGhostCharacter.set(action.actorId, damagedTargets);
    }

    if (
      actionDealtDamage &&
      isCharacterInstanceId(action.actorId) &&
      ability.category === "ability" &&
      nextState.characters[action.actorId].abilityDamageBonus
    ) {
      nextState = {
        ...nextState,
        characters: {
          ...nextState.characters,
          [action.actorId]: {
            ...nextState.characters[action.actorId],
            abilityDamageBonus: null,
          },
        },
      };
    }

    if (
      actionDealtDamage &&
      isCharacterInstanceId(action.actorId) &&
      ability.category === "ability" &&
      ironquillAbilityDamageBonus > 0
    ) {
      nextState = clearSteelDartAbilityBonusStacks(
        nextState,
        action.actorId,
      );
    }

    if (
      actionDealtDamage &&
      itemDamageBonus &&
      isCharacterInstanceId(action.actorId)
    ) {
      nextState = {
        ...nextState,
        characters: {
          ...nextState.characters,
          [action.actorId]: {
            ...nextState.characters[action.actorId],
            itemDamageBonus: null,
          },
        },
      };
    }

    if (
      actionDealtDamage &&
      isCharacterInstanceId(action.actorId) &&
      nextState.characters[action.actorId].form === "living"
    ) {
      const characterAfterAction = nextState.characters[action.actorId];
      const passiveSpirit = Object.values(characterAfterAction.spirits).find(
        (spirit) =>
          spirit &&
          getSpiritPassive(spirit).firstDamageActionEachEncounter !== undefined &&
          !spirit.passiveTriggeredThisEncounter,
      );

      if (passiveSpirit) {
        const passive = getSpiritPassive(passiveSpirit)
          .firstDamageActionEachEncounter;

        if (!passive) {
          continue;
        }

        const eligiblePassiveTargetIds = initialTargetIds.filter(
          (targetId) => {
            const target = getCombatant(nextState, targetId);

            return target && "enemyId" in target
              ? isEnemyTargetable(target)
              : (target?.hp ?? 0) > 0;
          },
        );
        let passiveTargetId = eligiblePassiveTargetIds[0];

        if (eligiblePassiveTargetIds.length > 1) {
          const targetRoll = nextRandom(randomSeed);
          randomSeed = targetRoll.nextSeed;
          passiveTargetId =
            eligiblePassiveTargetIds[
              Math.floor(targetRoll.value * eligiblePassiveTargetIds.length)
            ];
        }

        if (passiveTargetId) {
          nextState = markSpiritEncounterPassiveTriggered(
            nextState,
            action.actorId,
            passiveSpirit.id,
          );
          const passiveTarget = getCombatant(nextState, passiveTargetId);

          if (passiveTarget && passiveTarget.hp > 0) {
            const passiveRawPower = Math.round(
              passive.basePower +
                characterAfterAction.stats.elementalPower[
                  passive.element
                ] *
                  passive.elementalPowerScaling,
            );
            let amount = calculateFixedDamage({
              basePower: passiveRawPower,
              damageType: passive.damageType,
              defender: passiveTarget.stats,
              defenderStatuses: passiveTarget.statuses,
            });
            if (
              characterHasPassive(characterAfterAction, "bloodScent") &&
              passiveTarget.statuses.some((status) => status.id === "bleed")
            ) {
              amount = Math.max(
                1,
                Math.round(
                  amount * (1 + PASSIVE_VALUES.bloodScentDamageBonus),
                ),
              );
            }
            const barrierResult = absorbDirectDamage(
              passiveTarget.barrier,
              amount,
            );
            const remainingHp = Math.max(
              0,
              passiveTarget.hp - barrierResult.hpDamage,
            );

            nextState = updateBarrier(
              nextState,
              passiveTargetId,
              barrierResult.remainingBarrier,
            );
            nextState = updateHp(nextState, passiveTargetId, remainingHp);
            const spiritStatusChanges: StatusChange[] = [];

            if (remainingHp > 0 && passive.statusOnHit) {
              const statusResult = applyStatusToTarget(
                nextState,
                passiveTargetId,
                createStatusFromSource(
                  nextState,
                  action.actorId,
                  passive.statusOnHit,
                ),
              );
              nextState = statusResult.state;
              if (statusResult.status) {
                spiritStatusChanges.push({
                  type: "applied",
                  combatantId: passiveTargetId,
                  status: statusResult.status,
                });
              }
            }

            if (remainingHp <= 0) {
              const wildfire = spreadWildfireAfterEnemyDeath(
                nextState,
                passiveTargetId,
                randomSeed,
              );
              nextState = wildfire.state;
              randomSeed = wildfire.nextSeed;
              if (wildfire.statusChange) {
                spiritStatusChanges.push(wildfire.statusChange);
              }
            }
            events.push({
              type: "spiritDamage",
              sourceId: action.actorId,
              targetId: passiveTargetId,
              spiritId: passiveSpirit.id,
              damageType: passive.damageType,
              element: passive.element,
              amount: barrierResult.hpDamage,
              remainingHp,
              absorbedByBarrier: barrierResult.absorbedByBarrier,
              remainingBarrier: barrierResult.remainingBarrier,
              isCritical: false,
              statusChanges: spiritStatusChanges,
            });
          }
        }
      }
    }

    const selfHpDamageEffect = ability.effects.find(
      (effect) => effect.type === "selfHpDamage",
    );

    if (
      actionDealtDamage &&
      selfHpDamageEffect &&
      isCharacterInstanceId(action.actorId)
    ) {
      const characterBeforeCost = nextState.characters[action.actorId];

      if (characterBeforeCost.form === "living") {
        nextState = updateHp(
          nextState,
          action.actorId,
          characterBeforeCost.hp - selfHpDamageEffect.amount,
        );
        const characterAfterCost = nextState.characters[action.actorId];
        const phoenixRebirth = getPhoenixRebirthEvent(
          characterBeforeCost,
          characterAfterCost,
        );

        events.push({
          type: "selfDamage",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          amount: selfHpDamageEffect.amount,
          remainingHp: phoenixRebirth ? 0 : characterAfterCost.hp,
          absorbedByBarrier: 0,
          isCritical: false,
          statusChanges: [],
          characterState: getCharacterEventState(
            phoenixRebirth ? characterBeforeCost : characterAfterCost,
          ),
        });
        if (phoenixRebirth) {
          events.push(phoenixRebirth);
        }
      }
    }
  }

  if (options.immediateActionsOnly) {
    nextState = { ...nextState, randomSeed };

    if (!nextState.enemies.some((enemy) => enemy.hp > 0)) {
      const stateBeforeRecovery = nextState;
      nextState = completeVictory(nextState, randomSeed);
      events.push(createPostCombatRecoveryEvent(stateBeforeRecovery, nextState));
    }

    return { nextState, events };
  }

  const scriptedSleepingEnemy = nextState.enemies.find((enemy) => {
    const definition = ENEMY_DEFINITIONS[enemy.enemyId];

    return (
      enemy.hp > 0 &&
      isEnemySleeping(enemy) &&
      definition.wakesOnRound !== undefined &&
      state.round >= definition.wakesOnRound
    );
  });

  if (scriptedSleepingEnemy) {
    const statusChanges: StatusChange[] = [
      {
        type: "removed",
        combatantId: scriptedSleepingEnemy.instanceId,
        statusId: "sleeping",
      },
    ];
    nextState = updateStatuses(
      nextState,
      scriptedSleepingEnemy.instanceId,
      scriptedSleepingEnemy.statuses.filter(
        (status) => status.id !== "sleeping",
      ),
    );
    events.push({
      type: "wake",
      actorId: scriptedSleepingEnemy.instanceId,
      targetId: scriptedSleepingEnemy.instanceId,
      abilityId: "wakeUp",
      abilityRank: 1,
      statusChanges,
    });
  }

  for (const delayedItemAction of delayedItemActions) {
    const itemResult = resolveItemUse(nextState, delayedItemAction, randomSeed, {
      itemAlreadyConsumed: true,
      allowDefeatedActor: true,
    });

    if (itemResult) {
      nextState = itemResult.nextState;
      randomSeed = itemResult.nextSeed;
      events.push(itemResult.event);
      events.push(...itemResult.followUpEvents);
    }
  }

  if (nextState.earthDemon) {
    const demon = nextState.earthDemon;
    const livingEnemies = nextState.enemies.filter(isEnemyTargetable);
    if (livingEnemies.length > 0) {
      let targetIndex = 0;
      if (livingEnemies.length > 1) {
        const targetRoll = nextRandom(randomSeed);
        randomSeed = targetRoll.nextSeed;
        targetIndex = Math.floor(targetRoll.value * livingEnemies.length);
      }
      const target = livingEnemies[targetIndex];
      const varianceRoll = nextRandom(randomSeed);
      randomSeed = varianceRoll.nextSeed;
      const mitigatedDamage = calculateFixedDamage({
        basePower: demon.attackPower,
        damageType: "elemental",
        defender: target.stats,
        defenderStatuses: target.statuses,
      });
      const amount = applyDamageVariance(
        mitigatedDamage,
        varianceRoll.value,
      );
      const barrierResult = absorbDirectDamage(target.barrier, amount);
      const remainingHp = Math.max(0, target.hp - barrierResult.hpDamage);
      nextState = updateBarrier(
        nextState,
        target.instanceId,
        barrierResult.remainingBarrier,
      );
      nextState = updateHp(nextState, target.instanceId, remainingHp);
      events.push({
        type: "earthDemonAttack",
        actorId: demon.ownerId,
        targetId: target.instanceId,
        abilityId: "earthDemon",
        abilityRank: demon.rank,
        amount: barrierResult.hpDamage,
        remainingHp,
        absorbedByBarrier: barrierResult.absorbedByBarrier,
        remainingBarrier: barrierResult.remainingBarrier,
      });
    }
  }

  const statusResult = resolveEndOfRoundStatuses(
    nextState,
    events,
    randomSeed,
  );
  nextState = statusResult.state;
  randomSeed = statusResult.nextSeed;
  nextState = advanceTimedNonDamageStatuses(nextState);

  nextState = {
    ...nextState,
    characters: {
      "character-1": {
        ...nextState.characters["character-1"],
        itemDamageBonus: null,
        abilityDamageBonus:
          (nextState.characters["character-1"].abilityDamageBonus
            ?.expiresAfterRound ?? Number.POSITIVE_INFINITY) <= state.round
            ? null
            : nextState.characters["character-1"].abilityDamageBonus,
      },
      "character-2": {
        ...nextState.characters["character-2"],
        itemDamageBonus: null,
        abilityDamageBonus:
          (nextState.characters["character-2"].abilityDamageBonus
            ?.expiresAfterRound ?? Number.POSITIVE_INFINITY) <= state.round
            ? null
            : nextState.characters["character-2"].abilityDamageBonus,
      },
    },
  };

  const playersAlive = CHARACTER_ORDER.some(
    (characterId) => nextState.characters[characterId].form === "living",
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const roundOutcome: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  if (roundOutcome === "victory") {
    const stateBeforeRecovery = nextState;
    nextState = completeVictory(nextState, randomSeed);
    events.push(createPostCombatRecoveryEvent(stateBeforeRecovery, nextState));
    randomSeed = nextState.randomSeed;
  }

  const resolvedPhase =
    roundOutcome === "victory" ? nextState.phase : roundOutcome;

  let resolvedState: CombatState = {
    ...nextState,
    randomSeed,
    round:
      resolvedPhase === "selectingActions"
        ? state.round + 1
        : nextState.round,
    phase: resolvedPhase,
    rewardOffers: nextState.rewardOffers,
    itemRewards: nextState.itemRewards,
  };

  if (resolvedPhase === "selectingActions") {
    resolvedState = prepareEnemyIntents(
      prepareRoundTurnPriorities(resolvedState),
    );
  } else {
    resolvedState = { ...resolvedState, enemyIntents: {} };
  }

  return {
    nextState: resolvedState,
    events,
  };
}
