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
  cinderCurse: {
    id: "cinderCurse",
    name: "Cinder Curse",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Curse one enemy with lasting Fire damage.",
        description:
          "Curse one enemy. At the end of each round, it takes 8 + 20% of your Fire Power as Fire damage until it dies or combat ends.",
        ppCost: 8,
        effects: [
          {
            type: "applyStatus",
            statusId: "cinderCurse",
            tickBasePower: 8,
            elementalPowerScaling: 0.2,
          },
        ],
      },
      2: {
        shortDescription: "A stronger curse that reduces healing.",
        description:
          "Curse one enemy. At the end of each round, it takes 10 + 20% of your Fire Power as Fire damage. While cursed, it receives 50% less healing.",
        newEffectDescription:
          "Cinder Curse deals 10 base Fire damage per round and reduces healing received by 50%. Multiple Curses do not stack the healing reduction.",
        ppCost: 8,
        effects: [
          {
            type: "applyStatus",
            statusId: "cinderCurse",
            tickBasePower: 10,
            elementalPowerScaling: 0.2,
            healingReceivedMultiplier: 0.5,
          },
        ],
      },
    },
  },
} satisfies Record<"fireball" | "cinderCurse", AbilityDefinition>;
