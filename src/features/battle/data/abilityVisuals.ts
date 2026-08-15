import fireballProjectile from "../../../assets/sprites/characters/fireball-projectile.png";
import darkBoltProjectile from "../../../assets/sprites/monsters/dark-bolt-effect.png";
import windSlashEffect from "../../../assets/Effect/windslash.png";
import crashingWaveEffect from "../../../assets/Effect/crashingwave.png";
import cinderburstEffect from "../../../assets/Effect/embertail_cinderburst.png";
import dreadflameEffect from "../../../assets/sprites/monsters/orcwizard_effekt.png";
import type { AbilityId } from "../../../game/types";

export type AbilityVisualDefinition = {
  icon: string;
  animation: "cast" | "melee" | "whirlwind";
  castVariant?: "fire" | "water" | "earth";
  impact?: "fire" | "dark" | "wind" | "water" | "earth";
  timing?: {
    animationDurationMs: number;
    impactDelayMs: number;
    eventDurationMs: number;
  };
  projectile?: {
    spriteSrc: string;
    width: number;
    variant: "fire" | "dark" | "wind";
    rotationOffsetDegrees?: number;
  };
  targetEffect?: {
    spriteSrc: string;
    width: number;
    variant: "water" | "dreadflame";
  };
  battlefieldEffect?: {
    spriteSrc: string;
    width: number;
    variant: "cinderburst";
  };
};

export const ABILITY_VISUALS: Partial<
  Record<AbilityId, AbilityVisualDefinition>
> = {
  fireball: {
    icon: "🔥",
    animation: "cast",
    castVariant: "fire",
    timing: {
      animationDurationMs: 2600,
      impactDelayMs: 1900,
      eventDurationMs: 3400,
    },
    projectile: {
      spriteSrc: fireballProjectile,
      width: 240,
      variant: "fire",
    },
    impact: "fire",
  },
  crashingWave: {
    icon: "🌊",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 3500,
      impactDelayMs: 2150,
      eventDurationMs: 4300,
    },
    targetEffect: {
      spriteSrc: crashingWaveEffect,
      width: 270,
      variant: "water",
    },
    impact: "water",
  },
  healingTide: {
    icon: "💧",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1350,
      eventDurationMs: 3700,
    },
    impact: "water",
  },
  stonebloom: {
    icon: "🌿",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1350,
      eventDurationMs: 3700,
    },
    impact: "earth",
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
      animationDurationMs: 1900,
      impactDelayMs: 1050,
      eventDurationMs: 2600,
    },
    projectile: {
      spriteSrc: windSlashEffect,
      width: 260,
      variant: "wind",
    },
    impact: "wind",
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
  dreadflame: {
    icon: "♠",
    animation: "cast",
    timing: {
      animationDurationMs: 4800,
      impactDelayMs: 3100,
      eventDurationMs: 5600,
    },
    targetEffect: {
      spriteSrc: dreadflameEffect,
      width: 450,
      variant: "dreadflame",
    },
    impact: "dark",
  },
  cinderburst: {
    icon: "🔥",
    animation: "cast",
    castVariant: "fire",
    timing: {
      animationDurationMs: 2600,
      impactDelayMs: 1200,
      eventDurationMs: 3300,
    },
    battlefieldEffect: {
      spriteSrc: cinderburstEffect,
      width: 520,
      variant: "cinderburst",
    },
    impact: "fire",
  },
};
