import type {
  AbilityId,
  GhostUpgradeId,
  RewardTag,
} from "../game/types";

export type NewGhostAbilityRewardDefinition = {
  type: "newGhostAbility";
  abilityId: AbilityId;
  icon: string;
  tags: readonly RewardTag[];
};

export type GhostUpgradeRewardDefinition = {
  type: "ghostUpgrade";
  upgradeId: GhostUpgradeId;
  icon: string;
  title: string;
  description: string;
  tags: readonly RewardTag[];
};

export type GhostRewardDefinition =
  | NewGhostAbilityRewardDefinition
  | GhostUpgradeRewardDefinition;

// Ghost rewards live in their own pool. They never enter normal Living reward
// generation unless that is explicitly enabled in the future.
export const GHOST_REWARD_POOL = [
  {
    type: "newGhostAbility",
    abilityId: "possession",
    icon: "🫴",
    tags: ["ghost", "debuff", "partner"],
  },
  {
    type: "ghostUpgrade",
    upgradeId: "heavyHaunt",
    icon: "👊",
    title: "Heavy Haunt",
    description: "Ghost Strike deals +4 Physical damage (7 → 11).",
    tags: ["ghost", "physical", "damage"],
  },
  {
    type: "ghostUpgrade",
    upgradeId: "closerToTheVeil",
    icon: "🌘",
    title: "Closer to the Veil",
    description:
      "While below 25 Ghost HP, Ghost Strike and Ghost Bolt deal +50% damage.",
    tags: ["ghost", "low_hp", "damage"],
  },
] as const satisfies readonly GhostRewardDefinition[];
