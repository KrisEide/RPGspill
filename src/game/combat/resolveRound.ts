import {
  calculateDamage,
  calculateFixedDamage,
} from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { combineDamageReductions } from "./damageMitigation";
import { absorbDirectDamage, addBarrier } from "./barrier";
import { getPartyHealingReceivedBonus } from "./healing";
import { nextRandom } from "./random";
import { isEnemySleeping, isEnemyTargetable } from "./targeting";
import {
  applyCharacterHp,
  applyGhostIncomingDamage,
  applyGhostReceivedHealing,
  getCharacterEventState,
  getCharacterMaxHp,
  getCharacterMaxPp,
  isGhostAbilityId,
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
import { ITEM_DEFINITIONS } from "../../data/items";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { generateRewardOffers } from "../rewards/rewardSystem";
import { grantEncounterItemRewards } from "../items/itemSystem";
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
  SPIRIT_DEFINITIONS,
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
  ActiveStatus,
  CombatAction,
  CombatantId,
  CombatEvent,
  CombatState,
  CharacterInstanceId,
  ItemCombatAction,
  ItemUseEvent,
  ItemUseImpact,
  MultiTargetSupportImpact,
  RoundResult,
  RoundOutcomePhase,
  RoundSelections,
  StatusChange,
  StatusDamageEvent,
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
    ? isGhostAbilityId(abilityId)
      ? 1
      : null
    : knownRank ?? (activeSpirit ? 1 : null);

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

function getEventCharacterState(
  state: CombatState,
  id: CombatantId,
) {
  return isCharacterInstanceId(id)
    ? getCharacterEventState(state.characters[id])
    : undefined;
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

function applyStatusToTarget(
  state: CombatState,
  targetId: CombatantId,
  incomingStatus: ActiveStatus,
) {
  const target = getCombatant(state, targetId);

  if (!target || target.hp <= 0) {
    return { state, status: null, wasAlreadyActive: false };
  }

  const existingStatus = target.statuses.find(
    (status) => status.id === incomingStatus.id,
  );
  const status = refreshStatusWithoutDowngrade(
    existingStatus,
    incomingStatus,
  );

  return {
    state: updateStatuses(state, targetId, [
      ...target.statuses.filter((candidate) => candidate.id !== status.id),
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
          SPIRIT_DEFINITIONS[spirit.id].passive
            .firstBarrierGainEachEncounter,
        );
      },
    );

    for (const spirit of barrierPassives) {
      if (!spirit) {
        continue;
      }

      const passive =
        SPIRIT_DEFINITIONS[spirit.id].passive
          .firstBarrierGainEachEncounter;

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

      const tickBasePower = status.tickBasePower ?? damage.basePower;
      let amount = damage.ignoresMitigation
        ? Math.max(1, Math.round(tickBasePower))
        : calculateFixedDamage({
            basePower: tickBasePower,
            damageType: damage.damageType,
            defender: currentCombatant.stats,
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
      const remainingRounds = (status.remainingRounds ?? 1) - 1;
      const statusChanges: StatusChange[] = [];
      const previousCharacterForm = isCharacterInstanceId(combatantId)
        ? nextState.characters[combatantId].form
        : null;

      nextState = updateHp(nextState, combatantId, calculatedRemainingHp);
      const remainingHp = getCombatant(nextState, combatantId)?.hp ?? 0;
      const characterChangedForm =
        isCharacterInstanceId(combatantId) &&
        nextState.characters[combatantId].form !== previousCharacterForm;

      if (characterChangedForm) {
        statusChanges.push(
          ...currentCombatant.statuses.map((activeStatus) => ({
            type: "removed" as const,
            combatantId,
            statusId: activeStatus.id,
          })),
        );
      } else if (remainingRounds > 0 && remainingHp > 0) {
        const refreshedStatus = { ...status, remainingRounds };
        nextState = updateStatuses(
          nextState,
          combatantId,
          currentCombatant.statuses.map((candidate) =>
            candidate.id === status.id ? refreshedStatus : candidate,
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
            (candidate) => candidate.id !== status.id,
          ),
        );
        statusChanges.push({
          type: "removed",
          combatantId,
          statusId: status.id,
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
        characterState: getEventCharacterState(nextState, combatantId),
      });

      if (characterChangedForm) {
        break;
      }
    }
  }

  return { state: nextState, nextSeed: randomSeed };
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

function completeVictory(state: CombatState, seed: number): CombatState {
  const nextEncounterId =
    ENCOUNTER_DEFINITIONS[state.encounterId].nextEncounterId;

  if (
    nextEncounterId &&
    ENCOUNTER_DEFINITIONS[nextEncounterId].kind === "rest"
  ) {
    const generatedItems = grantEncounterItemRewards(
      { ...state, randomSeed: seed },
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
  let rewardOffers = state.rewardOffers;

  if (!rewardOffers) {
    const generatedRewards = generateRewardOffers(state, randomSeed);
    rewardOffers = generatedRewards.offers;
    randomSeed = generatedRewards.nextSeed;
  }

  let nextState: CombatState = {
    ...state,
    phase: "victory",
    randomSeed,
    rewardOffers,
    characters: {
      "character-1": {
        ...state.characters["character-1"],
        barrier: 0,
        itemDamageBonus: null,
        abilityDamageBonus: null,
      },
      "character-2": {
        ...state.characters["character-2"],
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

  if (definition?.resolutionTiming !== "preRound") {
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
  nextSeed: number;
} | null {
  const definition = ITEM_DEFINITIONS[action.itemId];
  const actor = state.characters[action.actorId];

  if (
    !definition ||
    (!options.allowDefeatedActor && actor.form !== "living") ||
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
  let randomSeed = seed;

  for (const targetId of targetIds) {
    let damageAmount = 0;
    let absorbedByBarrier = 0;
    let healingAmount = 0;
    let ppRestored = 0;
    let barrierAmount = 0;
    let revived = false;
    const statusChanges: StatusChange[] = [];

    for (const effect of definition.effects) {
      const currentTarget = getCombatant(nextState, targetId);

      if (!currentTarget) {
        continue;
      }

      if (effect.type === "damage") {
        if (currentTarget.hp <= 0) {
          continue;
        }

        let mitigatedDamage = calculateFixedDamage({
          basePower: effect.amount,
          damageType: effect.damageType,
          defender: currentTarget.stats,
        });
        if (
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
        const receivedHealing = isCharacterInstanceId(targetId)
          ? applyGhostReceivedHealing(
              nextState.characters[targetId],
              baseHealing,
            )
          : baseHealing;
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

        const revivedState = reviveGhost(nextState, targetId, effect.hp);
        if (!revivedState) {
          continue;
        }
        nextState = revivedState;
        healingAmount += nextState.characters[targetId].hp;
        revived = true;
      }
    }

    const targetAfterItem = getCombatant(nextState, targetId);

    if (targetAfterItem) {
      impacts.push({
        targetId,
        damageAmount,
        absorbedByBarrier,
        healingAmount,
        ppRestored,
        barrierAmount,
        remainingHp: targetAfterItem.hp,
        remainingPp: targetAfterItem.pp,
        remainingBarrier: targetAfterItem.barrier,
        revived,
        statusChanges,
        characterState: getEventCharacterState(nextState, targetId),
      });
    }
  }

  const actorAfterItem = nextState.characters[action.actorId];

  return {
    nextState,
    nextSeed: randomSeed,
    event: {
      type: "itemUse",
      actorId: action.actorId,
      itemId: action.itemId,
      impacts,
      remainingQuantity: actorAfterItem.inventory[action.itemId] ?? 0,
      damageBonus: actorAfterItem.itemDamageBonus,
    },
  };
}

function getSelectedPlayerActions(selections: RoundSelections) {
  const actions: CombatAction[] = [];

  for (const characterId of CHARACTER_ORDER) {
    const selection = selections[characterId];
    actions.push(...selection.quickActions);

    if (selection.action) {
      actions.push(selection.action);
    }
  }

  return actions;
}

export function resolveRound(
  state: CombatState,
  selections: RoundSelections,
): RoundResult {
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

  const actions = [
    ...getSelectedPlayerActions(selections),
    ...createEnemyActionsFromIntents(state),
  ]
    .map((action, originalOrder) => ({
      action,
      originalOrder,
      resolutionPriority:
        action.kind === "ability"
          ? Math.max(
              getCombatantAbility(
                state,
                action.actorId,
                action.abilityId,
              )?.resolutionPriority ?? 0,
              getSpiritTurnResolutionPriority(state, action.actorId),
            )
          : getSpiritTurnResolutionPriority(state, action.actorId),
      agility: getCombatant(state, action.actorId)?.stats.agility ?? 0,
    }))
    .sort(
      (first, second) =>
        second.resolutionPriority - first.resolutionPriority ||
        second.agility - first.agility ||
        first.originalOrder - second.originalOrder,
    );

  const events: CombatEvent[] = [];
  const delayedItemActions: ItemCombatAction[] = [];
  const activeDamageReductions = new Map<CombatantId, number[]>();
  let randomSeed = state.randomSeed;

  for (const { action } of actions) {
    const actor = getCombatant(nextState, action.actorId);
    const actionIsQuickItem =
      action.kind === "item" &&
      ITEM_DEFINITIONS[action.itemId]?.useTiming === "quickAction";
    const stunnedStatus = actor?.statuses.find(
      (status) => status.id === "stunned",
    );

    if (actor && actor.hp > 0 && stunnedStatus && !actionIsQuickItem) {
      nextState = updateStatuses(
        nextState,
        action.actorId,
        actor.statuses.filter((status) => status.id !== "stunned"),
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
        continue;
      }

      const itemResult = resolveItemUse(nextState, action, randomSeed);

      if (itemResult) {
        nextState = itemResult.nextState;
        randomSeed = itemResult.nextSeed;
        events.push(itemResult.event);
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

    if (
      isCharacterInstanceId(action.actorId) &&
      initialTargetIds.some((targetId) => {
        const target = getCombatant(nextState, targetId);

        return target && "enemyId" in target && !isEnemyTargetable(target);
      })
    ) {
      continue;
    }

    if (
      initialTargetIds.length === 0 ||
      initialTargetIds.every(
        (targetId) => (getCombatant(nextState, targetId)?.hp ?? 0) <= 0,
      )
    ) {
      continue;
    }

    const abilityPpCost =
      isCharacterInstanceId(action.actorId)
        ? getEffectiveAbilityPpCost(
            nextState.characters[action.actorId],
            ability.category,
            ability.ppCost,
          )
        : ability.ppCost;

    if (actor.pp < abilityPpCost) {
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

      nextState = consumeSpiritActiveUse(
        nextState,
        characterActorId,
        activeSpirit.id,
      );
    }

    nextState = spendPp(nextState, action.actorId, abilityPpCost);

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

    if (ability.target === "singleAlly" || ability.target === "allAllies") {
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
        const statusChanges: StatusChange[] = [];

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
                      passiveCombatState: { firstHealUsed: true },
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
            const result = grantBarrierToTarget(
              nextState,
              supportTargetId,
              effect.amount,
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
      continue;
    }

    const outgoingDamageStatus = actor.statuses.find(
      (status) =>
        STATUS_DEFINITIONS[status.id].outgoingDamageModifier !==
        undefined,
    );
    const outgoingDamageMultiplier = outgoingDamageStatus
      ? 1 - (outgoingDamageStatus.magnitude ?? 0)
      : 1;
    const itemDamageBonus =
      isCharacterInstanceId(action.actorId) &&
      ability.category === "ability" &&
      nextState.characters[action.actorId].itemDamageBonus?.expiresRound ===
        state.round
        ? nextState.characters[action.actorId].itemDamageBonus
        : null;
    let firstDamageStatusChanges: StatusChange[] | null = null;
    let actionDealtDamage = false;

    for (const effect of ability.effects) {
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
        events.push({
          type: "wait",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
        });
        continue;
      }

      if (effect.type === "charge") {
        events.push({
          type: "charge",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
          readiedAbilityId: effect.readiesAbilityId,
        });
        continue;
      }

      if (effect.type === "defend") {
        const currentReductions =
          activeDamageReductions.get(action.actorId) ?? [];
        activeDamageReductions.set(action.actorId, [
          ...currentReductions,
          effect.damageReduction,
        ]);
        events.push({
          type: "defend",
          actorId: action.actorId,
          targetId: action.actorId,
          abilityId: action.abilityId,
          abilityRank: ability.rank,
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

      const targetIds =
        ability.target === "allEnemies"
          ? initialTargetIds.filter(
              (targetId) => {
                const target = getCombatant(nextState, targetId);

                return target && "enemyId" in target
                  ? isEnemyTargetable(target)
                  : (target?.hp ?? 0) > 0;
              },
            )
          : initialTargetIds;
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

      for (const targetId of targetIds) {
        const currentTarget = getCombatant(nextState, targetId);
        if (!currentTarget || currentTarget.hp <= 0) {
          continue;
        }

        const damageReductions =
          activeDamageReductions.get(targetId) ?? [];
        const hasLivingAllyBonus =
          effect.damagePerOtherLivingSameEnemy !== undefined &&
          !isCharacterInstanceId(action.actorId);
        const normalDamage = calculateDamage({
          attacker: actor.stats,
          defender: currentTarget.stats,
          element: ability.element,
          effect,
          additionalDamageReductions:
            hasLivingAllyBonus ? [] : damageReductions,
        });
        let isCritical = false;
        let amount = normalDamage;
        const characterActor = isCharacterInstanceId(action.actorId)
          ? nextState.characters[action.actorId]
          : null;
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

        if (effect.usesDamageVariance !== false) {
          const varianceResult = nextRandom(randomSeed);
          randomSeed = varianceResult.nextSeed;
          amount = applyDamageVariance(normalDamage, varianceResult.value);
        }
        const statusChanges: StatusChange[] = [];
        let flashpointStatus: ActiveStatus | null = null;

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
          isCritical = randomResult.value < criticalChance;

          if (isCritical) {
            amount = Math.round(
              amount * effect.criticalHit.damageMultiplier,
            );
          }
        }

        amount = Math.max(
          1,
          Math.round(
            amount *
              outgoingDamageMultiplier *
              (1 + (itemDamageBonus?.amount ?? 0)) *
              (1 + bloodScentBonus) *
              (1 + passiveAbilityDamageBonus),
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
                flashpointStatus = newStatus;
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
            const newStatus = createStatusFromSource(
              nextState,
              action.actorId,
              effect.statusOnHit.statusId,
              { magnitude: effect.statusOnHit.magnitude },
            );
            const result = applyStatusToTarget(nextState, targetId, newStatus);
            nextState = result.state;
            if (result.status) {
              statusChanges.push({
                type: "applied",
                combatantId: targetId,
                status: result.status,
              });
              if (
                result.wasAlreadyActive &&
                result.status.id === "burn" &&
                characterActor &&
                characterHasPassive(characterActor, "flashpoint")
              ) {
                flashpointStatus = newStatus;
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
          ability.category !== "spirit" &&
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
        const calculatedRemainingHp = Math.max(
          0,
          currentTarget.hp - barrierResult.hpDamage,
        );
        nextState = updateBarrier(
          nextState,
          targetId,
          barrierResult.remainingBarrier,
        );
        nextState = updateHp(
          nextState,
          targetId,
          calculatedRemainingHp,
        );
        const remainingHp = getCombatant(nextState, targetId)?.hp ?? 0;

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
          isCharacterInstanceId(targetId) &&
          currentTarget.barrier > 0 &&
          characterHasPassive(nextState.characters[targetId], "thorns")
        ) {
          const reflectedTarget = getCombatant(nextState, action.actorId);

          if (reflectedTarget && reflectedTarget.hp > 0) {
            const thornsDamage = calculateFixedDamage({
              basePower: PASSIVE_VALUES.thornsDamage,
              damageType: "physical",
              defender: reflectedTarget.stats,
            });
            const reflectedBarrierResult = absorbDirectDamage(
              reflectedTarget.barrier,
              thornsDamage,
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
              sourceId: targetId,
              targetId: action.actorId,
              passiveId: "thorns" as const,
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
        } else if (flashpointStatus) {
          const targetAfterDirectDamage = getCombatant(nextState, targetId);
          const burnDamage = STATUS_DEFINITIONS.burn.endOfRoundDamage;

          if (targetAfterDirectDamage && burnDamage) {
            const flashpointAmount = calculateFixedDamage({
              basePower:
                flashpointStatus.tickBasePower ?? burnDamage.basePower,
              damageType: burnDamage.damageType,
              defender: targetAfterDirectDamage.stats,
            });
            const flashpointRemainingHp = Math.max(
              0,
              targetAfterDirectDamage.hp - flashpointAmount,
            );
            const flashpointStatusChanges: StatusChange[] = [];
            nextState = updateHp(
              nextState,
              targetId,
              flashpointRemainingHp,
            );

            if (flashpointRemainingHp <= 0) {
              const wildfire = spreadWildfireAfterEnemyDeath(
                nextState,
                targetId,
                randomSeed,
              );
              nextState = wildfire.state;
              randomSeed = wildfire.nextSeed;
              if (wildfire.statusChange) {
                flashpointStatusChanges.push(wildfire.statusChange);
              }
            }

            followUpStatusEvents.push({
              type: "statusDamage",
              sourceId: flashpointStatus.sourceId,
              targetId,
              statusId: "burn",
              element: burnDamage.element,
              amount: flashpointAmount,
              remainingHp: flashpointRemainingHp,
              isCritical: false,
              statusChanges: flashpointStatusChanges,
            });
          }
        }
        actionDealtDamage = true;
        firstDamageStatusChanges ??= statusChanges;
        impacts.push({
          targetId,
          amount: barrierResult.hpDamage,
          remainingHp,
          absorbedByBarrier: barrierResult.absorbedByBarrier,
          remainingBarrier: barrierResult.remainingBarrier,
          isCritical,
          statusChanges,
          characterState: getEventCharacterState(nextState, targetId),
          reflectedDamage,
        });
      }

      if (impacts.length === 0) {
        continue;
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
        });
      }
      events.push(...followUpStatusEvents);
    }

    if (
      actionDealtDamage &&
      outgoingDamageStatus &&
      firstDamageStatusChanges
    ) {
      const actorAfterAction = getCombatant(nextState, action.actorId);

      if (actorAfterAction) {
        nextState = updateStatuses(
          nextState,
          action.actorId,
          actorAfterAction.statuses.filter(
            (status) => status.id !== outgoingDamageStatus.id,
          ),
        );
        firstDamageStatusChanges.push({
          type: "removed",
          combatantId: action.actorId,
          statusId: outgoingDamageStatus.id,
        });
      }
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
          SPIRIT_DEFINITIONS[spirit.id].passive
            .firstDamageActionEachEncounter !== undefined &&
          !spirit.passiveTriggeredThisEncounter,
      );

      if (passiveSpirit) {
        const passive =
          SPIRIT_DEFINITIONS[passiveSpirit.id].passive
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
            let amount = calculateFixedDamage({
              basePower: passive.basePower,
              damageType: passive.damageType,
              defender: passiveTarget.stats,
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
    }
  }

  const statusResult = resolveEndOfRoundStatuses(
    nextState,
    events,
    randomSeed,
  );
  nextState = statusResult.state;
  randomSeed = statusResult.nextSeed;

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
    (characterId) => nextState.characters[characterId].hp > 0,
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const roundOutcome: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  if (roundOutcome === "victory") {
    nextState = completeVictory(nextState, randomSeed);
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
