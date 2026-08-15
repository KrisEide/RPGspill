import type {
  KnownSpirits,
  SpiritDefinition,
  SpiritId,
} from "../game/types";

export const SPIRIT_DEFINITIONS: Record<SpiritId, SpiritDefinition> = {
  embertail: {
    id: "embertail",
    name: "Embertail",
    element: "fire",
    passive: {
      name: "Embertail's Flame",
      description:
        "The first time you attack each round, deal 3 additional Spirit Fire damage to one enemy hit.",
      firstDamageActionEachRound: {
        basePower: 3,
        damageType: "elemental",
        element: "fire",
      },
    },
    activeAbilityId: "cinderburst",
    activeUsesPerEncounter: 1,
  },
};

export function createSpiritState(spiritId: SpiritId) {
  const definition = SPIRIT_DEFINITIONS[spiritId];

  return {
    id: spiritId,
    activeUsesRemaining: definition.activeUsesPerEncounter,
    passiveTriggeredRound: null,
  };
}

export function createKnownSpirits(spiritIds: SpiritId[]): KnownSpirits {
  return Object.fromEntries(
    spiritIds.map((spiritId) => [spiritId, createSpiritState(spiritId)]),
  );
}

export function refreshSpiritActiveUses(spirits: KnownSpirits): KnownSpirits {
  return Object.fromEntries(
    Object.keys(spirits).map((spiritId) => [
      spiritId,
      createSpiritState(spiritId as SpiritId),
    ]),
  );
}

export function getSpiritForActiveAbility(
  spirits: KnownSpirits,
  abilityId: string,
) {
  return Object.values(spirits).find(
    (spirit) =>
      spirit &&
      SPIRIT_DEFINITIONS[spirit.id].activeAbilityId === abilityId,
  );
}
