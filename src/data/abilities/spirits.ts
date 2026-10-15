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
          "Deal 6 + 30% of Fire Power as Spirit Fire damage to all enemies and apply Burn.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 6,
            attackScaling: 0,
            elementalPowerScaling: 0.3,
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
          "Grant 12 + 40% of Earth Power as Barrier to both heroes.",
        ppCost: 0,
        effects: [
          {
            type: "barrier",
            amount: 12,
            elementalPowerScaling: 0.4,
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
          "Act first this round and deal 20 + 60% of Wind Power as Spirit Wind damage to one enemy.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 20,
            attackScaling: 0,
            elementalPowerScaling: 0.6,
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
          "Deal 22 + 80% of Attack as Spirit Physical damage to one enemy. Cannot critically hit.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 22,
            attackScaling: 0.8,
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
    target: "allAllies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Both heroes negate the next enemy attack.",
        description:
          "Quick · Priority. Both heroes negate the next enemy attack that would damage them.",
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
  phoenixRebirth: {
    id: "phoenixRebirth",
    name: "Rebirth",
    category: "spirit",
    resolutionPriority: 0,
    target: "self",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Survive one lethal blow with 40 HP and 10 Barrier.",
        description:
          "Automatic · Once per run. When you would die, remain in living form with 40 HP, gain 10 Barrier, and remove ongoing damaging effects.",
        ppCost: 0,
        effects: [],
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
  | "ironquill"
  | "phoenixRebirth",
  AbilityDefinition
>;
