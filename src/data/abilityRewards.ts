import type { AbilityId } from "../game/types";

export type InitialAbilityRewardDefinition = {
  abilityId: AbilityId;
  icon: string;
};

// Encounter 1 introduces one of these core Rank 1 abilities to each player.
// Keeping this pool explicit prevents enemy actions and future advanced
// abilities from entering the opening reward by accident.
export const INITIAL_ABILITY_REWARD_POOL = [
  { abilityId: "fireball", icon: "🔥" },
  { abilityId: "crashingWave", icon: "🌊" },
  { abilityId: "healingTide", icon: "💧" },
  { abilityId: "stonebloom", icon: "🌿" },
  { abilityId: "whirlwind", icon: "🌪️" },
  { abilityId: "windSlash", icon: "🍃" },
] as const satisfies readonly InitialAbilityRewardDefinition[];
