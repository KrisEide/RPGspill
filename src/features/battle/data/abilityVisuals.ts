import fireballProjectile from "../../../assets/sprites/characters/fireball-projectile.png";
import darkBoltProjectile from "../../../assets/sprites/monsters/dark-bolt-effect.png";
import windSlashEffect from "../../../assets/Effect/windslash.png";
import crashingWaveEffect from "../../../assets/Effect/crashingwave.png";
import cinderburstEffect from "../../../assets/Effect/embertail_cinderburst.png";
import stonebackEffect from "../../../assets/Effect/stoneback.png";
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
    damageNumberDurationMs?: number;
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
    variant: "cinderburst" | "stoneback";
    position?: {
      left: string;
      top: string;
    };
  };
};

export const ABILITY_VISUALS: Partial<
  Record<AbilityId, AbilityVisualDefinition>
> = {
  ghostStrike: {
    icon: "👻",
    animation: "melee",
    timing: {
      animationDurationMs: 1800,
      impactDelayMs: 900,
      eventDurationMs: 2400,
    },
    impact: "dark",
  },
  ghostBolt: {
    icon: "🔮",
    animation: "cast",
    timing: {
      animationDurationMs: 2200,
      impactDelayMs: 1300,
      eventDurationMs: 2900,
    },
    impact: "dark",
  },
  ghostHeal: {
    icon: "💠",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 2200,
      impactDelayMs: 1100,
      eventDurationMs: 2800,
    },
    impact: "water",
  },
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
  gatherDreadflame: {
    icon: "♠",
    animation: "cast",
    timing: {
      animationDurationMs: 3600,
      impactDelayMs: 1300,
      eventDurationMs: 4200,
    },
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
  mendWounds: {
    icon: "✚",
    animation: "cast",
    timing: {
      animationDurationMs: 3600,
      impactDelayMs: 1700,
      eventDurationMs: 4300,
    },
    impact: "earth",
  },
  guardRally: {
    icon: "📣",
    animation: "cast",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1500,
      eventDurationMs: 3700,
    },
    impact: "earth",
  },
  guardShieldCharge: {
    icon: "🛡️",
    animation: "melee",
    timing: {
      animationDurationMs: 2500,
      impactDelayMs: 1300,
      eventDurationMs: 3200,
    },
  },
  gorakAutoAttack: {
    icon: "⚔️",
    animation: "melee",
    timing: {
      animationDurationMs: 2500,
      impactDelayMs: 1250,
      eventDurationMs: 3100,
    },
  },
  shieldCharge: {
    icon: "🛡️",
    animation: "melee",
    timing: {
      animationDurationMs: 2600,
      impactDelayMs: 1200,
      eventDurationMs: 3300,
    },
  },
  wakeUp: {
    icon: "📣",
    animation: "melee",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1800,
      eventDurationMs: 3600,
    },
  },
  bloodCleave: {
    icon: "🩸",
    animation: "melee",
    timing: {
      animationDurationMs: 3700,
      impactDelayMs: 1900,
      eventDurationMs: 4400,
      damageNumberDurationMs: 1500,
    },
  },
  smash: {
    icon: "💥",
    animation: "melee",
    timing: {
      animationDurationMs: 2900,
      impactDelayMs: 1550,
      eventDurationMs: 3500,
    },
  },
  catchBreath: {
    icon: "💨",
    animation: "melee",
    timing: {
      animationDurationMs: 4000,
      impactDelayMs: 900,
      eventDurationMs: 4600,
    },
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
  stoneback: {
    icon: "🪨",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 4800,
      impactDelayMs: 1600,
      eventDurationMs: 5600,
    },
    battlefieldEffect: {
      spriteSrc: stonebackEffect,
      width: 720,
      variant: "stoneback",
      position: {
        left: "500px",
        top: "calc(100% - var(--hud-height) - 185px)",
      },
    },
    impact: "earth",
  },
  swiftWing: {
    icon: "🪽",
    animation: "melee",
    timing: {
      animationDurationMs: 1800,
      impactDelayMs: 950,
      eventDurationMs: 2400,
    },
    projectile: {
      spriteSrc: windSlashEffect,
      width: 230,
      variant: "wind",
    },
    impact: "wind",
  },
  riverheart: {
    icon: "💧",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 2600,
      impactDelayMs: 1150,
      eventDurationMs: 3200,
    },
    impact: "water",
  },
};
