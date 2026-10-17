import type {
  KnownSpirits,
  SpiritDefinition,
  SpiritId,
  SpiritState,
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
    rankTwoPassive: {
      name: "Bloodpact",
      shortDescription:
        "Sacrifice loses 1 HP; Protected gains 4 Barrier each round.",
      description:
        "At encounter start, choose Sacrifice and Protected. At the start of each round, Sacrifice loses 1 HP, ignoring Barrier, then Protected gains 4 Barrier.",
      roundStartBloodpact: { hpCost: 1, barrierAmount: 4 },
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
    rankTwoPassive: {
      name: "Embertail",
      shortDescription:
        "Your first attack deals bonus Fire damage and applies Burn.",
      description:
        "Your first attack each encounter deals 10 + 30% of Fire Power as additional Spirit Fire damage to one enemy hit and applies Burn.",
      firstDamageActionEachEncounter: {
        basePower: 10,
        damageType: "elemental",
        element: "fire",
        elementalPowerScaling: 0.3,
        statusOnHit: "burn",
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
    rankTwoPassive: {
      name: "Stoneback",
      shortDescription:
        "Your first Barrier gain each encounter grants +10 Barrier.",
      description:
        "The first time you gain Barrier each encounter, gain 10 additional Barrier.",
      firstBarrierGainEachEncounter: { additionalBarrier: 10 },
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
    rankTwoPassive: {
      name: "Swift Wing",
      shortDescription: "35% chance to act first each round.",
      description:
        "At the start of each round, gain a 35% chance to act first regardless of Agility.",
      roundStartTurnPriority: { chance: 0.35, resolutionPriority: 200 },
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
    rankTwoPassive: {
      name: "Riverheart",
      shortDescription: "Both heroes receive +4 healing.",
      description: "All healing received by both heroes is increased by 4.",
      allHealingReceived: { flatIncrease: 4 },
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
      firstAutoAttackDamageMultiplier: 1,
    },
    rankTwoPassive: {
      name: "Warhound",
      shortDescription:
        "Your first Auto Attack is Quick, free, and deals 60% more damage.",
      description:
        "Once per encounter, your first Auto Attack is Quick, resolves immediately, does not consume your action, and deals 60% more damage.",
      firstAutoAttackEachEncounterIsQuick: true,
      firstAutoAttackDamageMultiplier: 1.6,
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
    rankTwoPassive: {
      name: "Guard Dog",
      shortDescription:
        "Non-damaging actions make the Spirit attack for 8 damage.",
      description:
        "Whenever you use a non-damaging action, the Spirit attacks one random enemy for 8 Spirit Physical damage. Bodyguard's first block counters for 12 damage.",
      nonDamagingActionSpiritAttack: {
        basePower: 8,
        damageType: "physical",
      },
      bodyguardCounterDamage: 12,
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
    rankTwoPassive: {
      name: "Ironquill",
      shortDescription:
        "Steel Darts grant +15% to your next damaging ability.",
      description:
        "Whenever you use a Steel Dart, your next damaging ability deals 15% more damage. This stacks for every Steel Dart and is consumed by the ability.",
      steelDartAbilityAmplifier: { damageBonusPerDart: 0.15 },
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
    rankTwoPassive: {
      name: "Warm Embers",
      shortDescription: "Restore 4 HP at the start of each round.",
      description:
        "At the start of each round, restore 4 fixed HP while living. Phoenix Tonics used by this hero revive with 20 additional HP.",
      roundStartHealing: { amount: 4 },
      phoenixTonicReviveBonus: { amount: 20 },
    },
    activeAbilityId: "phoenixRebirth",
    activeUsesPerEncounter: 1,
    automaticActive: true,
  },
};

export function createSpiritState(spiritId: SpiritId, rank: 1 | 2 = 1) {
  const definition = SPIRIT_DEFINITIONS[spiritId];

  return {
    id: spiritId,
    rank,
    activeUsesRemaining: definition.activeUsesPerEncounter,
    passiveTriggeredThisEncounter: false,
    roundPriorityActive: false,
    steelDartAbilityBonusStacks: 0,
    ...(spiritId === "bloodpact" ? { bloodpactRoles: null } : {}),
  };
}

export function getSpiritPassive(spirit: SpiritState) {
  const definition = SPIRIT_DEFINITIONS[spirit.id];
  return spirit.rank === 2 ? definition.rankTwoPassive : definition.passive;
}

export function upgradeKnownSpiritsToRankTwo(
  spirits: KnownSpirits,
): KnownSpirits {
  return Object.fromEntries(
    Object.entries(spirits).map(([id, spirit]) => [
      id,
      spirit ? { ...spirit, rank: 2 as const } : spirit,
    ]),
  );
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
              ...createSpiritState(typedSpiritId, spirit.rank),
              activeUsesRemaining: spirit.activeUsesRemaining,
            }
          : createSpiritState(typedSpiritId, spirit?.rank ?? 1),
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
