import { CHARACTER_PRESETS } from "../../data/presets";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import type {
  CharacterState,
  CombatStats,
  EnemyId,
  EnemyInstanceId,
  EnemyState,
  GameSetup,
  GameState,
  PlayerSetup,
} from "../types";

function copyCombatStats(stats: CombatStats): CombatStats {
  return {
    ...stats,
    elementalPower: { ...stats.elementalPower },
  };
}

function createCharacterState(player: PlayerSetup): CharacterState {
  const preset = CHARACTER_PRESETS[player.character.characterId];
  const stats = copyCombatStats(preset.stats);

  return {
    ...player.character,
    ownerId: player.id,
    level: 1,
    hp: stats.maxHp,
    pp: stats.maxPp,
    stats,
    abilityIds: [...preset.startingAbilities],
  };
}

function createEnemyState(
  enemyId: EnemyId,
  instanceId: EnemyInstanceId,
): EnemyState {
  const definition = ENEMY_DEFINITIONS[enemyId];
  const stats = copyCombatStats(definition.stats);

  return {
    instanceId,
    enemyId: definition.id,
    name: definition.name,
    level: definition.level,
    hp: stats.maxHp,
    pp: stats.maxPp,
    stats,
    abilityIds: [...definition.abilityIds],
  };
}

export function createInitialGameState(setup: GameSetup): GameState {
  return {
    mode: setup.mode,
    randomSeed: setup.randomSeed,
    round: 1,
    phase: "selectingActions",
    characters: {
      player1: createCharacterState(setup.players.player1),
      player2: createCharacterState(setup.players.player2),
    },
    enemies: [createEnemyState("level1Orc", "enemy-1")],
    roundSelections: {
      player1: null,
      player2: null,
    },
    lastRoundEvents: [],
    pendingRound: null,
  };
}
