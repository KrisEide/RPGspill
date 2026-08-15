import type { AbilityDefinition } from "../../game/types";

export const SPIRIT_ABILITY_DEFINITIONS = {
  cinderburst: {
    id: "cinderburst",
    name: "Cinderburst",
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
            usesDamageVariance: false,
            statusOnHit: {
              statusId: "burn",
            },
          },
        ],
      },
    },
  },
} satisfies Record<"cinderburst", AbilityDefinition>;
