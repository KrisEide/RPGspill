import type { AbilityId, GhostUpgradeId } from "../game/types";

export type NewGhostAbilityRewardDefinition = {
  type: "newGhostAbility";
  abilityId: AbilityId;
  icon: string;
};

export type GhostUpgradeRewardDefinition = {
  type: "ghostUpgrade";
  upgradeId: GhostUpgradeId;
  icon: string;
  title: string;
  description: string;
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
  },
  {
    type: "ghostUpgrade",
    upgradeId: "heavyHaunt",
    icon: "👊",
    title: "Heavy Haunt",
    description: "Ghost Strike deals +4 Physical damage (7 → 11).",
  },
  {
    type: "ghostUpgrade",
    upgradeId: "closerToTheVeil",
    icon: "🌘",
    title: "Closer to the Veil",
    description:
      "While below 25 Ghost HP, Ghost Strike and Ghost Bolt deal +50% damage.",
  },
] as const satisfies readonly GhostRewardDefinition[];
