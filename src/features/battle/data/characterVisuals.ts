import rowanIdleSprite from "../../../assets/sprites/characters/karakter1_2.png";
import rowanAutoAttackSprite from "../../../assets/sprites/characters/karakter1_autoattack.png";
import lyraIdleSprite from "../../../assets/sprites/characters/karakter2_1.png";
import lyraAutoAttackSprite from "../../../assets/sprites/characters/karakter2_autoattack.png";
import type { CharacterPresetId } from "../../../game/types";

type CharacterVisualDefinition = {
  idleSpriteSrc: string;
  autoAttackSpriteSrc: string;
};

export const CHARACTER_VISUALS = {
  char1: {
    idleSpriteSrc: rowanIdleSprite,
    autoAttackSpriteSrc: rowanAutoAttackSprite,
  },
  char2: {
    idleSpriteSrc: lyraIdleSprite,
    autoAttackSpriteSrc: lyraAutoAttackSprite,
  },
} satisfies Record<CharacterPresetId, CharacterVisualDefinition>;
