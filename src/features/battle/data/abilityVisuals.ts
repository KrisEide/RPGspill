import fireballProjectile from "../../../assets/sprites/characters/fireball-projectile.png";
import darkBoltProjectile from "../../../assets/sprites/monsters/dark-bolt-effect.png";
import type { AbilityId } from "../../../game/types";

export type AbilityVisualDefinition = {
  icon: string;
  animation: "cast" | "melee" | "whirlwind";
  impact?: "fire" | "dark";
  timing?: {
    animationDurationMs: number;
    impactDelayMs: number;
    eventDurationMs: number;
  };
  projectile?: {
    spriteSrc: string;
    width: number;
    variant: "fire" | "dark";
    rotationOffsetDegrees?: number;
  };
};

export const ABILITY_VISUALS: Partial<
  Record<AbilityId, AbilityVisualDefinition>
> = {
  fireball: {
    icon: "🔥",
    animation: "cast",
    timing: {
      animationDurationMs: 2100,
      impactDelayMs: 1200,
      eventDurationMs: 2900,
    },
    projectile: {
      spriteSrc: fireballProjectile,
      width: 240,
      variant: "fire",
    },
    impact: "fire",
  },
  whirlwind: {
    icon: "🌪️",
    animation: "whirlwind",
    timing: {
      animationDurationMs: 2200,
      impactDelayMs: 1200,
      eventDurationMs: 2900,
    },
  },
  windSlash: {
    icon: "🍃",
    animation: "melee",
    timing: {
      animationDurationMs: 1500,
      impactDelayMs: 650,
      eventDurationMs: 2200,
    },
  },
  darkBolt: {
    icon: "◆",
    animation: "cast",
    timing: {
      animationDurationMs: 3300,
      impactDelayMs: 2300,
      eventDurationMs: 4200,
    },
    projectile: {
      spriteSrc: darkBoltProjectile,
      width: 190,
      variant: "dark",
      rotationOffsetDegrees: -180,
    },
    impact: "dark",
  },
};
