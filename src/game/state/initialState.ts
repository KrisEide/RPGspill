import { CHARACTER_PRESETS } from "../../data/presets";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { createEmptyRoundSelections } from "../combat/playerActions";
import { createEncounterEnemies } from "./encounterState";
import { createKnownSpirits } from "../../data/spirits";
import { createKnownPassives } from "../../data/passives";
import { prepareRoundTurnPriorities } from "../combat/spiritTurnPriority";
import {
  createEmptyInventory,
  createItemRewardPool,
  createTestingInventory,
} from "../items/itemSystem";
import type {
  CharacterState,
  ClientBattleState,
  CombatState,
  CombatStats,
  GameSetup,
  InitialLoadout,
  KnownAbilities,
  PlayerSetup,
} from "../types";

const RUN_STARTING_ABILITY_RANKS = {
  autoAttack: 1,
  defend: 1,
} satisfies KnownAbilities;

function copyCombatStats(stats: CombatStats): CombatStats {
  return {
    ...stats,
    elementalPower: { ...stats.elementalPower },
  };
}

function createCharacterState(
  player: PlayerSetup,
  startingLevel: number,
  initialLoadout: InitialLoadout,
  developmentPassiveIds: Parameters<typeof createKnownPassives>[0],
): CharacterState {
  const preset = CHARACTER_PRESETS[player.character.presetId];
  const stats = copyCombatStats(preset.stats);
  const usesDevelopmentLoadout = initialLoadout === "development";

  return {
    ...player.character,
    instanceId: player.controlledCharacterId,
    ownerId: player.id,
    level: startingLevel,
    hp: stats.maxHp,
    pp: stats.maxPp,
    barrier: 0,
    stats,
    abilityRanks: usesDevelopmentLoadout
      ? { ...preset.developmentAbilityRanks }
      : { ...RUN_STARTING_ABILITY_RANKS },
    passives: createKnownPassives(
      usesDevelopmentLoadout ? developmentPassiveIds : [],
    ),
    passiveCombatState: { firstHealUsed: false },
    spirits: createKnownSpirits(
      usesDevelopmentLoadout ? preset.developmentSpiritIds : [],
    ),
    inventory: usesDevelopmentLoadout
      ? createTestingInventory()
      : createEmptyInventory(),
    remainingItemRewardPool: createItemRewardPool(),
    itemDamageBonus: null,
    abilityDamageBonus: null,
    statuses: [],
  };
}

export function createInitialCombatState(setup: GameSetup): CombatState {
  const encounterId = setup.startingEncounterId ?? "forestAmbush";
  const startingLevel = ENCOUNTER_DEFINITIONS[encounterId].number;

  return prepareRoundTurnPriorities({
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
        setup.initialLoadout,
        setup.developmentPassives?.["character-1"] ?? [],
      ),
      "character-2": createCharacterState(
        setup.players.player2,
        startingLevel,
        setup.initialLoadout,
        setup.developmentPassives?.["character-2"] ?? [],
      ),
    },
    enemies: createEncounterEnemies(encounterId),
    rewardOffers: null,
    itemRewards: null,
  });
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
