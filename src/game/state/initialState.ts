import { CHARACTER_PRESETS } from "../../data/presets";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { createEmptyRoundSelections } from "../combat/playerActions";
import { createEncounterEnemies } from "./encounterState";
import { createKnownSpirits } from "../../data/spirits";
import { createKnownPassives } from "../../data/passives";
import { createRestOffers } from "../../data/restChoices";
import { prepareRoundTurnPriorities } from "../combat/spiritTurnPriority";
import { prepareEnemyIntents } from "../combat/enemyIntents";
import { prepareBloodpactSelection } from "../combat/bloodpact";
import { applyCharacterHp } from "../ghost/ghostSystem";
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
  startInGhostForm: boolean,
): CharacterState {
  const preset = CHARACTER_PRESETS[player.character.presetId];
  const stats = copyCombatStats(preset.stats);
  const usesDevelopmentLoadout = initialLoadout === "development";

  const character: CharacterState = {
    ...player.character,
    instanceId: player.controlledCharacterId,
    ownerId: player.id,
    level: startingLevel,
    form: "living",
    hp: stats.maxHp,
    pp: stats.maxPp,
    savedLivingPp: null,
    ghostReformReady: false,
    soulLinkActive: false,
    barrier: 0,
    stats,
    abilityRanks: usesDevelopmentLoadout
      ? { ...preset.developmentAbilityRanks }
      : { ...RUN_STARTING_ABILITY_RANKS },
    ghostAbilityRanks: {},
    ghostUpgrades: {},
    passives: createKnownPassives(
      usesDevelopmentLoadout ? developmentPassiveIds : [],
    ),
    passiveCombatState: {
      firstHealUsed: false,
      tailwindActive: false,
      galeFocusLastUsedRound: null,
    },
    spirits: createKnownSpirits(
      usesDevelopmentLoadout ? preset.developmentSpiritIds : [],
    ),
    inventory: usesDevelopmentLoadout
      ? createTestingInventory()
      : createEmptyInventory(),
    remainingItemRewardPool: createItemRewardPool(),
    magicBagLastUsedRound: null,
    itemDamageBonus: null,
    abilityDamageBonus: null,
    statuses: [],
  };

  if (!usesDevelopmentLoadout || !startInGhostForm) {
    return character;
  }

  const forcedGhost = applyCharacterHp(
    { ...character, spirits: {} },
    0,
  );

  return { ...forcedGhost, spirits: character.spirits };
}

export function createInitialCombatState(setup: GameSetup): CombatState {
  const encounterId = setup.startingEncounterId ?? "slimeTrail";
  const encounter = ENCOUNTER_DEFINITIONS[encounterId];
  const startingLevel =
    Object.values(ENCOUNTER_DEFINITIONS).filter(
      (candidate) =>
        candidate.kind === "combat" &&
        candidate.number < encounter.number,
    ).length + 1;
  const isRest = encounter.kind === "rest";

  const initialState: CombatState = {
    mode: setup.mode,
    encounterId,
    randomSeed: setup.randomSeed,
    round: 1,
    phase: isRest ? "rest" : "selectingActions",
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
        setup.developmentStartInGhostForm ?? false,
      ),
      "character-2": createCharacterState(
        setup.players.player2,
        startingLevel,
        setup.initialLoadout,
        setup.developmentPassives?.["character-2"] ?? [],
        setup.developmentStartInGhostForm ?? false,
      ),
    },
    enemies: createEncounterEnemies(encounterId),
    enemyIntents: {},
    restStage: isRest ? "choice" : null,
    actTransitionStage: null,
    rewardOffers: isRest
      ? {
          "character-1": createRestOffers(encounterId),
          "character-2": createRestOffers(encounterId),
        }
      : null,
    itemRewards: null,
    earthDemon: null,
  };

  return isRest
    ? initialState
    : prepareBloodpactSelection(prepareEnemyIntents(prepareRoundTurnPriorities(initialState)));
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
