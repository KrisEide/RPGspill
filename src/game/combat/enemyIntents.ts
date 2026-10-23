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

function getOrcMageAbility(state: CombatState, enemy: EnemyState) {
  const darkBoltsSinceShatter =
    enemy.orcMageDarkBoltsSinceShatter ?? 0;
  const anyHeroHasBarrier = CHARACTER_ORDER.some(
    (characterId) => state.characters[characterId].barrier > 0,
  );
  const abilityId =
    darkBoltsSinceShatter >= 2 && anyHeroHasBarrier
      ? "shatterWard"
      : "darkBolt";

  return getEnemyAbility(enemy, abilityId);
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

function prepareRockwhistlerIntents(state: CombatState): CombatState {
  const livingCharacterIds = CHARACTER_ORDER.filter(
    (characterId) => state.characters[characterId].hp > 0,
  );
  if (livingCharacterIds.length === 0) return { ...state, enemyIntents: {} };

  let randomSeed = state.randomSeed;
  const enemyIntents: CombatState["enemyIntents"] = {};
  const livingPack = state.enemies.filter(
    (enemy) => enemy.enemyId === "rockwhistler" && enemy.hp > 0,
  );
  const surfacePack = livingPack.filter(isEnemyTargetable);
  const callUsed = state.enemies.some(
    (enemy) => enemy.summonedByAbilityId === "rockwhistlerCall",
  );
  const deadCount = state.enemies.filter(
    (enemy) => enemy.enemyId === "rockwhistler" && enemy.hp <= 0,
  ).length;
  const caller = deadCount >= 2 && !callUsed ? surfacePack[0] : undefined;
  const cycleRound = (state.round - 1) % 3;
  let enemies = state.enemies;

  if (cycleRound === 0) {
    const previousTarget = livingPack.find(
      (enemy) => enemy.rockwhistlerFocusTargetId,
    )?.rockwhistlerFocusTargetId;
    let focusTarget = previousTarget && livingCharacterIds.includes(previousTarget)
      ? livingCharacterIds.find((id) => id !== previousTarget) ?? previousTarget
      : undefined;
    if (!focusTarget) {
      const roll = nextRandom(randomSeed);
      randomSeed = roll.nextSeed;
      focusTarget = livingCharacterIds[Math.floor(roll.value * livingCharacterIds.length)];
    }
    enemies = state.enemies.map((enemy) =>
      enemy.enemyId === "rockwhistler"
        ? { ...enemy, rockwhistlerFocusTargetId: focusTarget }
        : enemy,
    );
    for (const enemy of surfacePack) {
      enemyIntents[enemy.instanceId] = enemy === caller
        ? { abilityId: "rockwhistlerCall", targetId: enemy.instanceId, targetIds: [enemy.instanceId] }
        : { abilityId: "rockwhistlerPackAttack", targetId: focusTarget, targetIds: [focusTarget] };
    }
  } else if (cycleRound === 1) {
    const burrowCandidates = surfacePack.filter((enemy) => enemy !== caller);
    const burrowers: typeof burrowCandidates = [];
    while (burrowCandidates.length > 0 && burrowers.length < 2) {
      const roll = nextRandom(randomSeed);
      randomSeed = roll.nextSeed;
      const selectedIndex = Math.floor(roll.value * burrowCandidates.length);
      const [selected] = burrowCandidates.splice(selectedIndex, 1);
      if (selected) {
        burrowers.push(selected);
      }
    }
    for (const enemy of surfacePack) {
      if (enemy === caller) {
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerCall", targetId: enemy.instanceId, targetIds: [enemy.instanceId] };
      } else if (burrowers.includes(enemy)) {
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerBurrow", targetId: enemy.instanceId, targetIds: [enemy.instanceId] };
      } else {
        const roll = nextRandom(randomSeed); randomSeed = roll.nextSeed;
        const targetId = livingCharacterIds[Math.floor(roll.value * livingCharacterIds.length)];
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerAttack", targetId, targetIds: [targetId] };
      }
    }
  } else {
    for (const enemy of livingPack) {
      const isBurrowed = enemy.statuses.some((status) => status.id === "burrowed");
      if (isBurrowed) {
        const roll = nextRandom(randomSeed); randomSeed = roll.nextSeed;
        const targetId = livingCharacterIds[Math.floor(roll.value * livingCharacterIds.length)];
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerAmbush", targetId, targetIds: [targetId], isChargeRelease: true };
      } else if (enemy === caller) {
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerCall", targetId: enemy.instanceId, targetIds: [enemy.instanceId] };
      } else {
        const roll = nextRandom(randomSeed); randomSeed = roll.nextSeed;
        const targetId = livingCharacterIds[Math.floor(roll.value * livingCharacterIds.length)];
        enemyIntents[enemy.instanceId] = { abilityId: "rockwhistlerAttack", targetId, targetIds: [targetId] };
      }
    }
  }

  return { ...state, enemies, randomSeed, enemyIntents };
}

export function prepareEnemyIntents(state: CombatState): CombatState {
  if (state.phase !== "selectingActions") {
    return { ...state, enemyIntents: {} };
  }

  if (state.encounterId === "rockwhistlerRidge") {
    return prepareRockwhistlerIntents(state);
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

    const storedCharge = enemy.statuses.find(
      (status) => status.id === "abilityCharge" && status.readiedAbilityId,
    );
    const chargedAbility = storedCharge?.readiedAbilityId
      ? getEnemyAbility(enemy, storedCharge.readiedAbilityId)
      : null;
    const randomPatternResult = getRandomPatternAbility(
      state,
      enemy,
      randomSeed,
    );
    const hasRandomPattern = !chargedAbility && randomPatternResult.isActive;
    const ability = chargedAbility ?? (
      enemy.enemyId === "orcMage"
        ? getOrcMageAbility(state, enemy)
        : hasRandomPattern
          ? randomPatternResult.ability
          : getPlannedAbility(state, enemy)
    );
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
    const goatChargeTargetId =
      ability.id === "goatCharge"
        ? livingCharacterIds.find((characterId) =>
            state.characters[characterId].statuses.some(
              (status) =>
                status.id === "goatMarked" &&
                status.readiedAbilityId === "goatCharge",
            ),
          )
        : undefined;

    if (ability.target === "self") {
      targetId = enemy.instanceId;
      targetIds = [enemy.instanceId];
    } else if (goatChargeTargetId) {
      targetId = goatChargeTargetId;
      targetIds = [goatChargeTargetId];
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
      ...(chargedAbility ? { isChargeRelease: true } : {}),
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

    return intent && (isEnemyTargetable(enemy) || intent.abilityId === "rockwhistlerAmbush")
      ? [
          {
            kind: "ability" as const,
            actorId: enemy.instanceId,
            abilityId: intent.abilityId,
            targetId: intent.targetId,
            isChargeRelease: intent.isChargeRelease,
          },
        ]
      : [];
  });
}
