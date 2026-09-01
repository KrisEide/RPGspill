import type { AbilityDefinition } from "../../game/types";

export const WIND_ABILITY_DEFINITIONS = {
  windSlash: {
    id: "windSlash",
    name: "Wind Slash",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Wind damage that can critically hit.",
        description:
          "Slash one enemy with wind. This ability can critically hit.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 12,
            attackScaling: 0.4,
            elementalPowerScaling: 0.3,
            criticalHit: {
              chance: 0.1,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
      2: {
        shortDescription: "Critical hits also Expose the enemy.",
        description:
          "Slash one enemy with wind. Critical hits Expose the target for your partner.",
        newEffectDescription:
          "Critical hits apply Exposed. Your partner's next attack against that target deals 25% more damage.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 14,
            attackScaling: 0.4,
            elementalPowerScaling: 0.3,
            criticalHit: {
              chance: 0.1,
              damageMultiplier: 1.5,
            },
            statusOnCriticalHit: "exposed",
          },
        ],
      },
    },
  },
  razorGale: {
    id: "razorGale",
    name: "Razor Gale",
    category: "ability",
    resolutionPriority: 0,
    target: "allEnemies",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Wind damage to all enemies. Can critically hit.",
        description:
          "Strike all enemies for 7 + 40% of Wind Power as Wind damage. Each target can be critically hit independently.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
      2: {
        shortDescription:
          "Strike all enemies twice. Every hit can critically hit.",
        description:
          "Strike all enemies twice for 7 + 40% of Wind Power as Wind damage per hit. Every hit rolls damage variance and critical chance independently.",
        newEffectDescription:
          "Razor Gale now strikes twice. Each hit can critically hit independently.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
    },
  },
} satisfies Record<"windSlash" | "razorGale", AbilityDefinition>;
