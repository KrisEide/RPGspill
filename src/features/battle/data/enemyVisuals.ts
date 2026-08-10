import level1OrcSprite from "../../../assets/sprites/monsters/level1orc.png";
import level1OrcAutoAttackSprite from "../../../assets/sprites/monsters/level1orcattack.png";
import type { EnemyId } from "../../../game/types";

type EnemyVisualDefinition = {
  idleSpriteSrc: string;
  autoAttackSpriteSrc: string;
};

export const ENEMY_VISUALS = {
  level1Orc: {
    idleSpriteSrc: level1OrcSprite,
    autoAttackSpriteSrc: level1OrcAutoAttackSprite,
  },
} satisfies Record<EnemyId, EnemyVisualDefinition>;
