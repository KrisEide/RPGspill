import orcGruntSprite from "../../../assets/sprites/monsters/orcs/orcgrunt.png";
import orcRaiderSprite from "../../../assets/sprites/monsters/orcs/orcraider.png";
import orcRaiderAttackSprite from "../../../assets/sprites/monsters/orcs/orcraider_stab.png";
import orcMageSprite from "../../../assets/sprites/monsters/orcs/orcmage.png";
import orcMageDarkBoltSprite from "../../../assets/sprites/monsters/orcs/orcmage_darkbolt.png";
import orcWizardIdleSprite from "../../../assets/sprites/monsters/orcs/orcwizard_idle.png";
import orcWizardAttackOneSprite from "../../../assets/sprites/monsters/orcs/orcwizard_attack1.png";
import orcHealerSprite from "../../../assets/sprites/monsters/orcs/orchealer.png";
import orcHealerAttackSprite from "../../../assets/sprites/monsters/orcs/orchealer_attack.png";
import orcHealerHealingSprite from "../../../assets/sprites/monsters/orcs/orchealer_healing.png";
import orcMaulerSprite from "../../../assets/sprites/monsters/orcs/orcmauler.png";
import orcMaulerAttackSprite from "../../../assets/sprites/monsters/orcs/orcmauler_attack.png";
import orcGuardSprite from "../../../assets/sprites/monsters/orcs/orc_guard.png";
import orcGuardAttackSprite from "../../../assets/sprites/monsters/orcs/orc_guard_attack.png";
import orcGuardRallySprite from "../../../assets/sprites/monsters/orcs/orc_guard_rally.png";
import gorakBossSprite from "../../../assets/sprites/monsters/orcs/orc_gorak_boss.png";
import gorakAttackSprite from "../../../assets/sprites/monsters/orcs/orc_gorak_attack.png";
import gorakChargeSprite from "../../../assets/sprites/monsters/orcs/orc_gorak_charge.png";
import gorakWakeUpSprite from "../../../assets/sprites/monsters/orcs/orc_gorak_wakeup.png";
import brakkBossSleepingSprite from "../../../assets/sprites/monsters/orcs/orc_brakk_boss_sleeping.png";
import brakkIdleSprite from "../../../assets/sprites/monsters/orcs/orc_brakk_idle.png";
import brakkBloodCleaveSprite from "../../../assets/sprites/monsters/orcs/orc_brakk_slashbleed.png";
import brakkSmashSprite from "../../../assets/sprites/monsters/orcs/orc_brakk_smash.png";
import brakkTiredSprite from "../../../assets/sprites/monsters/orcs/orc_brakk_tired.png";
import level1OrcAutoAttackSprite from "../../../assets/sprites/monsters/orcs/level1orcattack.png";
import smallSlimeIdleSprite from "../../../assets/sprites/monsters/slimes/slime_small_idle.png";
import smallSlimeAttackSprite from "../../../assets/sprites/monsters/slimes/slime_small_attack.png";
import greenSlimeIdleSprite from "../../../assets/sprites/monsters/slimes/slime_green_idle.png";
import greenSlimeAttackSprite from "../../../assets/sprites/monsters/slimes/slime_green_singelattack.png";
import greenSlimeMultiAttackSprite from "../../../assets/sprites/monsters/slimes/slime_green_multiattack.png";
import greenSlimeBuffSprite from "../../../assets/sprites/monsters/slimes/slime_green_buff.png";
import blueSlimeIdleSprite from "../../../assets/sprites/monsters/slimes/slime_blue_idle.png";
import blueSlimeAttackSprite from "../../../assets/sprites/monsters/slimes/slime_blue_attack.png";
import blueSlimePoisonAttackSprite from "../../../assets/sprites/monsters/slimes/slime_blue_poisonattack.png";
import goatOneIdleSprite from "../../../assets/sprites/act2monsters/goat1_idle.png";
import goatOneStompSprite from "../../../assets/sprites/act2monsters/goat1_stomp.png";
import goatOneChargeSprite from "../../../assets/sprites/act2monsters/goat1_charge.png";
import goatTwoIdleSprite from "../../../assets/sprites/act2monsters/goat2_idle.png";
import goatTwoStompSprite from "../../../assets/sprites/act2monsters/goat2_stomp.png";
import goatTwoChargeSprite from "../../../assets/sprites/act2monsters/goat2_charge.png";
import rockwhistlerIdleSprite from "../../../assets/sprites/act2monsters/rockwhistler_idle.png";
import rockwhistlerAttackSprite from "../../../assets/sprites/act2monsters/rockwhistler_attack.png";
import rockwhistlerBurrowSprite from "../../../assets/sprites/act2monsters/rockwhistler_burrow.png";
import rockwhistlerCallSprite from "../../../assets/sprites/act2monsters/rockwhistler_call.png";
import rockhideLizardIdleSprite from "../../../assets/sprites/act2monsters/rockhidelizard_idl.png";
import rockhideLizardAttackSprite from "../../../assets/sprites/act2monsters/rockhidelizard_attack.png";
import rockhideLizardStompSprite from "../../../assets/sprites/act2monsters/rockhidelizard_stomp.png";
import type { AbilityId, EnemyId } from "../../../game/types";

