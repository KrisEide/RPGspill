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
    useTiming: definition.useTiming,
    turnOrderRule: definition.turnOrderRule,
    target: definition.target,
    secondaryTarget: definition.secondaryTarget,
    element: definition.element,
    aiTargeting: definition.aiTargeting,
    rank,
    shortDescription: rankDefinition.shortDescription,
    description: rankDefinition.description,
    ppCost: rankDefinition.ppCost,
    effects: rankDefinition.effects,
  };
}

function formatScalingPercent(multiplier: number) {
  return `${Math.round(multiplier * 100)}%`;
}

function formatElementName(element: NonNullable<ResolvedAbilityDefinition["element"]>) {
  return `${element[0].toUpperCase()}${element.slice(1)} Power`;
}

export function getAbilityScalingDescription(
  ability: ResolvedAbilityDefinition,
) {
  const scalingFormulas = ability.effects.flatMap((effect) => {
    if (
      effect.type !== "damage" &&
      effect.type !== "healing" &&
      effect.type !== "applyStatus"
    ) {
      return [];
    }

    const scalingParts: string[] = [];

    if (effect.type === "damage" && effect.attackScaling > 0) {
      scalingParts.push(
        `${formatScalingPercent(effect.attackScaling)} Attack`,
      );
    }

    if (effect.elementalPowerScaling > 0 && ability.element) {
      scalingParts.push(
        `${formatScalingPercent(effect.elementalPowerScaling)} ${formatElementName(ability.element)}`,
      );
    }

    return scalingParts.length > 0 ? [scalingParts.join(" + ")] : [];
  });

  return Array.from(new Set(scalingFormulas)).join(" / ");
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
