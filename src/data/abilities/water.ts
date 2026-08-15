import type { AbilityDefinition } from "../../game/types";

export const WATER_ABILITY_DEFINITIONS = {
  crashingWave: {
    id: "crashingWave",
    name: "Crashing Wave",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Water damage and weaken one enemy.",
        description:
          "Strike one enemy with water and reduce the damage of its next attack by 20%.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 11,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            statusOnHit: {
              statusId: "weakened",
              magnitude: 0.2,
            },
          },
        ],
      },
      2: {
        shortDescription: "Stronger Water damage and weakening.",
        description:
          "Strike one enemy with water and reduce the damage of its next attack by 25%.",
        newEffectDescription:
          "Base Power increases to 13 and Weakened reduces the target's next attack by 25%.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 13,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            statusOnHit: {
              statusId: "weakened",
              magnitude: 0.25,
            },
          },
        ],
      },
    },
  },
  healingTide: {
    id: "healingTide",
    name: "Healing Tide",
    category: "ability",
    resolutionPriority: 0,
    target: "singleAlly",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Restore HP to yourself or your partner.",
        description:
          "Restore 9 + 50% of Water Power as HP to yourself or your partner.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 9,
            elementalPowerScaling: 0.5,
          },
        ],
      },
      2: {
        shortDescription: "Restore more HP and remove Burn.",
        description:
          "Restore 12 + 50% of Water Power as HP and remove Burn from yourself or your partner.",
        newEffectDescription:
          "Base Heal increases to 12 and Healing Tide removes Burn.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 12,
            elementalPowerScaling: 0.5,
          },
          {
            type: "cleanse",
            statusId: "burn",
          },
        ],
      },
    },
  },
} satisfies Record<"crashingWave" | "healingTide", AbilityDefinition>;
