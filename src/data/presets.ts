import type {
  CharacterPresetId,
  CombatStats,
  KnownAbilities,
  SpiritId,
} from "../game/types";

export type CharacterPreset = {
  stats: CombatStats;
  startingAbilityRanks: KnownAbilities;
  startingSpiritIds: SpiritId[];
};

function createStartingStats(): CombatStats {
  return {
    maxHp: 100,
    maxPp: 50,
    criticalChance: 0,
    attack: 10,
    defense: 10,
    resistance: 10,
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
    startingAbilityRanks: {
      autoAttack: 1,
      defend: 1,
      fireball: 1,
      crashingWave: 1,
      healingTide: 1,
      stonebloom: 1,
      whirlwind: 1,
      windSlash: 1,
    },
    startingSpiritIds: ["embertail"],
  },
  char2: {
    stats: createStartingStats(),
    startingAbilityRanks: {
      autoAttack: 1,
      defend: 1,
      fireball: 1,
      crashingWave: 1,
      healingTide: 1,
      stonebloom: 1,
      whirlwind: 1,
      windSlash: 1,
    },
    startingSpiritIds: ["embertail"],
  },
} satisfies Record<CharacterPresetId, CharacterPreset>;
