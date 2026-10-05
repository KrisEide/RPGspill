import type { AbilityDefinition } from "../../game/types";

export const SPIRIT_ABILITY_DEFINITIONS = {
  bloodpact: {
    id: "bloodpact",
    name: "Bloodpact",
    category: "spirit",
    resolutionPriority: 0,
    useTiming: "action",
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Sacrifice loses 10 HP. Protected gains 30 Barrier.",
        description:
          "0 PP · Once per encounter · Uses Action. The locked Sacrifice loses 10 HP, ignoring Barrier, then the locked Protected gains 30 Barrier. HP loss can cause Ghost Form. Requires both heroes to be living.",
        ppCost: 0,
        effects: [{ type: "bloodpact", hpCost: 10, barrierAmount: 30 }],
      },
    },
  },
  cinderburst: {
    id: "cinderburst",
    name: "Embertail",
    category: "spirit",
    resolutionPriority: 0,
    target: "allEnemies",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Damage and Burn all enemies.",
        description:
          "Deal 1 + 20% of Fire Power as Spirit Fire damage to all enemies and apply Burn.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 1,
            attackScaling: 0,
            elementalPowerScaling: 0.2,
            statusOnHit: {
              statusId: "burn",
            },
          },
        ],
      },
    },
  },
  stoneback: {
    id: "stoneback",
    name: "Stoneback",
    category: "spirit",
    resolutionPriority: 0,
    target: "allAllies",
    element: "earth",
    ranks: {
      1: {
        shortDescription: "Grant Barrier to both heroes.",
        description:
          "Grant 10 + 30% of Earth Power as Barrier to both heroes.",
        ppCost: 0,
        effects: [
          {
            type: "barrier",
            amount: 10,
            elementalPowerScaling: 0.3,
          },
        ],
      },
    },
  },
  swiftWing: {
    id: "swiftWing",
    name: "Swift Wing",
    category: "spirit",
    resolutionPriority: 300,
    target: "singleEnemy",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Act first and damage one enemy.",
        description:
          "Act first this round and deal 16 + 40% of Wind Power as Spirit Wind damage to one enemy.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 16,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
          },
        ],
      },
    },
  },
  riverheart: {
    id: "riverheart",
    name: "Riverheart",
    category: "spirit",
    resolutionPriority: 0,
    target: "singleAlly",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Restore HP to one hero.",
        description:
          "Restore 20 + 50% of Water Power as HP to one hero.",
        ppCost: 0,
        effects: [
          {
            type: "healing",
            basePower: 20,
            elementalPowerScaling: 0.5,
          },
        ],
      },
    },
  },
  warhound: {
    id: "warhound",
    name: "Warhound",
    category: "spirit",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Deal heavy Spirit Physical damage.",
        description:
          "Deal 16 + 60% of Attack as Spirit Physical damage to one enemy. Cannot critically hit.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 16,
            attackScaling: 0.6,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  bodyguard: {
    id: "bodyguard",
    name: "Bodyguard",
    category: "spirit",
    resolutionPriority: 1000,
    useTiming: "quickAction",
    target: "singleAlly",
    element: null,
    ranks: {
      1: {
        shortDescription: "Negate the next enemy attack.",
        description:
          "Quick · Priority. Choose yourself or your ally. The next enemy attack that would damage them deals 0 damage instead.",
        ppCost: 0,
        effects: [
          {
            type: "applyStatus",
            statusId: "bodyguard",
            tickBasePower: 0,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  ironquill: {
    id: "ironquill",
    name: "Ironquill",
    category: "spirit",
    resolutionPriority: 0,
    useTiming: "quickAction",
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Throw three spectral Steel Darts.",
        description:
          "Quick. Throw 3 spectral Steel Darts at one enemy. Each deals normal Steel Dart damage and grants one Ironquill stack. Does not consume items.",
        ppCost: 0,
        effects: [
          {
            type: "countAsItemUse",
            itemId: "steelDart",
            count: 3,
          },
          ...Array.from({ length: 3 }, () => ({
            type: "damage" as const,
            damageType: "physical" as const,
            basePower: 5,
            attackScaling: 0,
            elementalPowerScaling: 0,
            usesDamageVariance: false,
          })),
        ],
      },
    },
  },
} satisfies Record<
  | "cinderburst"
  | "stoneback"
  | "swiftWing"
  | "riverheart"
  | "warhound"
  | "bodyguard"
  | "bloodpact"
  | "ironquill",
  AbilityDefinition
>;
