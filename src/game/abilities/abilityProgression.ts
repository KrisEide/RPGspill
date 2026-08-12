import { ABILITIES } from "../../data/abilities";
import type {
  AbilityCategory,
  AbilityId,
  AbilityRank,
  KnownAbilities,
  ResolvedAbilityDefinition,
} from "../types";

export function getKnownAbilityRank(
  abilityRanks: KnownAbilities,
  abilityId: AbilityId,
) {
  return abilityRanks[abilityId] ?? null;
}

export function getKnownAbilityIds(abilityRanks: KnownAbilities) {
  return (Object.keys(abilityRanks) as AbilityId[]).filter(
    (abilityId) => abilityRanks[abilityId] !== undefined,
  );
}

export function hasKnownAbilityInCategory(
  abilityRanks: KnownAbilities,
  category: AbilityCategory,
) {
  return getKnownAbilityIds(abilityRanks).some(
    (abilityId) => ABILITIES[abilityId].category === category,
  );
}

export function getLearnableAbilityIds(abilityRanks: KnownAbilities) {
  return Object.values(ABILITIES)
    .filter(
      (definition) =>
        definition.category === "ability" &&
        getKnownAbilityRank(abilityRanks, definition.id) === null,
    )
    .map((definition) => definition.id);
}

export function getUpgradeableAbilityIds(abilityRanks: KnownAbilities) {
  return Object.values(ABILITIES)
    .filter(
      (definition) =>
        definition.category === "ability" &&
        getKnownAbilityRank(abilityRanks, definition.id) === 1 &&
        Boolean(definition.ranks[2]),
    )
    .map((definition) => definition.id);
}

export function resolveAbility(
  abilityId: AbilityId,
  rank: AbilityRank,
): ResolvedAbilityDefinition | null {
  const definition = ABILITIES[abilityId];
  const rankDefinition = definition.ranks[rank];

  if (!rankDefinition) {
    return null;
  }

  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    resolutionPriority: definition.resolutionPriority,
    target: definition.target,
    element: definition.element,
    aiTargeting: definition.aiTargeting,
    rank,
    description: rankDefinition.description,
    ppCost: rankDefinition.ppCost,
    effects: rankDefinition.effects,
  };
}

export function learnAbility(
  abilityRanks: KnownAbilities,
  abilityId: AbilityId,
): KnownAbilities | null {
  const definition = ABILITIES[abilityId];

  if (
    definition.category !== "ability" ||
    getKnownAbilityRank(abilityRanks, abilityId) !== null
  ) {
    return null;
  }

  return {
    ...abilityRanks,
    [abilityId]: 1,
  };
}

export function upgradeAbility(
  abilityRanks: KnownAbilities,
  abilityId: AbilityId,
): KnownAbilities | null {
  const currentRank = getKnownAbilityRank(abilityRanks, abilityId);
  const definition = ABILITIES[abilityId];

  if (
    definition.category !== "ability" ||
    currentRank !== 1 ||
    !definition.ranks[2]
  ) {
    return null;
  }

  return {
    ...abilityRanks,
    [abilityId]: 2,
  };
}
