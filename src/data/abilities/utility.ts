import type { AbilityDefinition } from "../../game/types";

export const UTILITY_ABILITY_DEFINITIONS = {
  magicBag: {
    id: "magicBag",
    name: "Magic Bag",
    category: "ability",
    resolutionPriority: 0,
    useTiming: "quickAction",
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Quick. Gain one random item.",
        description:
          "Quick. Once per round, gain one random item from the normal item pool.",
        ppCost: 7,
        effects: [
          {
            type: "gainRandomItem",
            pool: "normal",
          },
        ],
      },
      2: {
        shortDescription: "Quick. Gain two random items.",
        description:
          "Quick. Once per round, gain two random items from the normal item pool.",
        newEffectDescription:
          "Magic Bag now grants two random items.",
        ppCost: 7,
        effects: [
          {
            type: "gainRandomItem",
            pool: "normal",
            drawCount: 2,
          },
        ],
      },
    },
  },
} satisfies Record<"magicBag", AbilityDefinition>;
