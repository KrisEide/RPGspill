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
      2: {
        shortDescription: "Stronger physical damage that can spread Burn.",
        description:
          "Deal physical damage to all enemies. If an enemy is Burning, spread Burn to one additional enemy.",
        newEffectDescription:
          "Base Power increases to 6. If at least one enemy is Burning, Whirlwind spreads Burn to one random living enemy that is not already Burning.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 6,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
            spreadStatus: {
              statusId: "burn",
              maxAdditionalTargets: 1,
            },
          },
        ],
      },
    },
  },
} satisfies Record<"whirlwind", AbilityDefinition>;
