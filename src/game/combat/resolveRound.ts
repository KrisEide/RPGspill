import {
  calculateDamage,
  calculateFixedDamage,
} from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { combineDamageReductions } from "./damageMitigation";
import { absorbDirectDamage, addBarrier } from "./barrier";
import { nextRandom } from "./random";
import { STATUS_DEFINITIONS } from "../../data/statuses";
import { generateRewardOffers } from "../rewards/rewardSystem";
import {
  getSpiritForActiveAbility,
  SPIRIT_DEFINITIONS,
} from "../../data/spirits";
import {
  CHARACTER_ORDER,
  isCharacterInstanceId,
} from "../playerControl";
import {
  getKnownAbilityIds,
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
  RoundResult,
  RoundOutcomePhase,
  RoundSelections,
  StatusChange,
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
  const rank = knownRank ?? (activeSpirit ? 1 : null);

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
        [id]: { ...character, hp },
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

function markSpiritPassiveTriggered(
  state: CombatState,
  characterId: CharacterInstanceId,
  spiritId: SpiritId,
  round: number,
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
            passiveTriggeredRound: round,
          },
        },
      },
    },
  };
}

function resolveEndOfRoundStatuses(
  state: CombatState,
  events: CombatEvent[],
): CombatState {
  let nextState = state;
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

      const amount = calculateFixedDamage({
        basePower: damage.basePower,
        damageType: damage.damageType,
        defender: currentCombatant.stats,
      });
      const remainingHp = Math.max(0, currentCombatant.hp - amount);
      const remainingRounds = (status.remainingRounds ?? 1) - 1;
      const statusChanges: StatusChange[] = [];

      nextState = updateHp(nextState, combatantId, remainingHp);

      if (remainingRounds > 0 && remainingHp > 0) {
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
      });
    }
  }

  return nextState;
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

function createEnemyActions(state: CombatState): CombatAction[] {
  const livingCharacters = CHARACTER_ORDER.filter(
    (characterId) => state.characters[characterId].hp > 0,
  );

  if (livingCharacters.length === 0) {
    return [];
  }

  return state.enemies
    .filter((enemy) => enemy.hp > 0)
    .flatMap((enemy, index) => {
      const abilityId = getKnownAbilityIds(enemy.abilityRanks)[0];
      const ability = abilityId
        ? getCombatantAbility(state, enemy.instanceId, abilityId)
        : null;

      return abilityId && ability
        ? [
            {
              actorId: enemy.instanceId,
              abilityId,
              targetId:
                ability.aiTargeting === "randomLivingCharacter"
                  ? null
                  : livingCharacters[
                      (state.round - 1 + index) %
                        livingCharacters.length
                    ],
            },
          ]
        : [];
    });
}

