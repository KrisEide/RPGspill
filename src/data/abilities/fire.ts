import type { AbilityDefinition } from "../../game/types";

export const FIRE_ABILITY_DEFINITIONS = {
  fireball: {
    id: "fireball",
    name: "Fireball",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        description: "Deal heavy Fire damage to one enemy.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 18,
            attackScaling: 0,
            elementalPowerScaling: 1,
          },
        ],
      },
    },
  },
} satisfies Record<"fireball", AbilityDefinition>;
