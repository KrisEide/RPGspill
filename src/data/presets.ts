import type {
  AbilityId,
  CharacterId,
  CombatStats,
} from "../game/types";

export type CharacterPreset = {
  stats: CombatStats;
  startingAbilities: AbilityId[];
};

function createStartingStats(): CombatStats {
  return {
    maxHp: 100,
    maxPp: 50,
    attack: 10,
    defense: 10,
    agility: 10,
    elementalPower: {
      fire: 10,
      water: 10,
      earth: 10,
      wind: 10,
    },
  };
}

export const CHARACTER_PRESETS = {
  char1: {
    stats: createStartingStats(),
    startingAbilities: ["autoAttack"],
  },
  char2: {
    stats: createStartingStats(),
    startingAbilities: ["autoAttack"],
  },
} satisfies Record<CharacterId, CharacterPreset>;
