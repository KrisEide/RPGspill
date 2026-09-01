import { ENEMY_DEFINITIONS } from "../../data/monsters";
import {
  getKnownAbilityIds,
  getKnownAbilityRank,
  resolveAbility,
} from "../abilities/abilityProgression";
import { CHARACTER_ORDER } from "../playerControl";
import type {
  AbilityId,
  CombatAction,
  CombatState,
  CombatantId,
  EnemyIntent,
  EnemyState,
  ResolvedAbilityDefinition,
} from "../types";
import { nextRandom } from "./random";
import { isEnemyTargetable } from "./targeting";

function getEnemyAbility(
  enemy: EnemyState,
  abilityId: AbilityId,
): ResolvedAbilityDefinition | null {
  const rank = getKnownAbilityRank(enemy.abilityRanks, abilityId);
  return rank ? resolveAbility(abilityId, rank) : null;
}

function getPlannedAbility(
  state: CombatState,
  enemy: EnemyState,
): ResolvedAbilityDefinition | null {
  const definition = ENEMY_DEFINITIONS[enemy.enemyId];
  const knownAbilityIds = getKnownAbilityIds(enemy.abilityRanks);
  const openingPattern = definition.openingActionPattern;
  const repeatingPattern = definition.repeatingActionPattern;
  let abilityId: AbilityId | null | undefined;

  if (openingPattern?.length && state.round <= openingPattern.length) {
    abilityId = openingPattern[state.round - 1];
  } else if (repeatingPattern?.length) {
    const repeatingRound = state.round - (openingPattern?.length ?? 0) - 1;
    abilityId = repeatingPattern[repeatingRound % repeatingPattern.length];
  } else if (definition.actionPattern?.length) {
    abilityId =
      definition.actionPattern[
        (state.round - 1) % definition.actionPattern.length
      ];
  } else {
    abilityId = knownAbilityIds[0];
  }

  let ability = abilityId ? getEnemyAbility(enemy, abilityId) : null;

  if (
    ability?.aiTargeting === "lowestHpPercentageLivingAlly" &&
    !state.enemies.some(
      (ally) => ally.hp > 0 && ally.hp < ally.stats.maxHp,
    )
  ) {
    const attackAbilityId = knownAbilityIds.find(
      (knownAbilityId) =>
        getEnemyAbility(enemy, knownAbilityId)?.target === "singleEnemy",
    );
    ability = attackAbilityId
      ? getEnemyAbility(enemy, attackAbilityId)
      : null;
  }

  return ability;
}

function getLowestHpLivingEnemy(state: CombatState) {
  return state.enemies
    .filter((enemy) => enemy.hp > 0 && enemy.hp < enemy.stats.maxHp)
    .sort(
      (first, second) =>
        first.hp / first.stats.maxHp - second.hp / second.stats.maxHp ||
        first.instanceId.localeCompare(second.instanceId),
    )[0];
}

function getPatternTargetId(
  state: CombatState,
  enemy: EnemyState,
  livingCharacterIds: typeof CHARACTER_ORDER[number][],
) {
  const definition = ENEMY_DEFINITIONS[enemy.enemyId];

  if (definition.targetingPattern !== "splitThenAlternate") {
    return null;
  }

  const matchingLivingEnemies = state.enemies.filter(
    (candidate) =>
      candidate.enemyId === enemy.enemyId && isEnemyTargetable(candidate),
  );

  if (matchingLivingEnemies.length > 1) {
    const splitIndex = matchingLivingEnemies.findIndex(
      (candidate) => candidate.instanceId === enemy.instanceId,
    );
    return livingCharacterIds[splitIndex % livingCharacterIds.length];
  }

  return livingCharacterIds[(state.round - 1) % livingCharacterIds.length];
}

