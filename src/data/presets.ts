import type {
  CharacterPresetId,
  CombatStats,
  KnownAbilities,
  SpiritId,
} from "../game/types";

export type CharacterPreset = {
  stats: CombatStats;
  developmentAbilityRanks: KnownAbilities;
  developmentSpiritIds: SpiritId[];
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
    developmentAbilityRanks: {
      autoAttack: 1,
      defend: 1,
      fireball: 1,
      crashingWave: 1,
      healingTide: 1,
      stonebloom: 1,
      whirlwind: 1,
      windSlash: 1,
    },
    developmentSpiritIds: [
      "embertail",
      "stoneback",
      "swiftWing",
      "riverheart",
    ],
  },
  char2: {
    stats: createStartingStats(),
    developmentAbilityRanks: {
      autoAttack: 1,
      defend: 1,
      fireball: 1,
      crashingWave: 1,
      healingTide: 1,
      stonebloom: 1,
      whirlwind: 1,
      windSlash: 1,
    },
    developmentSpiritIds: [
      "embertail",
      "stoneback",
      "swiftWing",
      "riverheart",
    ],
  },
} satisfies Record<CharacterPresetId, CharacterPreset>;
