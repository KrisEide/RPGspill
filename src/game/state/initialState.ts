import { CHARACTER_PRESETS } from "../../data/presets";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { createEmptyRoundSelections } from "../combat/playerActions";
import { createEncounterEnemies } from "./encounterState";
import { createKnownSpirits } from "../../data/spirits";
import type {
  CharacterState,
  ClientBattleState,
  CombatState,
  CombatStats,
  GameSetup,
  PlayerSetup,
} from "../types";

function copyCombatStats(stats: CombatStats): CombatStats {
  return {
    ...stats,
    elementalPower: { ...stats.elementalPower },
  };
}

function createCharacterState(
  player: PlayerSetup,
  startingLevel: number,
): CharacterState {
  const preset = CHARACTER_PRESETS[player.character.presetId];
  const stats = copyCombatStats(preset.stats);

  return {
    ...player.character,
    instanceId: player.controlledCharacterId,
    ownerId: player.id,
    level: startingLevel,
    hp: stats.maxHp,
    pp: stats.maxPp,
    barrier: 0,
    stats,
    abilityRanks: { ...preset.startingAbilityRanks },
    spirits: createKnownSpirits(preset.startingSpiritIds),
    statuses: [],
  };
}

export function createInitialCombatState(setup: GameSetup): CombatState {
  const encounterId = setup.startingEncounterId ?? "forestAmbush";
  const startingLevel = ENCOUNTER_DEFINITIONS[encounterId].number;

  return {
    mode: setup.mode,
    encounterId,
    randomSeed: setup.randomSeed,
    round: 1,
    phase: "selectingActions",
    players: {
      player1: {
        id: setup.players.player1.id,
        controlledCharacterId: setup.players.player1.controlledCharacterId,
      },
      player2: {
        id: setup.players.player2.id,
        controlledCharacterId: setup.players.player2.controlledCharacterId,
      },
    },
    characters: {
      "character-1": createCharacterState(
        setup.players.player1,
        startingLevel,
      ),
      "character-2": createCharacterState(
        setup.players.player2,
        startingLevel,
      ),
    },
    enemies: createEncounterEnemies(encounterId),
    rewardOffers: null,
  };
}

export function createClientBattleState(
  combat: CombatState,
): ClientBattleState {
  return {
    combat,
    phase: combat.phase,
    roundSelections: createEmptyRoundSelections(),
    lastRoundEvents: [],
    pendingRound: null,
  };
}

export function createInitialGameState(setup: GameSetup): ClientBattleState {
  return createClientBattleState(createInitialCombatState(setup));
}
