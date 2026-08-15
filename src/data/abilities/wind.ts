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
} satisfies Record<"windSlash", AbilityDefinition>;
