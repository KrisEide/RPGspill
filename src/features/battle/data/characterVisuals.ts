import rowanIdleSprite from "../../../assets/sprites/characters/karakter1_2.png";
import rowanAutoAttackSprite from "../../../assets/sprites/characters/karakter1_autoattack.png";
import rowanFireballSprite from "../../../assets/sprites/characters/fireball_rowan.png";
import rowanWhirlwindSprite from "../../../assets/sprites/characters/rowan-whirlwind.png";
import lyraIdleSprite from "../../../assets/sprites/characters/karakter2_1.png";
import lyraAutoAttackSprite from "../../../assets/sprites/characters/karakter2_autoattack.png";
import lyraFireballSprite from "../../../assets/sprites/characters/fireball_lyra.png";
import lyraWhirlwindSprite from "../../../assets/sprites/characters/lyra-whirlwind.png";
import type {
  AbilityId,
  CharacterPresetId,
} from "../../../game/types";

type AbilitySpriteAdjustment = {
  offsetX: string;
  offsetY: string;
  scale: number;
  width?: string;
  height?: string;
  left?: string;
  top?: string;
};

type AnchoredSpriteLayout = {
  sourceSize: { width: number; height: number };
  sourceAnchor: { x: number; y: number };
  targetAnchor: { x: number; y: number };
  displayScale: number;
};

const createAnchoredSpriteAdjustment = ({
  sourceSize,
  sourceAnchor,
  targetAnchor,
  displayScale,
}: AnchoredSpriteLayout): AbilitySpriteAdjustment => ({
  offsetX: "0",
  offsetY: "0",
  scale: 1,
  width: `${sourceSize.width * displayScale}px`,
  height: `${sourceSize.height * displayScale}px`,
  left: `${targetAnchor.x - sourceAnchor.x * displayScale}px`,
  top: `${targetAnchor.y - sourceAnchor.y * displayScale}px`,
});

type CharacterVisualDefinition = {
  idleSpriteSrc: string;
  autoAttackSpriteSrc: string;
  abilitySpriteSrcs: Partial<Record<AbilityId, string>>;
  abilitySpriteAdjustments: Partial<
    Record<AbilityId, AbilitySpriteAdjustment>
  >;
  projectileOrigins: Partial<
    Record<AbilityId, { xRatio: number; yRatio: number }>
  >;
};

export const CHARACTER_VISUALS: Record<
  CharacterPresetId,
  CharacterVisualDefinition
> = {
  char1: {
    idleSpriteSrc: rowanIdleSprite,
    autoAttackSpriteSrc: rowanAutoAttackSprite,
    abilitySpriteSrcs: {
      fireball: rowanFireballSprite,
      whirlwind: rowanWhirlwindSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "5%",
        offsetY: "-1%",
        scale: 1.08,
      },
      whirlwind: createAnchoredSpriteAdjustment({
        sourceSize: { width: 1680, height: 936 },
        sourceAnchor: { x: 450, y: 840 },
        targetAnchor: { x: 320, y: 315 },
        displayScale: 0.64,
      }),
    },
    projectileOrigins: {
      fireball: {
        xRatio: 0.83,
        yRatio: 0.07,
      },
    },
  },
  char2: {
    idleSpriteSrc: lyraIdleSprite,
    autoAttackSpriteSrc: lyraAutoAttackSprite,
    abilitySpriteSrcs: {
      fireball: lyraFireballSprite,
      whirlwind: lyraWhirlwindSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "5%",
        offsetY: "-1%",
        scale: 1.08,
      },
      whirlwind: createAnchoredSpriteAdjustment({
        sourceSize: { width: 1680, height: 936 },
        sourceAnchor: { x: 445, y: 895 },
        targetAnchor: { x: 320, y: 315 },
        displayScale: 0.64,
      }),
    },
    projectileOrigins: {
      fireball: {
        xRatio: 0.83,
        yRatio: 0.07,
      },
    },
  },
};
