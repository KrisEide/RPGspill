import type { AbilityId, RewardTag } from "../game/types";

export type AbilityRewardDefinition = {
  abilityId: AbilityId;
  icon: string;
  tags: readonly RewardTag[];
  availableInOpeningRewards?: boolean;
};

// This explicit pool prevents enemy actions from entering player rewards.
// Advanced abilities can remain in the normal pool while opting out of the
// guaranteed opening choices from Encounters 1 and 2.
export const ABILITY_REWARD_POOL: readonly AbilityRewardDefinition[] = [
  {
    abilityId: "fireball",
    icon: "🔥",
    tags: ["fire", "damage", "single_target", "burn"],
  },
  {
    abilityId: "cinderCurse",
    icon: "🕯️",
    tags: ["fire", "damage_over_time", "debuff", "single_target"],
  },
  {
    abilityId: "searingBrand",
    icon: "🔥",
    tags: ["fire", "burn", "damage_over_time", "single_target"],
  },
  {
    abilityId: "twinFlames",
    icon: "🔥",
    tags: ["fire", "partner", "finisher", "high_cost", "single_target"],
  },
  {
    abilityId: "rootseed",
    icon: "🌱",
    tags: ["earth", "damage_over_time", "delayed", "single_target"],
  },
  {
    abilityId: "earthquake",
    icon: "🌎",
    tags: ["earth", "damage", "aoe", "finisher", "high_cost"],
  },
  {
    abilityId: "stonebreaker",
    icon: "🪨",
    tags: ["earth", "damage", "charge", "debuff", "high_cost"],
  },
  {
    abilityId: "crashingWave",
    icon: "🌊",
    tags: ["water", "damage", "debuff", "single_target"],
  },
  {
    abilityId: "tidalDrain",
    icon: "🌀",
    tags: ["water", "damage", "healing", "single_target"],
  },
  {
    abilityId: "steamBurst",
    icon: "💨",
    tags: ["water", "fire", "burn", "damage", "aoe", "single_target"],
  },
  {
    abilityId: "restoringCurrent",
    icon: "💚",
    tags: ["water", "healing", "charge", "high_cost"],
  },
  { abilityId: "magicBag", icon: "🎒", tags: ["items", "pp"] },
  {
    abilityId: "healingTide",
    icon: "💧",
    tags: ["water", "healing", "cleanse", "partner"],
  },
  {
    abilityId: "stonebloom",
    icon: "🌿",
    tags: ["earth", "healing", "barrier", "cleanse"],
  },
  {
    abilityId: "stoneguard",
    icon: "🛡️",
    tags: ["earth", "barrier", "single_target"],
  },
  {
    abilityId: "fortify",
    icon: "🏰",
    tags: ["earth", "barrier", "aoe", "partner"],
  },
  {
    abilityId: "earthDemon",
    icon: "🗿",
    tags: ["earth", "damage", "defense", "partner", "high_cost"],
    availableInOpeningRewards: false,
  },
  {
    abilityId: "whirlwind",
    icon: "🌪️",
    tags: ["physical", "damage", "aoe", "burn"],
  },
  {
    abilityId: "windSlash",
    icon: "🍃",
    tags: ["wind", "crit", "damage", "single_target"],
  },
  {
    abilityId: "razorGale",
    icon: "🌬️",
    tags: ["wind", "crit", "aoe", "multi_hit"],
  },
  {
    abilityId: "cyclone",
    icon: "🌀",
    tags: ["wind", "crit", "multi_hit", "single_target"],
  },
  {
    abilityId: "backwind",
    icon: "🍃",
    tags: ["wind", "crit", "partner", "same_target", "single_target"],
  },
  {
    abilityId: "lacerate",
    icon: "🩸",
    tags: ["physical", "bleed", "damage_over_time", "single_target"],
  },
  {
    abilityId: "sacrificialStrike",
    icon: "🩸",
    tags: ["physical", "damage", "sacrifice", "low_hp", "single_target"],
    availableInOpeningRewards: false,
  },
];