function getRandomPatternAbility(
  state: CombatState,
  enemy: EnemyState,
  seed: number,
) {
  const pattern = ENEMY_DEFINITIONS[enemy.enemyId].randomActionPattern;

  if (!pattern || state.round <= (pattern.startsAfterRound ?? 0)) {
    return { ability: null, nextSeed: seed, isActive: false };
  }

  const previousAbilityId = state.enemyIntents[enemy.instanceId]?.abilityId;
  const withoutPrevious = pattern.preventImmediateRepeat
    ? pattern.abilityIds.filter(
        (abilityId) => abilityId !== previousAbilityId,
      )
    : pattern.abilityIds;
  const candidates = withoutPrevious.length > 0
    ? withoutPrevious
    : pattern.abilityIds;
  const roll = nextRandom(seed);
  const abilityId =
    candidates[Math.floor(roll.value * candidates.length)];

  return {
    ability: abilityId ? getEnemyAbility(enemy, abilityId) : null,
    nextSeed: roll.nextSeed,
    isActive: true,
  };
}

export function prepareEnemyIntents(state: CombatState): CombatState {
  if (state.phase !== "selectingActions") {
    return { ...state, enemyIntents: {} };
  }

  const livingCharacterIds = CHARACTER_ORDER.filter(
    (characterId) => state.characters[characterId].hp > 0,
  );
  let randomSeed = state.randomSeed;
  const enemyIntents: CombatState["enemyIntents"] = {};

  state.enemies.forEach((enemy, index) => {
    if (!isEnemyTargetable(enemy) || livingCharacterIds.length === 0) {
      return;
    }

    const randomPatternResult = getRandomPatternAbility(
      state,
      enemy,
      randomSeed,
    );
    const hasRandomPattern = randomPatternResult.isActive;
    const ability = hasRandomPattern
      ? randomPatternResult.ability
      : getPlannedAbility(state, enemy);
    if (hasRandomPattern) {
      randomSeed = randomPatternResult.nextSeed;
    }
    if (!ability) {
      return;
    }

    let targetId: CombatantId | null = null;
    let targetIds: CombatantId[] = [];
    const patternTargetId = getPatternTargetId(
      state,
      enemy,
      livingCharacterIds,
    );

    if (ability.target === "self") {
      targetId = enemy.instanceId;
      targetIds = [enemy.instanceId];
    } else if (patternTargetId) {
      targetId = patternTargetId;
      targetIds = [patternTargetId];
    } else if (ability.aiTargeting === "randomLivingCharacter") {
      const targetRoll = nextRandom(randomSeed);
      randomSeed = targetRoll.nextSeed;
      targetId =
        livingCharacterIds[
          Math.floor(targetRoll.value * livingCharacterIds.length)
        ];
      targetIds = [targetId];
    } else if (
      ability.aiTargeting === "lowestHpPercentageLivingAlly"
    ) {
      const target = getLowestHpLivingEnemy(state);
      targetId = target?.instanceId ?? null;
      targetIds = targetId ? [targetId] : [];
    } else if (ability.target === "allEnemies") {
      targetIds = [...livingCharacterIds];
    } else if (ability.target === "allAllies") {
      targetIds = state.enemies
        .filter((ally) => ally.hp > 0)
        .map((ally) => ally.instanceId);
    } else {
      targetId =
        livingCharacterIds[
          (state.round - 1 + index) % livingCharacterIds.length
        ];
      targetIds = [targetId];
    }

    enemyIntents[enemy.instanceId] = {
      abilityId: ability.id,
      targetId,
      targetIds,
    } satisfies EnemyIntent;
  });

  return {
    ...state,
    randomSeed,
    enemyIntents,
  };
}

export function createEnemyActionsFromIntents(
  state: CombatState,
): CombatAction[] {
  return state.enemies.flatMap((enemy) => {
    const intent = state.enemyIntents[enemy.instanceId];

    return intent && isEnemyTargetable(enemy)
      ? [
          {
            kind: "ability" as const,
            actorId: enemy.instanceId,
            abilityId: intent.abilityId,
            targetId: intent.targetId,
          },
        ]
      : [];
  });
}
