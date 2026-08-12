import type { EnemyDefinition, EnemyId } from "../game/types";

export const ENEMY_DEFINITIONS: Record<EnemyId, EnemyDefinition> = {
  level1Orc: {
    id: "level1Orc",
    name: "Orc",
    level: 1,
    isBoss: false,
    stats: {
      maxHp: 60,
      maxPp: 0,
      attack: 8,
      defense: 10,
      resistance: 10,
      agility: 6,
      elementalPower: {
        fire: 0,
        water: 0,
        earth: 0,
        wind: 0,
      },
    },
    abilityRanks: {
      autoAttack: 1,
    },
  },
  orcRaider: {
    id: "orcRaider",
    name: "Orc Raider",
    level: 1,
    isBoss: false,
    stats: {
      maxHp: 28,
      maxPp: 0,
      attack: 7,
      defense: 4,
      resistance: 2,
      agility: 8,
      elementalPower: {
        fire: 0,
        water: 0,
        earth: 0,
        wind: 0,
      },
    },
    abilityRanks: {
      gangStrike: 1,
    },
    passive: {
      name: "Strength in Numbers",
      description:
        "Gang Strike deals +1 damage for each other Orc Raider alive.",
    },
  },
  orcMage: {
    id: "orcMage",
    name: "Orc Mage",
    level: 1,
    isBoss: false,
    stats: {
      maxHp: 80,
      maxPp: 30,
      attack: 8,
      defense: 5,
      resistance: 12,
      agility: 7,
      elementalPower: {
        fire: 0,
        water: 0,
        earth: 0,
        wind: 0,
      },
    },
    abilityRanks: {
      darkBolt: 1,
    },
  },
};
