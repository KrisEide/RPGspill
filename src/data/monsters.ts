import type { EnemyDefinition, EnemyId } from "../game/types";

export const ENEMY_DEFINITIONS = {
  level1Orc: {
    id: "level1Orc",
    name: "Orc",
    level: 1,
    stats: {
      maxHp: 60,
      maxPp: 0,
      attack: 8,
      defense: 10,
      agility: 6,
      elementalPower: {
        fire: 0,
        water: 0,
        earth: 0,
        wind: 0,
      },
    },
    abilityIds: ["autoAttack"],
  },
} satisfies Record<EnemyId, EnemyDefinition>;