type EnemySpriteAdjustment = {
  width: string;
  height: string;
  left: string;
  top: string;
};

type EnemyHitboxAdjustment = {
  left?: string;
  top?: string;
  width?: string;
  height?: string;
};

type EnemyDamageAnchorAdjustment = {
  x?: string;
  y?: string;
};

type EnemyImpactAnchor = {
  xRatio: number;
  yRatio: number;
};

type AnchoredEnemySpriteLayout = {
  sourceSize: { width: number; height: number };
  sourceAnchor: { x: number; y: number };
  targetAnchor: { x: number; y: number };
  displayScale: number;
};

const createAnchoredEnemySpriteAdjustment = ({
  sourceSize,
  sourceAnchor,
  targetAnchor,
  displayScale,
}: AnchoredEnemySpriteLayout): EnemySpriteAdjustment => ({
  width: `${sourceSize.width * displayScale}px`,
  height: `${sourceSize.height * displayScale}px`,
  left: `${targetAnchor.x - sourceAnchor.x * displayScale}px`,
  top: `${targetAnchor.y - sourceAnchor.y * displayScale}px`,
});

const orcWizardCastingSpriteAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1254, height: 1254 },
  sourceAnchor: { x: 720, y: 1215 },
  targetAnchor: { x: 260, y: 330 },
  displayScale: 0.352,
});

const rockwhistlerSpriteAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1254, height: 1254 },
  sourceAnchor: { x: 630, y: 1030 },
  targetAnchor: { x: 275, y: 330 },
  displayScale: 0.14,
});

const rockwhistlerAttackSpriteAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1254, height: 1254 },
  sourceAnchor: { x: 630, y: 1030 },
  targetAnchor: { x: 185, y: 330 },
  displayScale: 0.14,
});

const rockhideLizardIdleAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1858, height: 846 },
  sourceAnchor: { x: 929, y: 800 },
  targetAnchor: { x: 275, y: 330 },
  displayScale: 0.3,
});

const rockhideLizardAttackAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1774, height: 887 },
  sourceAnchor: { x: 887, y: 840 },
  targetAnchor: { x: 110, y: 340 },
  displayScale: 0.3,
});

const rockhideLizardStompAdjustment = createAnchoredEnemySpriteAdjustment({
  sourceSize: { width: 1448, height: 1086 },
  sourceAnchor: { x: 724, y: 1010 },
  targetAnchor: { x: 275, y: 375 },
  displayScale: 0.39,
});

type EnemyVisualDefinition = {
  idleSpriteSrc: string;
  sleepingSpriteSrc?: string;
  autoAttackSpriteSrc: string;
  attackAnimationVariant?: "snappy" | "stationaryStrike";
  attackAnimationDurationMs?: number;
  baseFilter?: string;
  spriteScale?: number;
  statusTop?: string;
  sleepingStatusTop?: string;
  idleSpriteAdjustment?: EnemySpriteAdjustment;
  sleepingSpriteAdjustment?: EnemySpriteAdjustment;
  hitboxAdjustment?: EnemyHitboxAdjustment;
  damageAnchorAdjustment?: EnemyDamageAnchorAdjustment;
  impactAnchor?: EnemyImpactAnchor;
  attackSpriteAdjustment?: EnemySpriteAdjustment;
  abilitySpriteSequences?: Partial<
    Record<
      AbilityId,
      {
        variant:
          | "dreadflame"
          | "healing"
          | "bossAction"
          | "rest"
          | "burrow"
          | "charge"
          | "heavySweep"
          | "stationaryAction";
        frames: Array<{
          spriteSrc: string;
          adjustment?: EnemySpriteAdjustment;
        }>;
      }
    >
  >;
  projectileOrigins?: Partial<
    Record<AbilityId, { xRatio: number; yRatio: number }>
  >;
};

