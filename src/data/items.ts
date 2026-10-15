import type {
  CharacterState,
  ItemDefinition,
  ItemId,
} from "../game/types";

const items = [
  {
    id: "healingPotion",
    name: "Healing Potion",
    menuName: "Potion",
    icon: "🧪",
    shortDescription: "Restore 20 HP.",
    description: "Restore 20 HP to one living hero.",
    tags: ["items", "healing", "hp", "partner"],
    rarity: "common",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "singleAlly",
    effects: [{ type: "restoreHp", amount: 20 }],
  },
  {
    id: "elixir",
    name: "Elixir",
    menuName: "Elixir",
    icon: "💧",
    shortDescription: "Restore 20 PP.",
    description: "Restore 20 PP to one living hero.",
    tags: ["items", "pp", "partner"],
    rarity: "common",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "singleAlly",
    effects: [{ type: "restorePp", amount: 20 }],
  },
  {
    id: "throwingKnife",
    name: "Throwing Knife",
    menuName: "Knife",
    icon: "🗡️",
    shortDescription: "Deal 30 raw Physical damage.",
    description:
      "Deal 30 raw Physical damage to one enemy. Does not scale or critically hit.",
    tags: ["items", "physical", "damage", "single_target"],
    rarity: "common",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "singleEnemy",
    effects: [
      {
        type: "damage",
        amount: 30,
        damageType: "physical",
        element: null,
        usesDamageVariance: true,
        canCrit: false,
      },
    ],
  },
  {
    id: "blastBomb",
    name: "Blast Bomb",
    menuName: "Blast",
    icon: "💣",
    shortDescription: "Deal 20 raw Magical damage to all enemies.",
    description:
      "Deal 20 raw Magical damage to all enemies. Does not scale or critically hit.",
    tags: ["items", "magical", "damage", "aoe"],
    rarity: "uncommon",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "allEnemies",
    effects: [
      {
        type: "damage",
        amount: 20,
        damageType: "magical",
        element: null,
        usesDamageVariance: true,
        canCrit: false,
      },
    ],
  },
  {
    id: "razorBomb",
    name: "Razor Bomb",
    menuName: "Razor",
    icon: "🧨",
    shortDescription: "Damage all enemies and apply Bleed.",
    description:
      "Deal 9 raw Physical damage to all enemies and apply Bleed for 3 rounds.",
    tags: ["items", "physical", "damage", "aoe", "bleed"],
    rarity: "uncommon",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "allEnemies",
    effects: [
      {
        type: "damage",
        amount: 9,
        damageType: "physical",
        element: null,
        usesDamageVariance: true,
        canCrit: false,
      },
      {
        type: "applyStatus",
        statusId: "bleed",
        durationRounds: 3,
      },
    ],
  },
  {
    id: "barrierFlask",
    name: "Barrier Flask",
    menuName: "Barrier",
    icon: "🛡️",
    shortDescription: "Grant 10 Barrier to both heroes.",
    description: "Grant 10 Barrier to both living heroes.",
    tags: ["items", "barrier", "partner", "aoe"],
    rarity: "uncommon",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "allAllies",
    effects: [{ type: "grantBarrier", amount: 10 }],
  },
  {
    id: "powerTonic",
    name: "Power Tonic",
    menuName: "Power",
    icon: "💪",
    shortDescription: "Your next damaging ability deals 25% more damage.",
    description:
      "Your next damaging ability this round deals 25% more damage. Multiple uses add together.",
    tags: ["items", "damage", "quick"],
    rarity: "uncommon",
    useTiming: "quickAction",
    resolutionTiming: "preRound",
    target: "self",
    effects: [{ type: "nextDamagingAbilityBonus", amount: 0.25 }],
  },
  {
    id: "cleansingTonic",
    name: "Cleansing Tonic",
    menuName: "Cleanse",
    icon: "✨",
    shortDescription: "Remove all negative statuses from yourself.",
    description: "Remove all negative status effects from yourself.",
    tags: ["items", "cleanse", "quick"],
    rarity: "uncommon",
    useTiming: "quickAction",
    resolutionTiming: "turn",
    target: "self",
    effects: [{ type: "cleanse", statusIds: "all" }],
  },
  {
    id: "steelDart",
    name: "Steel Dart",
    menuName: "Steel",
    icon: "📍",
    shortDescription: "Immediately deal 5 raw Physical damage.",
    description:
      "Before the round starts, deal 5 raw Physical damage to one enemy.",
    tags: ["items", "physical", "damage", "quick", "single_target"],
    rarity: "common",
    useTiming: "quickAction",
    resolutionTiming: "preRound",
    target: "singleEnemy",
    effects: [
      {
        type: "damage",
        amount: 5,
        damageType: "physical",
        element: null,
        usesDamageVariance: true,
        canCrit: false,
      },
    ],
  },
  {
    id: "fuseDart",
    name: "Fuse Dart",
    menuName: "Fuse",
    icon: "🧷",
    shortDescription: "Deal 9 raw Physical damage at round end.",
    description:
      "At the end of the round, deal 9 raw Physical damage to one enemy.",
    tags: ["items", "physical", "damage", "quick", "delayed", "single_target"],
    rarity: "uncommon",
    useTiming: "quickAction",
    resolutionTiming: "endOfRound",
    target: "singleEnemy",
    effects: [
      {
        type: "damage",
        amount: 9,
        damageType: "physical",
        element: null,
        usesDamageVariance: true,
        canCrit: false,
      },
    ],
  },
  {
    id: "mysteriousPotion",
    name: "Mysterious Potion",
    menuName: "Mysterious Potion",
    icon: "❔",
    shortDescription: "Its effect is unknown.",
    description: "Its effect is unknown.",
    tags: ["items", "ghost", "healing", "barrier", "sacrifice", "quick"],
    rarity: "rare",
    rewardWeight: 2,
    useTiming: "action",
    resolutionTiming: "turn",
    target: "self",
    effects: [{ type: "directHpLoss", amount: 5 }],
    ghostUse: {
      useTiming: "quickAction",
      resolutionTiming: "preRound",
      effects: [
        { type: "restoreGhostHp", amount: 10 },
        { type: "grantBarrier", amount: 10 },
      ],
    },
  },
  {
    id: "phoenixTonic",
    name: "Phoenix Tonic",
    menuName: "Phoenix",
    icon: "🔥",
    shortDescription: "Revive a fallen ally with 30 HP.",
    description: "Revive one fallen ally with 30 HP.",
    tags: ["items", "revive", "healing", "partner"],
    rarity: "rare",
    useTiming: "action",
    resolutionTiming: "turn",
    target: "singleFallenAlly",
    effects: [{ type: "revive", hp: 30 }],
  },
] as const satisfies readonly ItemDefinition[];

export const ITEM_DEFINITIONS: Readonly<Record<ItemId, ItemDefinition>> =
  Object.fromEntries(items.map((item) => [item.id, item]));

export function getItemUseProfile(
  definition: ItemDefinition,
  form: CharacterState["form"],
) {
  if (form === "living") {
    return {
      useTiming: definition.useTiming,
      resolutionTiming: definition.resolutionTiming,
      effects: definition.effects,
    };
  }

  return form === "ghost" ? definition.ghostUse ?? null : null;
}

// Each character receives an independent copy of this pool for a run.
export const ITEM_REWARD_POOL: readonly ItemId[] =
  Object.keys(ITEM_DEFINITIONS);
