import type { AbilityDefinition } from "../../game/types";

export const UTILITY_ABILITY_DEFINITIONS = {
  magicBag: {
    id: "magicBag",
    name: "Magic Bag",
    category: "ability",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Gain one random item.",
        description:
          "Spend your action to gain one random item from the normal item pool.",
        ppCost: 5,
        effects: [
          {
            type: "gainRandomItem",
            pool: "normal",
          },
        ],
      },
      2: {
        shortDescription: "Gain one random item, with a chance for another.",
        description:
          "Spend your action to gain one random item from the normal item pool, with a 30% chance to gain a second random item.",
        newEffectDescription:
          "Magic Bag has a 30% chance to grant a second random item.",
        ppCost: 5,
        effects: [
          {
            type: "gainRandomItem",
            pool: "normal",
            bonusDrawChance: 0.3,
          },
        ],
      },
    },
  },
} satisfies Record<"magicBag", AbilityDefinition>;