export const ENEMY_VISUALS: Record<EnemyId, EnemyVisualDefinition> = {
  smallSlime: {
    idleSpriteSrc: smallSlimeIdleSprite,
    autoAttackSpriteSrc: smallSlimeAttackSprite,
    attackAnimationVariant: "snappy",
    attackAnimationDurationMs: 1750,
    statusTop: "102px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 625, y: 900 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.42,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 625, y: 840 },
      targetAnchor: { x: 150, y: 375 },
      displayScale: 0.42,
    }),
  },
  greenSlime: {
    idleSpriteSrc: greenSlimeIdleSprite,
    autoAttackSpriteSrc: greenSlimeAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2300,
    statusTop: "76px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 650, y: 960 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.42,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 650, y: 920 },
      targetAnchor: { x: 150, y: 375 },
      displayScale: 0.42,
    }),
    abilitySpriteSequences: {
      greenSlimeStrongAttack: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: greenSlimeMultiAttackSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1254, height: 1254 },
              sourceAnchor: { x: 650, y: 920 },
              targetAnchor: { x: 110, y: 395 },
              displayScale: 0.5,
            }),
          },
        ],
      },
      greenSlimeBuff: {
        variant: "healing",
        frames: [
          {
            spriteSrc: greenSlimeBuffSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1254, height: 1254 },
              sourceAnchor: { x: 675, y: 1025 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.4,
            }),
          },
        ],
      },
    },
  },
  blueSlime: {
    idleSpriteSrc: blueSlimeIdleSprite,
    autoAttackSpriteSrc: blueSlimeAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2300,
    statusTop: "82px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 650, y: 900 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.43,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 900, y: 900 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.43,
    }),
    abilitySpriteSequences: {
      blueSlimePoisonAttack: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: blueSlimePoisonAttackSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1254, height: 1254 },
              sourceAnchor: { x: 900, y: 900 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.43,
            }),
          },
        ],
      },
    },
  },
  level1Orc: {
    idleSpriteSrc: orcGruntSprite,
    autoAttackSpriteSrc: level1OrcAutoAttackSprite,
    attackAnimationVariant: "snappy",
    attackAnimationDurationMs: 1850,
    abilitySpriteSequences: {
      orcGruntMultiAttack: {
        variant: "heavySweep",
        frames: [
          { spriteSrc: level1OrcAutoAttackSprite },
          { spriteSrc: level1OrcAutoAttackSprite },
        ],
      },
    },
  },
  orcRaider: {
    idleSpriteSrc: orcRaiderSprite,
    autoAttackSpriteSrc: orcRaiderAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 1950,
    statusTop: "-28px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1536, height: 1024 },
      sourceAnchor: { x: 990, y: 970 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.31,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1024, height: 1536 },
      sourceAnchor: { x: 650, y: 1280 },
      targetAnchor: { x: 120, y: 390 },
      displayScale: 0.34,
    }),
  },
  orcMage: {
    idleSpriteSrc: orcMageSprite,
    autoAttackSpriteSrc: orcMageDarkBoltSprite,
    statusTop: "-60px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1292, height: 1217 },
      sourceAnchor: { x: 830, y: 1190 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.295,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1024, height: 1536 },
      sourceAnchor: { x: 580, y: 1270 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.315,
    }),
    projectileOrigins: {
      darkBolt: { xRatio: 0.19, yRatio: 0.3 },
    },
  },
  orcWizard: {
    idleSpriteSrc: orcWizardIdleSprite,
    autoAttackSpriteSrc: orcWizardAttackOneSprite,
    statusTop: "-30px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 770, y: 1215 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.273,
    }),
    abilitySpriteSequences: {
      gatherDreadflame: {
        variant: "dreadflame",
        frames: [
          {
            spriteSrc: orcWizardAttackOneSprite,
            adjustment: orcWizardCastingSpriteAdjustment,
          },
        ],
      },
      dreadflame: {
        variant: "dreadflame",
        frames: [
          {
            spriteSrc: orcWizardAttackOneSprite,
            adjustment: orcWizardCastingSpriteAdjustment,
          },
        ],
      },
    },
  },
  orcHealer: {
    idleSpriteSrc: orcHealerSprite,
    autoAttackSpriteSrc: orcHealerAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2100,
    statusTop: "-35px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1312, height: 1199 },
      sourceAnchor: { x: 780, y: 1160 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.285,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 890, y: 1010 },
      targetAnchor: { x: 120, y: 385 },
      displayScale: 0.37,
    }),
    abilitySpriteSequences: {
      mendWounds: {
        variant: "healing",
        frames: [
          {
            spriteSrc: orcHealerHealingSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1122, height: 1402 },
              sourceAnchor: { x: 700, y: 1340 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.29,
            }),
          },
        ],
      },
    },
  },
  orcMauler: {
    idleSpriteSrc: orcMaulerSprite,
    autoAttackSpriteSrc: orcMaulerAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2100,
    statusTop: "-34px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1206, height: 1305 },
      sourceAnchor: { x: 680, y: 1270 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.28,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1448, height: 1086 },
      sourceAnchor: { x: 975, y: 1040 },
      targetAnchor: { x: 90, y: 395 },
      displayScale: 0.33,
    }),
  },
  orcGuard: {
    idleSpriteSrc: orcGuardSprite,
    autoAttackSpriteSrc: orcGuardAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2400,
    statusTop: "18px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1536, height: 1024 },
      sourceAnchor: { x: 870, y: 915 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.3,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1254, height: 1254 },
      sourceAnchor: { x: 850, y: 980 },
      targetAnchor: { x: 110, y: 390 },
      displayScale: 0.36,
    }),
    abilitySpriteSequences: {
      guardRally: {
        variant: "healing",
        frames: [
          {
            spriteSrc: orcGuardRallySprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1448, height: 1086 },
              sourceAnchor: { x: 800, y: 1040 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.38,
            }),
          },
        ],
      },
      guardShieldCharge: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: orcGuardAttackSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1254, height: 1254 },
              sourceAnchor: { x: 850, y: 980 },
              targetAnchor: { x: 110, y: 390 },
              displayScale: 0.36,
            }),
          },
        ],
      },
    },
  },
  brakkBoss: {
    idleSpriteSrc: brakkIdleSprite,
    sleepingSpriteSrc: brakkBossSleepingSprite,
    autoAttackSpriteSrc: brakkSmashSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 3000,
    spriteScale: 1,
    statusTop: "-112px",
    sleepingStatusTop: "-42px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1086, height: 1448 },
      sourceAnchor: { x: 650, y: 1320 },
      targetAnchor: { x: 335, y: 315 },
      displayScale: 0.335,
    }),
    sleepingSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1448, height: 1086 },
      sourceAnchor: { x: 724, y: 970 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.34,
    }),
    abilitySpriteSequences: {
      bloodCleave: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: brakkBloodCleaveSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1122, height: 1402 },
              sourceAnchor: { x: 690, y: 1250 },
              targetAnchor: { x: 35, y: 405 },
              displayScale: 0.47,
            }),
          },
        ],
      },
      smash: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: brakkSmashSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 960, y: 950 },
              targetAnchor: { x: 125, y: 390 },
              displayScale: 0.4,
            }),
          },
        ],
      },
      catchBreath: {
        variant: "rest",
        frames: [
          {
            spriteSrc: brakkTiredSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 900, y: 940 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.35,
            }),
          },
        ],
      },
    },
  },
  gorakBoss: {
    idleSpriteSrc: gorakBossSprite,
    autoAttackSpriteSrc: gorakAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 1900,
    spriteScale: 1.14,
    statusTop: "-110px",
    hitboxAdjustment: {
      left: "24%",
      top: "52%",
      width: "360px",
      height: "280px",
    },
    damageAnchorAdjustment: {
      x: "-150px",
      y: "-55px",
    },
    impactAnchor: {
      xRatio: 0.12,
      yRatio: 0.42,
    },
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1206, height: 1305 },
      sourceAnchor: { x: 1000, y: 1100 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.425,
    }),
    abilitySpriteSequences: {
      gorakAutoAttack: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: gorakAttackSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1448, height: 1086 },
              sourceAnchor: { x: 800, y: 980 },
              targetAnchor: { x: -180, y: 440 },
              displayScale: 0.37,
            }),
          },
        ],
      },
      shieldCharge: {
        variant: "charge",
        frames: [
          {
            spriteSrc: gorakChargeSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 800, y: 965 },
              targetAnchor: { x: 135, y: 382 },
              displayScale: 0.35,
            }),
          },
        ],
      },
      wakeUp: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: gorakWakeUpSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 850, y: 960 },
              targetAnchor: { x: 195, y: 340 },
              displayScale: 0.35,
            }),
          },
        ],
      },
    },
  },
  goat1: {
    idleSpriteSrc: goatOneIdleSprite,
    autoAttackSpriteSrc: goatOneChargeSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2450,
    baseFilter: "brightness(0.9) contrast(0.9) saturate(0.92)",
    statusTop: "-42px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1122, height: 1402 },
      sourceAnchor: { x: 650, y: 1250 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.28,
    }),
    abilitySpriteSequences: {
      goatStomp: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: goatOneStompSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 760, y: 900 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.32,
            }),
          },
        ],
      },
      goatCharge: {
        variant: "charge",
        frames: [
          {
            spriteSrc: goatOneChargeSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1536, height: 1024 },
              sourceAnchor: { x: 700, y: 850 },
              targetAnchor: { x: 120, y: 390 },
              displayScale: 0.31,
            }),
          },
        ],
      },
    },
  },
  goat2: {
    idleSpriteSrc: goatTwoIdleSprite,
    autoAttackSpriteSrc: goatTwoChargeSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2550,
    baseFilter: "brightness(0.9) contrast(0.9) saturate(0.92)",
    statusTop: "-42px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1122, height: 1402 },
      sourceAnchor: { x: 650, y: 1250 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.29,
    }),
    abilitySpriteSequences: {
      goatStomp: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: goatTwoStompSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1312, height: 1199 },
              sourceAnchor: { x: 700, y: 1100 },
              targetAnchor: { x: 275, y: 330 },
              displayScale: 0.3,
            }),
          },
        ],
      },
      goatCharge: {
        variant: "charge",
        frames: [
          {
            spriteSrc: goatTwoChargeSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1122, height: 1402 },
              sourceAnchor: { x: 620, y: 1200 },
              targetAnchor: { x: 100, y: 400 },
              displayScale: 0.3,
            }),
          },
        ],
      },
    },
  },
  rockwhistler: {
    idleSpriteSrc: rockwhistlerIdleSprite,
    autoAttackSpriteSrc: rockwhistlerAttackSprite,
    attackAnimationVariant: "snappy",
    attackAnimationDurationMs: 1750,
    baseFilter: "brightness(0.96) contrast(1.08) saturate(0.92)",
    statusTop: "160px",
    idleSpriteAdjustment: rockwhistlerSpriteAdjustment,
    attackSpriteAdjustment: rockwhistlerAttackSpriteAdjustment,
    abilitySpriteSequences: {
      rockwhistlerAttack: { variant: "bossAction", frames: [{ spriteSrc: rockwhistlerAttackSprite, adjustment: rockwhistlerAttackSpriteAdjustment }] },
      rockwhistlerPackAttack: { variant: "bossAction", frames: [{ spriteSrc: rockwhistlerAttackSprite, adjustment: rockwhistlerAttackSpriteAdjustment }] },
      rockwhistlerBurrow: { variant: "burrow", frames: [{ spriteSrc: rockwhistlerBurrowSprite, adjustment: rockwhistlerSpriteAdjustment }] },
      rockwhistlerCall: { variant: "healing", frames: [{ spriteSrc: rockwhistlerCallSprite, adjustment: rockwhistlerSpriteAdjustment }] },
    },
  },
  rockhideLizard: {
    idleSpriteSrc: rockhideLizardIdleSprite,
    autoAttackSpriteSrc: rockhideLizardAttackSprite,
    attackAnimationVariant: "stationaryStrike",
    attackAnimationDurationMs: 2800,
    baseFilter: "brightness(0.9) contrast(0.9) saturate(0.92)",
    statusTop: "42px",
    idleSpriteAdjustment: rockhideLizardIdleAdjustment,
    attackSpriteAdjustment: rockhideLizardAttackAdjustment,
    hitboxAdjustment: {
      left: "50%",
      top: "215px",
      width: "560px",
      height: "270px",
    },
    damageAnchorAdjustment: { x: "-12px", y: "-30px" },
    impactAnchor: { xRatio: 0.38, yRatio: 0.58 },
    abilitySpriteSequences: {
      stonejawBite: {
        variant: "bossAction",
        frames: [
          {
            spriteSrc: rockhideLizardAttackSprite,
            adjustment: rockhideLizardAttackAdjustment,
          },
        ],
      },
      groundSlam: {
        variant: "stationaryAction",
        frames: [
          {
            spriteSrc: rockhideLizardStompSprite,
            adjustment: rockhideLizardStompAdjustment,
          },
        ],
      },
      rockScrape: {
        variant: "rest",
        frames: [
          {
            spriteSrc: rockhideLizardIdleSprite,
            adjustment: rockhideLizardIdleAdjustment,
          },
        ],
      },
    },
  },
};