function getSelectedPlayerActions(selections: RoundSelections) {
  const actions: CombatAction[] = [];

  for (const characterId of CHARACTER_ORDER) {
    const action = selections[characterId];
    if (action) {
      actions.push(action);
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
    ...createEnemyActions(state),
  ]
    .map((action, originalOrder) => ({
      action,
      originalOrder,
      resolutionPriority:
        getCombatantAbility(
          state,
          action.actorId,
          action.abilityId,
        )?.resolutionPriority ?? 0,
      agility: getCombatant(state, action.actorId)?.stats.agility ?? 0,
    }))
    .sort(
      (first, second) =>
        second.resolutionPriority - first.resolutionPriority ||
        second.agility - first.agility ||
        first.originalOrder - second.originalOrder,
    );

  const events: CombatEvent[] = [];
  const activeDamageReductions = new Map<CombatantId, number[]>();
  let randomSeed = state.randomSeed;

  for (const { action } of actions) {
    const actor = getCombatant(nextState, action.actorId);
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
      !isCharacterInstanceId(action.actorId)
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

    const initialTargetIds =
      ability?.target === "allEnemies"
        ? nextState.enemies
            .filter((enemy) => enemy.hp > 0)
            .map((enemy) => enemy.instanceId)
        : resolvedTargetId
          ? [resolvedTargetId]
          : [];

    if (
      initialTargetIds.length === 0 ||
      initialTargetIds.every(
        (targetId) => (getCombatant(nextState, targetId)?.hp ?? 0) <= 0,
      )
    ) {
      continue;
    }

    if (actor.pp < ability.ppCost) {
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

    nextState = spendPp(nextState, action.actorId, ability.ppCost);

    if (
      ability.target === "singleAlly" &&
      resolvedTargetId &&
      isCharacterInstanceId(action.actorId) &&
      isCharacterInstanceId(resolvedTargetId)
    ) {
      let healingAmount = 0;
      let barrierAmount = 0;
      const statusChanges: StatusChange[] = [];

      for (const effect of ability.effects) {
        const currentTarget = nextState.characters[resolvedTargetId];

        if (effect.type === "healing") {
          const healingPower = Math.round(
            effect.basePower +
              (ability.element
                ? actor.stats.elementalPower[ability.element]
                : 0) *
                effect.elementalPowerScaling,
          );
          const remainingHp = Math.min(
            currentTarget.stats.maxHp,
            currentTarget.hp + healingPower,
          );
          healingAmount += remainingHp - currentTarget.hp;
          nextState = updateHp(nextState, resolvedTargetId, remainingHp);
          continue;
        }

        if (effect.type === "barrier") {
          const remainingBarrier = addBarrier(
            currentTarget.barrier,
            effect.amount,
            currentTarget.stats.maxHp,
          );
          barrierAmount += remainingBarrier - currentTarget.barrier;
          nextState = updateBarrier(
            nextState,
            resolvedTargetId,
            remainingBarrier,
          );
          continue;
        }

        if (effect.type === "cleanse") {
          const statusExists = currentTarget.statuses.some(
            (status) => status.id === effect.statusId,
          );

          if (statusExists) {
            nextState = updateStatuses(
              nextState,
              resolvedTargetId,
              currentTarget.statuses.filter(
                (status) => status.id !== effect.statusId,
              ),
            );
            statusChanges.push({
              type: "removed",
              combatantId: resolvedTargetId,
              statusId: effect.statusId,
            });
          }
        }
      }

      const targetAfterSupport = nextState.characters[resolvedTargetId];
      events.push({
        type: "support",
        actorId: action.actorId,
        targetId: resolvedTargetId,
        abilityId: action.abilityId,
        abilityRank: ability.rank,
        healingAmount,
        remainingHp: targetAfterSupport.hp,
        barrierAmount,
        remainingBarrier: targetAfterSupport.barrier,
        statusChanges,
      });
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
    let firstDamageStatusChanges: StatusChange[] | null = null;
    let actionDealtDamage = false;

    for (const effect of ability.effects) {
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
        continue;
      }

      if (effect.type !== "damage") {
        continue;
      }

      const targetIds =
        ability.target === "allEnemies"
          ? nextState.enemies
              .filter((enemy) => enemy.hp > 0)
              .map((enemy) => enemy.instanceId)
          : initialTargetIds;
      const impacts = [];

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

        if (effect.usesDamageVariance !== false) {
          const varianceResult = nextRandom(randomSeed);
          randomSeed = varianceResult.nextSeed;
          amount = applyDamageVariance(normalDamage, varianceResult.value);
        }
        const statusChanges: StatusChange[] = [];

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
          Math.round(amount * outgoingDamageMultiplier),
        );

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
          const newStatus: ActiveStatus = {
            id: effect.statusOnCriticalHit,
            sourceId: action.actorId,
            appliedRound: state.round,
            remainingRounds:
              STATUS_DEFINITIONS[effect.statusOnCriticalHit]
                .durationRounds,
          };

          if (targetAfterConsumption) {
            nextState = updateStatuses(nextState, targetId, [
              ...targetAfterConsumption.statuses.filter(
                (status) => status.id !== newStatus.id,
              ),
              newStatus,
            ]);
            statusChanges.push({
              type: "applied" as const,
              combatantId: targetId,
              status: newStatus,
            });
          }
        }

        if (effect.statusOnHit) {
          const targetAfterOtherStatuses = getCombatant(
            nextState,
            targetId,
          );
          const newStatus: ActiveStatus = {
            id: effect.statusOnHit.statusId,
            sourceId: action.actorId,
            appliedRound: state.round,
            magnitude: effect.statusOnHit.magnitude,
            remainingRounds:
              STATUS_DEFINITIONS[effect.statusOnHit.statusId]
                .durationRounds,
          };

          if (targetAfterOtherStatuses) {
            nextState = updateStatuses(nextState, targetId, [
              ...targetAfterOtherStatuses.statuses.filter(
                (status) => status.id !== newStatus.id,
              ),
              newStatus,
            ]);
            statusChanges.push({
              type: "applied",
              combatantId: targetId,
              status: newStatus,
            });
          }
        }

        const barrierResult = absorbDirectDamage(
          currentTarget.barrier,
          amount,
        );
        const remainingHp = Math.max(
          0,
          currentTarget.hp - barrierResult.hpDamage,
        );
        nextState = updateBarrier(
          nextState,
          targetId,
          barrierResult.remainingBarrier,
        );
        nextState = updateHp(nextState, targetId, remainingHp);
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
        });
      }

      if (impacts.length === 0) {
        continue;
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
      isCharacterInstanceId(action.actorId)
    ) {
      const characterAfterAction = nextState.characters[action.actorId];
      const passiveSpirit = Object.values(characterAfterAction.spirits).find(
        (spirit) =>
          spirit &&
          spirit.passiveTriggeredRound !== state.round,
      );

      if (passiveSpirit) {
        const passive =
          SPIRIT_DEFINITIONS[passiveSpirit.id].passive
            .firstDamageActionEachRound;
        const eligiblePassiveTargetIds = initialTargetIds.filter(
          (targetId) =>
            (getCombatant(nextState, targetId)?.hp ?? 0) > 0,
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
          nextState = markSpiritPassiveTriggered(
            nextState,
            action.actorId,
            passiveSpirit.id,
            state.round,
          );
          const passiveTarget = getCombatant(nextState, passiveTargetId);

          if (passiveTarget && passiveTarget.hp > 0) {
            const amount = calculateFixedDamage({
              basePower: passive.basePower,
              damageType: passive.damageType,
              defender: passiveTarget.stats,
            });
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
              statusChanges: [],
            });
          }
        }
      }
    }
  }

  nextState = resolveEndOfRoundStatuses(nextState, events);

  const playersAlive = CHARACTER_ORDER.some(
    (characterId) => nextState.characters[characterId].hp > 0,
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const phase: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  if (phase === "victory") {
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
  }

  let rewardOffers = nextState.rewardOffers;

  if (phase === "victory" && !rewardOffers) {
    const generatedRewards = generateRewardOffers(randomSeed);
    rewardOffers = generatedRewards.offers;
    randomSeed = generatedRewards.nextSeed;
  }

  return {
    nextState: {
      ...nextState,
      randomSeed,
      round: phase === "selectingActions" ? state.round + 1 : state.round,
      phase,
      rewardOffers,
    },
    events,
  };
}
