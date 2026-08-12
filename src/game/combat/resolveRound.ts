import { calculateDamage } from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { combineDamageReductions } from "./damageMitigation";
import { nextRandom } from "./random";
import { STATUS_DEFINITIONS } from "../../data/statuses";
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
  RoundResult,
  RoundOutcomePhase,
  RoundSelections,
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
  const rank = actor
    ? getKnownAbilityRank(actor.abilityRanks, abilityId)
    : null;

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
        statuses: [...state.characters["character-1"].statuses],
      },
      "character-2": {
        ...state.characters["character-2"],
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

    nextState = spendPp(nextState, action.actorId, ability.ppCost);

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
        const varianceResult = nextRandom(randomSeed);
        randomSeed = varianceResult.nextSeed;
        let isCritical = false;
        let amount = applyDamageVariance(normalDamage, varianceResult.value);
        const statusChanges = [];

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
          isCritical = randomResult.value < effect.criticalHit.chance;

          if (isCritical) {
            amount = Math.round(
              amount * effect.criticalHit.damageMultiplier,
            );
          }
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
              status: newStatus,
            });
          }
        }

        const remainingHp = Math.max(0, currentTarget.hp - amount);
        nextState = updateHp(nextState, targetId, remainingHp);
        impacts.push({
          targetId,
          amount,
          remainingHp,
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
  }

  const playersAlive = CHARACTER_ORDER.some(
    (characterId) => nextState.characters[characterId].hp > 0,
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const phase: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  return {
    nextState: {
      ...nextState,
      randomSeed,
      round: phase === "selectingActions" ? state.round + 1 : state.round,
      phase,
    },
    events,
  };
}
