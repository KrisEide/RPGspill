import orcGruntSprite from "../../../assets/sprites/monsters/orcgrunt.png";
import orcRaiderSprite from "../../../assets/sprites/monsters/orcraider.png";
import orcRaiderAttackSprite from "../../../assets/sprites/monsters/orc-raider-attack.png";
import orcMageSprite from "../../../assets/sprites/monsters/orcmage.png";
import orcMageDarkBoltSprite from "../../../assets/sprites/monsters/orcmage-dark-bolt.png";
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
  spriteScale?: number;
  statusTop?: string;
  idleSpriteAdjustment?: EnemySpriteAdjustment;
  attackSpriteAdjustment?: EnemySpriteAdjustment;
  projectileOrigins?: Partial<
    Record<AbilityId, { xRatio: number; yRatio: number }>
  >;
};

export const ENEMY_VISUALS: Record<EnemyId, EnemyVisualDefinition> = {
  level1Orc: {
    idleSpriteSrc: orcGruntSprite,
    autoAttackSpriteSrc: level1OrcAutoAttackSprite,
  },
  orcRaider: {
    idleSpriteSrc: orcRaiderSprite,
    autoAttackSpriteSrc: orcRaiderAttackSprite,
    spriteScale: 0.72,
  },
  orcMage: {
    idleSpriteSrc: orcMageSprite,
    autoAttackSpriteSrc: orcMageDarkBoltSprite,
    statusTop: "-60px",
    idleSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1024, height: 1536 },
      sourceAnchor: { x: 635, y: 1370 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.29,
    }),
    attackSpriteAdjustment: createAnchoredEnemySpriteAdjustment({
      sourceSize: { width: 1188, height: 840 },
      sourceAnchor: { x: 750, y: 810 },
      targetAnchor: { x: 275, y: 330 },
      displayScale: 0.4,
    }),
    projectileOrigins: {
      darkBolt: { xRatio: 0.015, yRatio: 0.27 },
    },
  },
};
