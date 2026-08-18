import type {
  KnownSpirits,
  SpiritDefinition,
  SpiritId,
} from "../game/types";

export const SPIRIT_DEFINITIONS: Record<SpiritId, SpiritDefinition> = {
  embertail: {
    id: "embertail",
    name: "Embertail",
    icon: "🔥",
    element: "fire",
    passive: {
      name: "Embertail",
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
  stoneback: {
    id: "stoneback",
    name: "Stoneback",
    icon: "🪨",
    element: "earth",
    passive: {
      name: "Stoneback",
      description:
        "The first time you gain Barrier each encounter, gain 5 additional Barrier.",
      firstBarrierGainEachEncounter: {
        additionalBarrier: 5,
      },
    },
    activeAbilityId: "stoneback",
    activeUsesPerEncounter: 1,
  },
  swiftWing: {
    id: "swiftWing",
    name: "Swift Wing",
    icon: "🪽",
    element: "wind",
    passive: {
      name: "Swift Wing",
      description:
        "At the start of each round, gain a 20% chance to act first regardless of Agility.",
      roundStartTurnPriority: {
        chance: 0.2,
        resolutionPriority: 200,
      },
    },
    activeAbilityId: "swiftWing",
    activeUsesPerEncounter: 1,
  },
  riverheart: {
    id: "riverheart",
    name: "Riverheart",
    icon: "💧",
    element: "water",
    passive: {
      name: "Riverheart",
      description: "All healing received by both heroes is increased by 2.",
      allHealingReceived: {
        flatIncrease: 2,
      },
    },
    activeAbilityId: "riverheart",
    activeUsesPerEncounter: 1,
  },
};

export function createSpiritState(spiritId: SpiritId) {
  const definition = SPIRIT_DEFINITIONS[spiritId];

  return {
    id: spiritId,
    activeUsesRemaining: definition.activeUsesPerEncounter,
    passiveTriggeredRound: null,
    passiveTriggeredThisEncounter: false,
    roundPriorityActive: false,
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
