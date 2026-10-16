import fireballProjectile from "../../../assets/sprites/characters/fireball-projectile.png";
import darkBoltProjectile from "../../../assets/sprites/monsters/orcs/dark-bolt-effect.png";
import windSlashEffect from "../../../assets/Effect/windslash.png";
import crashingWaveEffect from "../../../assets/Effect/crashingwave.png";
import cinderburstEffect from "../../../assets/Effect/embertail_cinderburst.png";
import stonebackEffect from "../../../assets/Effect/stoneback.png";
import cinderCurseEffect from "../../../assets/Effect/cindercurse.png";
import cinderCurseTickEffect from "../../../assets/Effect/cindercurse_tick.png";
import rootseedEffect from "../../../assets/Effect/rootseed.png";
import leafDrainEffect from "../../../assets/Effect/leafdrain.png";
import twinFlamesEffect from "../../../assets/Effect/twinflames.png";
import earthSpellEffect from "../../../assets/Effect/earthspell.png";
import razorGaleEffect from "../../../assets/Effect/razorgale.png";
import cycloneEffect from "../../../assets/Effect/cyclone.png";
import lacerateEffect from "../../../assets/Effect/lacerate.png";
import healEffect from "../../../assets/Effect/healeffekt.png";
import warhoundEffect from "../../../assets/Effect/warhound.png";
import steelDartEffect from "../../../assets/icons/steeldart.png";
import dreadflameEffect from "../../../assets/sprites/monsters/orcs/orcwizard_effekt.png";
import type { AbilityId } from "../../../game/types";

export type AbilityVisualDefinition = {
  icon: string;
  animation: "cast" | "melee" | "whirlwind";
  castVariant?: "fire" | "water" | "earth";
  impact?: "fire" | "dark" | "wind" | "water" | "earth" | "bleed";
  timing?: {
    animationDurationMs: number;
    impactDelayMs: number;
    eventDurationMs: number;
    damageNumberDurationMs?: number;
  };
  projectile?: {
    spriteSrc: string;
    width: number;
    variant: "fire" | "dark" | "wind" | "backwind" | "steelDart";
    rotationOffsetDegrees?: number;
  };
  targetEffect?: {
    spriteSrc: string;
    width: number;
    startsOnImpact?: boolean;
    variant:
      | "water"
      | "tidalDrain"
      | "dreadflame"
      | "cinderCurse"
      | "cinderCurseTick"
      | "rootseed"
      | "leafDrain"
      | "searingBrand"
      | "twinFlames"
      | "twinFlamesWater"
      | "twinFlamesEarth"
      | "twinFlamesWind"
      | "twinFlamesGhost"
      | "cycloneHit1"
      | "cycloneHit2"
      | "cycloneHit3"
      | "lacerate"
      | "stonebreaker"
      | "warhound";
    durationMs?: number;
  };
  supportEffect?: {
    spriteSrc: string;
    width: number;
    variant: "restoringCurrentHeal";
    durationMs?: number;
  };
  statusTickEffect?: {
    spriteSrc: string;
    width: number;
    variant: "cinderCurseTick" | "leafDrain";
    durationMs?: number;
  };
  battlefieldEffect?: {
    spriteSrc: string;
    width: number;
    variant: "cinderburst" | "stoneback" | "earthquake" | "razorGale";
    position?: {
      left: string;
      top: string;
    };
  };
};

export const ABILITY_VISUALS: Partial<
  Record<AbilityId, AbilityVisualDefinition>
