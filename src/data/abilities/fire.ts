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
        shortDescription: "Heavy Fire damage to one enemy.",
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
      2: {
        shortDescription: "Heavy Fire damage that applies Burn.",
        description:
          "Deal heavy Fire damage to one enemy and apply Burn for 2 rounds.",
        newEffectDescription:
          "Fireball applies Burn. Burn deals 3 Fire damage at the end of the round for 2 rounds and does not stack.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 18,
            attackScaling: 0,
            elementalPowerScaling: 1,
            statusOnHit: {
              statusId: "burn",
            },
          },
        ],
      },
    },
  },
} satisfies Record<"fireball", AbilityDefinition>;
