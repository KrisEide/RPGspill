import orcGruntSprite from "../../../assets/sprites/monsters/orcgrunt.png";
import orcRaiderSprite from "../../../assets/sprites/monsters/orcraider.png";
import orcRaiderAttackSprite from "../../../assets/sprites/monsters/orcraider_stab.png";
import orcMageSprite from "../../../assets/sprites/monsters/orcmage.png";
import orcMageDarkBoltSprite from "../../../assets/sprites/monsters/orcmage_darkbolt.png";
import orcWizardIdleSprite from "../../../assets/sprites/monsters/orcwizard_idle.png";
import orcWizardAttackOneSprite from "../../../assets/sprites/monsters/orcwizard_attack1.png";
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

type EnemyVisualDefinition = {
  idleSpriteSrc: string;
  autoAttackSpriteSrc: string;
  attackAnimationVariant?: "snappy" | "raiderStab";
  attackAnimationDurationMs?: number;
  spriteScale?: number;
  statusTop?: string;
  idleSpriteAdjustment?: EnemySpriteAdjustment;
  attackSpriteAdjustment?: EnemySpriteAdjustment;
  abilitySpriteSequences?: Partial<
    Record<
      AbilityId,
      {
        variant: "dreadflame";
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
      displayScale: 0.26,
    }),
    abilitySpriteSequences: {
      dreadflame: {
        variant: "dreadflame",
        frames: [
          {
            spriteSrc: orcWizardAttackOneSprite,
            adjustment: createAnchoredEnemySpriteAdjustment({
              sourceSize: { width: 1254, height: 1254 },
              sourceAnchor: { x: 720, y: 1215 },
              targetAnchor: { x: 260, y: 330 },
              displayScale: 0.32,
            }),
          },
        ],
      },
    },
  },
};
