import rowanIdleSprite from "../../../assets/sprites/characters/karakter1_2.png";
import rowanAutoAttackSprite from "../../../assets/sprites/characters/karakter1_autoattack.png";
import rowanFireballSprite from "../../../assets/sprites/characters/fireball_rowan.png";
import rowanWhirlwindSprite from "../../../assets/sprites/characters/rowan-whirlwind.png";
import rowanCastingSprite from "../../../assets/sprites/characters/rowancasting.png";
import rowanEarthHealingSprite from "../../../assets/sprites/characters/rowan_earthheal.png";
import rowanWaterHealingSprite from "../../../assets/sprites/characters/rowan_waterhealing.png";
import lyraIdleSprite from "../../../assets/sprites/characters/karakter2_1.png";
import lyraAutoAttackSprite from "../../../assets/sprites/characters/karakter2_autoattack.png";
import lyraFireballSprite from "../../../assets/sprites/characters/lyra_fireball.png";
import lyraWhirlwindSprite from "../../../assets/sprites/characters/lyra-whirlwind.png";
import lyraCastingSprite from "../../../assets/sprites/characters/lyracasting.png";
import lyraEarthHealingSprite from "../../../assets/sprites/characters/lyra_earthheal.png";
import lyraWaterHealingSprite from "../../../assets/sprites/characters/lyra_waterhealing.png";
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

const HEALING_SPRITE_ADJUSTMENT = createAnchoredSpriteAdjustment({
  sourceSize: { width: 1024, height: 1536 },
  sourceAnchor: { x: 512, y: 1370 },
  targetAnchor: { x: 260, y: 330 },
  displayScale: 0.31,
});

const LYRA_EARTH_HEALING_SPRITE_ADJUSTMENT =
  createAnchoredSpriteAdjustment({
    sourceSize: { width: 1024, height: 1536 },
    sourceAnchor: { x: 512, y: 1370 },
    targetAnchor: { x: 260, y: 330 },
    displayScale: 0.29,
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
      crashingWave: rowanCastingSprite,
      healingTide: rowanWaterHealingSprite,
      stonebloom: rowanEarthHealingSprite,
      whirlwind: rowanWhirlwindSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "7%",
        offsetY: "0%",
        scale: 0.92,
      },
      healingTide: HEALING_SPRITE_ADJUSTMENT,
      stonebloom: HEALING_SPRITE_ADJUSTMENT,
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
      windSlash: {
        xRatio: 0.76,
        yRatio: 0.5,
      },
    },
  },
  char2: {
    idleSpriteSrc: lyraIdleSprite,
    autoAttackSpriteSrc: lyraAutoAttackSprite,
    abilitySpriteSrcs: {
      fireball: lyraFireballSprite,
      crashingWave: lyraCastingSprite,
      healingTide: lyraWaterHealingSprite,
      stonebloom: lyraEarthHealingSprite,
      whirlwind: lyraWhirlwindSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "5%",
        offsetY: "-1%",
        scale: 1.08,
      },
      healingTide: HEALING_SPRITE_ADJUSTMENT,
      stonebloom: LYRA_EARTH_HEALING_SPRITE_ADJUSTMENT,
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
      windSlash: {
        xRatio: 0.76,
        yRatio: 0.5,
      },
    },
  },
};
