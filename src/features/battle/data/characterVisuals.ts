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
import rowanGhostIdleSprite from "../../../assets/sprites/characters/rowan_ghost_idle.png";
import rowanGhostStrikeSprite from "../../../assets/sprites/characters/rowan_ghost_ghoststrike.png";
import rowanGhostBoltSprite from "../../../assets/sprites/characters/rowan_ghost_ghostbolt.png";
import lyraGhostIdleSprite from "../../../assets/sprites/characters/lyra_ghost_idle.png";
import lyraGhostStrikeSprite from "../../../assets/sprites/characters/lyra_ghost_ghoststrike.png";
import lyraGhostBoltSprite from "../../../assets/sprites/characters/lyra_ghost_ghostbolt.png";
import rowanPotionUseSprite from "../../../assets/sprites/characters/rowan_potionuse.png";
import lyraPotionUseSprite from "../../../assets/sprites/characters/lyra_potionuse.png";
import rowanCastSpellSprite from "../../../assets/sprites/characters/rowan_castspell.png";
import lyraCastSpellSprite from "../../../assets/sprites/characters/lyra_castspell.png";
import rowanMagicBagSprite from "../../../assets/sprites/characters/rowan_magicbag.png";
import lyraMagicBagSprite from "../../../assets/sprites/characters/lyra_magicbag.png";
import type {
  AbilityId,
  CharacterPresetId,
  ItemId,
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

const LYRA_WATER_HEALING_SPRITE_ADJUSTMENT =
  createAnchoredSpriteAdjustment({
    sourceSize: { width: 1024, height: 1536 },
    sourceAnchor: { x: 512, y: 1370 },
    targetAnchor: { x: 260, y: 330 },
    displayScale: 0.29,
  });

type CharacterVisualDefinition = {
  idleSpriteSrc: string;
  ghostIdleSpriteSrc: string;
  ghostAbilitySpriteSrcs: Partial<Record<AbilityId, string>>;
  autoAttackSpriteSrc: string;
  abilitySpriteSrcs: Partial<Record<AbilityId, string>>;
  chargeAbilitySpriteSrcs: Partial<Record<AbilityId, string>>;
  itemSpriteSrcs: Partial<Record<ItemId, string>>;
  abilitySpriteAdjustments: Partial<
    Record<AbilityId, AbilitySpriteAdjustment>
  >;
  projectileOrigins: Partial<
    Record<AbilityId, { xRatio: number; yRatio: number }>
  >;
  itemProjectileOrigin: { xRatio: number; yRatio: number };
};

export const CHARACTER_VISUALS: Record<
  CharacterPresetId,
  CharacterVisualDefinition
> = {
  char1: {
    idleSpriteSrc: rowanIdleSprite,
    ghostIdleSpriteSrc: rowanGhostIdleSprite,
    ghostAbilitySpriteSrcs: {
      ghostStrike: rowanGhostStrikeSprite,
      ghostBolt: rowanGhostBoltSprite,
      ghostHeal: rowanGhostIdleSprite,
      possession: rowanGhostIdleSprite,
    },
    autoAttackSpriteSrc: rowanAutoAttackSprite,
    abilitySpriteSrcs: {
      fireball: rowanFireballSprite,
      cinderCurse: rowanCastSpellSprite,
      earthquake: rowanCastSpellSprite,
      stonebreaker: rowanCastSpellSprite,
      crashingWave: rowanCastingSprite,
      tidalDrain: rowanCastSpellSprite,
      restoringCurrent: rowanEarthHealingSprite,
      magicBag: rowanMagicBagSprite,
      healingTide: rowanWaterHealingSprite,
      stonebloom: rowanEarthHealingSprite,
      whirlwind: rowanWhirlwindSprite,
      razorGale: rowanCastSpellSprite,
      warhound: rowanCastSpellSprite,
      bodyguard: rowanCastSpellSprite,
      ironquill: rowanCastSpellSprite,
    },
    chargeAbilitySpriteSrcs: {
      stonebreaker: rowanCastSpellSprite,
      restoringCurrent: rowanCastSpellSprite,
    },
    itemSpriteSrcs: {
      healingPotion: rowanPotionUseSprite,
      elixir: rowanPotionUseSprite,
      throwingKnife: rowanCastSpellSprite,
      steelDart: rowanCastSpellSprite,
      fuseDart: rowanCastSpellSprite,
      barrierFlask: rowanPotionUseSprite,
      powerTonic: rowanPotionUseSprite,
      cleansingTonic: rowanPotionUseSprite,
      phoenixTonic: rowanPotionUseSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "7%",
        offsetY: "0%",
        scale: 0.92,
      },
      healingTide: HEALING_SPRITE_ADJUSTMENT,
      restoringCurrent: HEALING_SPRITE_ADJUSTMENT,
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
        yRatio: 0.14,
      },
      windSlash: {
        xRatio: 0.76,
        yRatio: 0.5,
      },
      swiftWing: {
        xRatio: 0.76,
        yRatio: 0.5,
      },
      ironquill: {
        xRatio: 0.82,
        yRatio: 0.28,
      },
    },
    itemProjectileOrigin: {
      xRatio: 0.82,
      yRatio: 0.28,
    },
  },
  char2: {
    idleSpriteSrc: lyraIdleSprite,
    ghostIdleSpriteSrc: lyraGhostIdleSprite,
    ghostAbilitySpriteSrcs: {
      ghostStrike: lyraGhostStrikeSprite,
      ghostBolt: lyraGhostBoltSprite,
      ghostHeal: lyraGhostIdleSprite,
      possession: lyraGhostIdleSprite,
    },
    autoAttackSpriteSrc: lyraAutoAttackSprite,
    abilitySpriteSrcs: {
      fireball: lyraFireballSprite,
      cinderCurse: lyraCastSpellSprite,
      earthquake: lyraCastSpellSprite,
      stonebreaker: lyraCastSpellSprite,
      crashingWave: lyraCastingSprite,
      tidalDrain: lyraCastSpellSprite,
      restoringCurrent: lyraEarthHealingSprite,
      magicBag: lyraMagicBagSprite,
      healingTide: lyraWaterHealingSprite,
      stonebloom: lyraEarthHealingSprite,
      whirlwind: lyraWhirlwindSprite,
      razorGale: lyraCastSpellSprite,
      warhound: lyraCastSpellSprite,
      bodyguard: lyraCastSpellSprite,
      ironquill: lyraCastSpellSprite,
    },
    chargeAbilitySpriteSrcs: {
      stonebreaker: lyraCastSpellSprite,
      restoringCurrent: lyraCastSpellSprite,
    },
    itemSpriteSrcs: {
      healingPotion: lyraPotionUseSprite,
      elixir: lyraPotionUseSprite,
      throwingKnife: lyraCastSpellSprite,
      steelDart: lyraCastSpellSprite,
      fuseDart: lyraCastSpellSprite,
      barrierFlask: lyraPotionUseSprite,
      powerTonic: lyraPotionUseSprite,
      cleansingTonic: lyraPotionUseSprite,
      phoenixTonic: lyraPotionUseSprite,
    },
    abilitySpriteAdjustments: {
      fireball: {
        offsetX: "5%",
        offsetY: "-1%",
        scale: 1.08,
      },
      healingTide: LYRA_WATER_HEALING_SPRITE_ADJUSTMENT,
      restoringCurrent: LYRA_EARTH_HEALING_SPRITE_ADJUSTMENT,
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
      swiftWing: {
        xRatio: 0.76,
        yRatio: 0.5,
      },
      ironquill: {
        xRatio: 0.82,
        yRatio: 0.27,
      },
    },
    itemProjectileOrigin: {
      xRatio: 0.82,
      yRatio: 0.27,
    },
  },
};
