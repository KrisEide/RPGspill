import type { AbilityId } from "../game/types";

export type InitialAbilityRewardDefinition = {
  abilityId: AbilityId;
  icon: string;
};

// Encounters 1 and 2 introduce core Rank 1 abilities to each player.
// Keeping this pool explicit prevents enemy actions and future advanced
// abilities from entering these early reward milestones by accident.
export const INITIAL_ABILITY_REWARD_POOL = [
  { abilityId: "fireball", icon: "🔥" },
  { abilityId: "crashingWave", icon: "🌊" },
  { abilityId: "healingTide", icon: "💧" },
  { abilityId: "stonebloom", icon: "🌿" },
  { abilityId: "whirlwind", icon: "🌪️" },
  { abilityId: "windSlash", icon: "🍃" },
] as const satisfies readonly InitialAbilityRewardDefinition[];
