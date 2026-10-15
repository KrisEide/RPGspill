import type {
  KnownSpirits,
  SpiritDefinition,
  SpiritId,
} from "../game/types";

export const SPIRIT_DEFINITIONS: Record<SpiritId, SpiritDefinition> = {
  bloodpact: {
    id: "bloodpact",
    name: "Bloodpact",
    icon: "🩸",
    element: null,
    tags: ["spirit", "sacrifice", "barrier", "partner", "low_hp"],
    passive: {
      name: "Bloodpact",
      shortDescription:
        "Sacrifice loses 1 HP; Protected gains 2 Barrier each round.",
      description:
        "At encounter start, choose Sacrifice and Protected. Roles stay locked. At the start of each round, Sacrifice loses 1 HP, ignoring Barrier, then Protected gains 2 Barrier. Pauses while either hero is not living.",
      roundStartBloodpact: { hpCost: 1, barrierAmount: 2 },
    },
    activeAbilityId: "bloodpact",
    activeUsesPerEncounter: 1,
  },
  embertail: {
    id: "embertail",
    name: "Embertail",
    icon: "🔥",
    element: "fire",
    tags: ["spirit", "fire", "burn", "aoe", "opener"],
    passive: {
      name: "Embertail",
      shortDescription:
        "Your first attack each encounter deals bonus Fire damage.",
      description:
        "Your first attack each encounter deals 7 + 20% of Fire Power as additional Spirit Fire damage to one enemy hit.",
      firstDamageActionEachEncounter: {
        basePower: 7,
        damageType: "elemental",
        element: "fire",
        elementalPowerScaling: 0.2,
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
    tags: ["spirit", "earth", "barrier", "partner"],
    passive: {
      name: "Stoneback",
      shortDescription:
        "Your first Barrier gain each encounter grants +5 Barrier.",
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
    tags: ["spirit", "wind", "agility", "opener"],
    passive: {
      name: "Swift Wing",
      shortDescription: "20% chance to act first each round.",
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
    tags: ["spirit", "water", "healing", "partner"],
    passive: {
      name: "Riverheart",
      shortDescription: "Both heroes receive +2 healing.",
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
    tags: ["spirit", "physical", "auto_attack", "quick", "damage"],
    passive: {
      name: "Warhound",
      shortDescription:
        "Your first Auto Attack each encounter is Quick and free.",
      description:
        "Once per encounter, your first Auto Attack is Quick, resolves immediately, and does not consume your action.",
      firstAutoAttackEachEncounterIsQuick: true,
    },
    activeAbilityId: "warhound",
    activeUsesPerEncounter: 1,
  },
  guardDog: {
    id: "guardDog",
    name: "Guard Dog",
    icon: "🐕",
    element: null,
    tags: ["spirit", "physical", "defend", "partner", "damage"],
    passive: {
      name: "Guard Dog",
      shortDescription:
        "Non-damaging actions make the Spirit attack for 5 damage.",
      description:
        "Whenever you use a non-damaging action, the Spirit attacks one random enemy for 5 Spirit Physical damage.",
      nonDamagingActionSpiritAttack: {
        basePower: 5,
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
    tags: ["spirit", "items", "physical", "quick", "damage"],
    passive: {
      name: "Ironquill",
      shortDescription:
        "Steel Darts grant +10% to your next damaging ability.",
      description:
        "Whenever you use a Steel Dart, your next damaging ability deals 10% more damage. This stacks for every Steel Dart and is consumed by the ability.",
      steelDartAbilityAmplifier: {
        damageBonusPerDart: 0.1,
      },
    },
    activeAbilityId: "ironquill",
    activeUsesPerEncounter: 1,
  },
  phoenix: {
    id: "phoenix",
    name: "Phoenix",
    icon: "🐦‍🔥",
    element: "fire",
    tags: ["spirit", "fire", "healing", "revive", "low_hp"],
    passive: {
      name: "Warm Embers",
      shortDescription: "Restore 2 HP at the start of each round.",
      description:
        "At the start of each round, restore 2 HP while living. Phoenix Tonics used by this hero revive with 10 additional HP.",
      roundStartHealing: { amount: 2 },
      phoenixTonicReviveBonus: { amount: 10 },
    },
    activeAbilityId: "phoenixRebirth",
    activeUsesPerEncounter: 1,
    automaticActive: true,
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
    ...(spiritId === "bloodpact" ? { bloodpactRoles: null } : {}),
  };
}

export function createKnownSpirits(spiritIds: SpiritId[]): KnownSpirits {
  return Object.fromEntries(
    spiritIds.map((spiritId) => [spiritId, createSpiritState(spiritId)]),
  );
}

export function refreshSpiritActiveUses(spirits: KnownSpirits): KnownSpirits {
  return Object.fromEntries(
    Object.keys(spirits).map((spiritId) => {
      const typedSpiritId = spiritId as SpiritId;
      const spirit = spirits[typedSpiritId];

      return [
        spiritId,
        SPIRIT_DEFINITIONS[typedSpiritId].automaticActive && spirit
          ? {
              ...createSpiritState(typedSpiritId),
              activeUsesRemaining: spirit.activeUsesRemaining,
            }
          : createSpiritState(typedSpiritId),
      ];
    }),
  );
}

export function getSpiritForActiveAbility(
  spirits: KnownSpirits,
  abilityId: string,
) {
  return Object.values(spirits).find(
    (spirit) =>
      spirit &&
      !SPIRIT_DEFINITIONS[spirit.id].automaticActive &&
      SPIRIT_DEFINITIONS[spirit.id].activeAbilityId === abilityId,
  );
}
