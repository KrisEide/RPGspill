import { resolveRound } from "../combat/resolveRound";
import type {
  AbilityId,
  CombatEvent,
  EnemyInstanceId,
  GameState,
  PlayerId,
} from "../types";

export type GameAction =
  | {
      type: "submitPlayerAction";
      playerId: PlayerId;
      abilityId: AbilityId;
      targetId: EnemyInstanceId;
    }
  | {
      type: "applyCurrentCombatEvent";
    }
  | {
      type: "advanceCombatEvent";
    };

const PLAYER_ORDER: PlayerId[] = ["player1", "player2"];

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "applyCurrentCombatEvent") {
    return applyCurrentCombatEvent(state);
  }

  if (action.type === "advanceCombatEvent") {
    return advanceCombatEvent(state);
  }

  if (state.phase !== "selectingActions") {
    return state;
  }

  const actor = state.characters[action.playerId];
  const target = state.enemies.find(
    (enemy) => enemy.instanceId === action.targetId,
  );

  if (
    actor.hp <= 0 ||
    state.roundSelections[action.playerId] !== null ||
    !actor.abilityIds.includes(action.abilityId) ||
    !target ||
    target.hp <= 0
  ) {
    return state;
  }

  const roundSelections = {
    ...state.roundSelections,
    [action.playerId]: {
      actorId: action.playerId,
      abilityId: action.abilityId,
      targetId: action.targetId,
    },
  };
  const allLivingPlayersReady = PLAYER_ORDER.every(
    (playerId) =>
      state.characters[playerId].hp <= 0 || roundSelections[playerId] !== null,
  );

  if (allLivingPlayersReady) {
    const resolvedState = resolveRound(state, roundSelections);
    const finalPhase = resolvedState.phase;

    if (finalPhase === "animating") {
      return state;
    }

    if (resolvedState.lastRoundEvents.length === 0) {
      return resolvedState;
    }

    return {
      ...state,
      phase: "animating",
      randomSeed: resolvedState.randomSeed,
      roundSelections,
      lastRoundEvents: [],
      pendingRound: {
        events: resolvedState.lastRoundEvents,
        nextEventIndex: 0,
        currentEventApplied: false,
        finalRound: resolvedState.round,
        finalPhase,
        finalCharacters: resolvedState.characters,
        finalEnemies: resolvedState.enemies,
      },
    };
  }

  return {
    ...state,
    roundSelections,
  };
}

function applyDamageEvent(state: GameState, event: CombatEvent): GameState {
  if (event.targetId === "player1" || event.targetId === "player2") {
    return {
      ...state,
      characters: {
        ...state.characters,
        [event.targetId]: {
          ...state.characters[event.targetId],
          hp: event.remainingHp,
        },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === event.targetId
        ? { ...enemy, hp: event.remainingHp }
        : enemy,
    ),
  };
}

function applyCurrentCombatEvent(state: GameState): GameState {
  const pendingRound = state.pendingRound;

  if (
    !pendingRound ||
    pendingRound.currentEventApplied ||
    state.phase !== "animating"
  ) {
    return state;
  }

  const event = pendingRound.events[pendingRound.nextEventIndex];

  if (!event) {
    return finishRound(state);
  }

  const stateAfterEvent = applyDamageEvent(state, event);

  return {
    ...stateAfterEvent,
    lastRoundEvents: pendingRound.events.slice(
      0,
      pendingRound.nextEventIndex + 1,
    ),
    pendingRound: {
      ...pendingRound,
      currentEventApplied: true,
    },
  };
}

function advanceCombatEvent(state: GameState): GameState {
  const pendingRound = state.pendingRound;

  if (
    !pendingRound ||
    !pendingRound.currentEventApplied ||
    state.phase !== "animating"
  ) {
    return state;
  }

  const nextEventIndex = pendingRound.nextEventIndex + 1;

  if (nextEventIndex >= pendingRound.events.length) {
    return finishRound(state);
  }

  return {
    ...state,
    pendingRound: {
      ...pendingRound,
      nextEventIndex,
      currentEventApplied: false,
    },
  };
}

function finishRound(state: GameState): GameState {
  const pendingRound = state.pendingRound;

  if (!pendingRound) {
    return state;
  }

  return {
    ...state,
    round: pendingRound.finalRound,
    phase: pendingRound.finalPhase,
    characters: pendingRound.finalCharacters,
    enemies: pendingRound.finalEnemies,
    roundSelections: {
      player1: null,
      player2: null,
    },
    lastRoundEvents: pendingRound.events,
    pendingRound: null,
  };
}
