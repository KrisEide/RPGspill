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
        "Your first attack each encounter deals 9 additional Spirit Fire damage to one enemy hit.",
      firstDamageActionEachEncounter: {
        basePower: 9,
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
  warhound: {
    id: "warhound",
    name: "Warhound",
    icon: "🐺",
    element: null,
    passive: {
      name: "Warhound",
      description:
        "Your first Auto Attack each round is Quick and does not consume your action.",
      firstAutoAttackEachRoundIsQuick: true,
    },
    activeAbilityId: "warhound",
    activeUsesPerEncounter: 1,
  },
  guardDog: {
    id: "guardDog",
    name: "Guard Dog",
    icon: "🐕",
    element: null,
    passive: {
      name: "Guard Dog",
      description:
        "Whenever you use a non-damaging action, the Spirit attacks one random enemy for 3 Spirit Physical damage.",
      nonDamagingActionSpiritAttack: {
        basePower: 3,
        damageType: "physical",
      },
    },
    activeAbilityId: "bodyguard",
    activeUsesPerEncounter: 1,
  },
  ironquill: {
    id: "ironquill",
    name: "Ironquill",
    icon: "🪶",
    element: null,
    passive: {
      name: "Ironquill",
      description:
        "Whenever you use a Steel Dart, your next damaging ability deals 10% more damage. This stacks for every Steel Dart and is consumed by the ability.",
      steelDartAbilityAmplifier: {
        damageBonusPerDart: 0.1,
      },
    },
    activeAbilityId: "ironquill",
    activeUsesPerEncounter: 1,
  },
};

export function createSpiritState(spiritId: SpiritId) {
  const definition = SPIRIT_DEFINITIONS[spiritId];

  return {
    id: spiritId,
    activeUsesRemaining: definition.activeUsesPerEncounter,
    passiveTriggeredThisEncounter: false,
    roundPriorityActive: false,
    steelDartAbilityBonusStacks: 0,
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
