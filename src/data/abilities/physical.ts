import type { AbilityDefinition } from "../../game/types";

export const PHYSICAL_ABILITY_DEFINITIONS = {
  whirlwind: {
    id: "whirlwind",
    name: "Whirlwind",
    category: "ability",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Physical damage to all enemies.",
        description: "Deal physical damage to all enemies.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 5,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
} satisfies Record<"whirlwind", AbilityDefinition>;
