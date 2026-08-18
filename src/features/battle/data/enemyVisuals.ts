import orcGruntSprite from "../../../assets/sprites/monsters/orcgrunt.png";
import orcRaiderSprite from "../../../assets/sprites/monsters/orcraider.png";
import orcRaiderAttackSprite from "../../../assets/sprites/monsters/orcraider_stab.png";
import orcMageSprite from "../../../assets/sprites/monsters/orcmage.png";
import orcMageDarkBoltSprite from "../../../assets/sprites/monsters/orcmage_darkbolt.png";
import orcWizardIdleSprite from "../../../assets/sprites/monsters/orcwizard_idle.png";
import orcWizardAttackOneSprite from "../../../assets/sprites/monsters/orcwizard_attack1.png";
import orcHealerSprite from "../../../assets/sprites/monsters/orchealer.png";
import orcHealerAttackSprite from "../../../assets/sprites/monsters/orchealer_attack.png";
import orcHealerHealingSprite from "../../../assets/sprites/monsters/orchealer_healing.png";
import orcMaulerSprite from "../../../assets/sprites/monsters/orcmauler.png";
import orcMaulerAttackSprite from "../../../assets/sprites/monsters/orcmauler_attack.png";
import level1OrcAutoAttackSprite from "../../../assets/sprites/monsters/level1orcattack.png";
import type { AbilityId, EnemyId } from "../../../game/types";

type EnemySpriteAdjustment = {
  width: string;
  height: string;
  left: string;
  top: string;
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

const orcWizardCastingSpriteAdjustment =
  createAnchoredEnemySpriteAdjustment({
    sourceSize: { width: 1254, height: 1254 },
    sourceAnchor: { x: 720, y: 1215 },
    targetAnchor: { x: 260, y: 330 },
    displayScale: 0.352,
  });

type EnemyVisualDefinition = {
  idleSpriteSrc: string;
  autoAttackSpriteSrc: string;
  attackAnimationVariant?: "snappy" | "raiderStab" | "stationaryStrike";
  attackAnimationDurationMs?: number;
  spriteScale?: number;
  statusTop?: string;
  idleSpriteAdjustment?: EnemySpriteAdjustment;
  attackSpriteAdjustment?: EnemySpriteAdjustment;
  abilitySpriteSequences?: Partial<
    Record<
      AbilityId,
      {
        variant: "dreadflame" | "healing";
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
  level1Orc: {
    idleSpriteSrc: orcGruntSprite,
    autoAttackSpriteSrc: level1OrcAutoAttackSprite,
    attackAnimationVariant: "snappy",
    attackAnimationDurationMs: 1850,
  },
  orcRaider: {
    idleSpriteSrc: orcRaiderSprite,
    autoAttackSpriteSrc: orcRaiderAttackSprite,
    attackAnimationVariant: "raiderStab",
    attackAnimationDurationMs: 1650,
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
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.3,
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
};
