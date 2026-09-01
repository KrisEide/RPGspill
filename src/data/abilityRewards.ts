import type { AbilityId } from "../game/types";

export type AbilityRewardDefinition = {
  abilityId: AbilityId;
  icon: string;
  availableInOpeningRewards?: boolean;
};

// This explicit pool prevents enemy actions from entering player rewards.
// Advanced abilities can remain in the normal pool while opting out of the
// guaranteed opening choices from Encounters 1 and 2.
export const ABILITY_REWARD_POOL: readonly AbilityRewardDefinition[] = [
  { abilityId: "fireball", icon: "🔥" },
  { abilityId: "cinderCurse", icon: "🕯️" },
  { abilityId: "rootseed", icon: "🌱" },
  { abilityId: "earthquake", icon: "🌎" },
  { abilityId: "stonebreaker", icon: "🪨" },
  { abilityId: "crashingWave", icon: "🌊" },
  { abilityId: "tidalDrain", icon: "🌀" },
  { abilityId: "restoringCurrent", icon: "💚" },
  { abilityId: "magicBag", icon: "🎒" },
  { abilityId: "healingTide", icon: "💧" },
  { abilityId: "stonebloom", icon: "🌿" },
  { abilityId: "whirlwind", icon: "🌪️" },
  { abilityId: "windSlash", icon: "🍃" },
  { abilityId: "razorGale", icon: "🌬️" },
  {
    abilityId: "sacrificialStrike",
    icon: "🩸",
    availableInOpeningRewards: false,
  },
];
