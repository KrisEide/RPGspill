import type { AbilityDefinition } from "../../game/types";

export const SPIRIT_ABILITY_DEFINITIONS = {
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
          "Deal 3 Spirit Fire damage to all enemies and apply Burn.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 3,
            attackScaling: 0,
            elementalPowerScaling: 0,
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
        description: "Grant 13 Barrier to both heroes.",
        ppCost: 0,
        effects: [
          {
            type: "barrier",
            amount: 13,
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
          "Act first this round and deal 20 Spirit Wind damage to one enemy.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 20,
            attackScaling: 0,
            elementalPowerScaling: 0,
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
        description: "Restore 25 HP to one hero.",
        ppCost: 0,
        effects: [
          {
            type: "healing",
            basePower: 25,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
} satisfies Record<
  "cinderburst" | "stoneback" | "swiftWing" | "riverheart",
  AbilityDefinition
>;