> = {
  sacrificialStrike: {
    icon: "🩸",
    animation: "melee",
    timing: {
      animationDurationMs: 2100,
      impactDelayMs: 1100,
      eventDurationMs: 2800,
      damageNumberDurationMs: 1500,
    },
  },
  lacerate: {
    icon: "🩸",
    animation: "melee",
    timing: {
      animationDurationMs: 2100,
      impactDelayMs: 1100,
      eventDurationMs: 2800,
      damageNumberDurationMs: 1500,
    },
    targetEffect: {
      spriteSrc: lacerateEffect,
      width: 360,
      variant: "lacerate",
      startsOnImpact: true,
      durationMs: 900,
    },
    impact: "bleed",
  },
  orcGruntMultiAttack: {
    icon: "💢",
    animation: "melee",
    timing: {
      animationDurationMs: 3300,
      impactDelayMs: 1900,
      eventDurationMs: 4000,
      damageNumberDurationMs: 2200,
    },
  },
  prepareSweep: {
    icon: "⚔",
    animation: "melee",
    timing: {
      animationDurationMs: 2800,
      impactDelayMs: 1500,
      eventDurationMs: 3300,
    },
  },
  greenSlimeStrongAttack: {
    icon: "💥",
    animation: "melee",
    timing: {
      animationDurationMs: 2500,
      impactDelayMs: 1250,
      eventDurationMs: 3100,
      damageNumberDurationMs: 1500,
    },
  },
  greenSlimeBuff: {
    icon: "💪",
    animation: "cast",
    timing: {
      animationDurationMs: 3200,
      impactDelayMs: 1500,
      eventDurationMs: 3800,
    },
  },
  blueSlimePoisonAttack: {
    icon: "☠️",
    animation: "cast",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1500,
      eventDurationMs: 3700,
      damageNumberDurationMs: 1700,
    },
    impact: "dark",
  },
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
  possession: {
    icon: "🫴",
    animation: "cast",
    timing: {
      animationDurationMs: 2200,
      impactDelayMs: 1200,
      eventDurationMs: 2900,
    },
    impact: "dark",
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
  cinderCurse: {
    icon: "🕯️",
    animation: "cast",
    castVariant: "fire",
    timing: {
      animationDurationMs: 3800,
      impactDelayMs: 2200,
      eventDurationMs: 4600,
      damageNumberDurationMs: 1300,
    },
    targetEffect: {
      spriteSrc: cinderCurseEffect,
      width: 300,
      variant: "cinderCurse",
    },
    statusTickEffect: {
      spriteSrc: cinderCurseTickEffect,
      width: 115,
      variant: "cinderCurseTick",
    },
    impact: "fire",
  },
  searingBrand: {
    icon: "🔥",
    animation: "cast",
    castVariant: "fire",
    timing: {
      animationDurationMs: 4300,
      impactDelayMs: 2400,
      eventDurationMs: 5200,
      damageNumberDurationMs: 1800,
    },
    targetEffect: {
      spriteSrc: cinderCurseEffect,
      width: 210,
      variant: "searingBrand",
      durationMs: 4100,
    },
    impact: "fire",
  },
  twinFlames: {
    icon: "🔥",
    animation: "cast",
    castVariant: "fire",
    timing: {
      animationDurationMs: 4400,
      impactDelayMs: 2500,
      eventDurationMs: 5400,
      damageNumberDurationMs: 1800,
    },
    targetEffect: {
      spriteSrc: twinFlamesEffect,
      width: 330,
      variant: "twinFlames",
      durationMs: 4200,
    },
    impact: "fire",
  },
  rootseed: {
    icon: "🌱",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1500,
      eventDurationMs: 4200,
      damageNumberDurationMs: 1500,
    },
    targetEffect: {
      spriteSrc: rootseedEffect,
      width: 210,
      variant: "rootseed",
      startsOnImpact: true,
      durationMs: 2400,
    },
    statusTickEffect: {
      spriteSrc: leafDrainEffect,
      width: 250,
      variant: "leafDrain",
      durationMs: 2200,
    },
    impact: "earth",
  },
  earthquake: {
    icon: "🌎",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3900,
      impactDelayMs: 2200,
      eventDurationMs: 4500,
      damageNumberDurationMs: 1900,
    },
    battlefieldEffect: {
      spriteSrc: earthSpellEffect,
      width: 800,
      variant: "earthquake",
    },
    impact: "earth",
  },
  stonebreaker: {
    icon: "🪨",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 2700,
      impactDelayMs: 1650,
      eventDurationMs: 3500,
      damageNumberDurationMs: 1800,
    },
    targetEffect: {
      spriteSrc: earthSpellEffect,
      width: 280,
      variant: "stonebreaker",
      durationMs: 2100,
    },
    impact: "earth",
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
  tidalDrain: {
    icon: "🌀",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 3400,
      impactDelayMs: 2050,
      eventDurationMs: 4200,
      damageNumberDurationMs: 1400,
    },
    targetEffect: {
      spriteSrc: crashingWaveEffect,
      width: 220,
      variant: "tidalDrain",
    },
    impact: "water",
  },
  restoringCurrent: {
    icon: "💚",
    animation: "cast",
    castVariant: "water",
    timing: {
      animationDurationMs: 3600,
      impactDelayMs: 1750,
      eventDurationMs: 4200,
    },
    supportEffect: {
      spriteSrc: healEffect,
      width: 240,
      variant: "restoringCurrentHeal",
      durationMs: 3600,
    },
    impact: "water",
  },
  magicBag: {
    icon: "🎒",
    animation: "cast",
    timing: {
      animationDurationMs: 5200,
      impactDelayMs: 2400,
      eventDurationMs: 6100,
    },
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
  stoneguard: {
    icon: "🛡️",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1350,
      eventDurationMs: 3700,
    },
    impact: "earth",
  },
  fortify: {
    icon: "🏰",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3000,
      impactDelayMs: 1350,
      eventDurationMs: 3700,
    },
    impact: "earth",
  },
  earthDemon: {
    icon: "🗿",
    animation: "cast",
    castVariant: "earth",
    timing: {
      animationDurationMs: 3200,
      impactDelayMs: 1600,
      eventDurationMs: 3900,
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
  backwind: {
    icon: "🍃",
    animation: "melee",
    timing: {
      animationDurationMs: 2200,
      impactDelayMs: 1200,
      eventDurationMs: 2900,
      damageNumberDurationMs: 1300,
    },
    projectile: {
      spriteSrc: windSlashEffect,
      width: 285,
      variant: "backwind",
    },
    impact: "wind",
  },
  razorGale: {
    icon: "🌬️",
    animation: "cast",
    timing: {
      animationDurationMs: 1800,
      impactDelayMs: 950,
      eventDurationMs: 2300,
      damageNumberDurationMs: 1000,
    },
    battlefieldEffect: {
      spriteSrc: razorGaleEffect,
      width: 540,
      variant: "razorGale",
    },
    impact: "wind",
  },
  cyclone: {
    icon: "🌀",
    animation: "cast",
    timing: {
      animationDurationMs: 2300,
      impactDelayMs: 1450,
      eventDurationMs: 2800,
      damageNumberDurationMs: 1000,
    },
    targetEffect: {
      spriteSrc: cycloneEffect,
      width: 310,
      variant: "cycloneHit1",
      durationMs: 500,
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
  shatterWard: {
    icon: "✦",
    animation: "cast",
    timing: {
      animationDurationMs: 5000,
      impactDelayMs: 3200,
      eventDurationMs: 5600,
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
      animationDurationMs: 3600,
      impactDelayMs: 1600,
      eventDurationMs: 4300,
    },
    impact: "water",
  },
  warhound: {
    icon: "🐺",
    animation: "cast",
    timing: {
      animationDurationMs: 3600,
      impactDelayMs: 1850,
      eventDurationMs: 4800,
      damageNumberDurationMs: 2700,
    },
    targetEffect: {
      spriteSrc: warhoundEffect,
      width: 460,
      variant: "warhound",
      durationMs: 2000,
      startsOnImpact: true,
    },
  },
  bodyguard: {
    icon: "🛡️",
    animation: "cast",
    timing: {
      animationDurationMs: 1800,
      impactDelayMs: 700,
      eventDurationMs: 2200,
    },
  },
  ironquill: {
    icon: "🪶",
    animation: "cast",
    timing: {
      animationDurationMs: 1500,
      impactDelayMs: 750,
      eventDurationMs: 1750,
      damageNumberDurationMs: 1100,
    },
    projectile: {
      spriteSrc: steelDartEffect,
      width: 115,
      variant: "steelDart",
      rotationOffsetDegrees: -135,
    },
  },
  phoenixRebirth: {
    icon: "🔥",
    animation: "cast",
    impact: "fire",
    timing: {
      animationDurationMs: 1600,
      impactDelayMs: 250,
      eventDurationMs: 1900,
    },
  },
};
