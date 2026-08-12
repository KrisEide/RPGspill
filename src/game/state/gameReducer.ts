import { resolveRound } from "../combat/resolveRound";
import {
  areAllLivingPlayersReady,
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../combat/playerActions";
import { isCharacterInstanceId } from "../playerControl";
import type {
  AbilityId,
  ClientBattleState,
  CombatState,
  CombatantId,
  DamageEvent,
  StatusChange,
  PlayerId,
  RoundResult,
} from "../types";

export type GameAction =
  | {
      type: "submitPlayerAction";
      playerId: PlayerId;
      abilityId: AbilityId;
      targetId: CombatantId | null;
    }
  | {
      type: "applyCurrentCombatEvent";
    }
  | {
      type: "advanceCombatEvent";
    }
  | {
      type: "receiveRoundResult";
      result: RoundResult;
    }
  | {
      type: "startEncounter";
      combatState: CombatState;
    };

export function gameReducer(
  state: ClientBattleState,
  action: GameAction,
): ClientBattleState {
  if (action.type === "applyCurrentCombatEvent") {
    return applyCurrentCombatEvent(state);
  }

  if (action.type === "advanceCombatEvent") {
    return advanceCombatEvent(state);
  }

  if (action.type === "receiveRoundResult") {
    return beginRoundAnimation(state, action.result);
  }

  if (action.type === "startEncounter") {
    return {
      combat: action.combatState,
      phase: action.combatState.phase,
      roundSelections: createEmptyRoundSelections(),
      lastRoundEvents: [],
      pendingRound: null,
    };
  }

  if (state.phase !== "selectingActions") {
    return state;
  }

  const roundSelections = selectPlayerAction(
    state.combat,
    state.roundSelections,
    action,
  );

  if (!roundSelections) {
    return state;
  }

  if (areAllLivingPlayersReady(state.combat, roundSelections)) {
    const result = resolveRound(state.combat, roundSelections);
    return beginRoundAnimation(
      { ...state, roundSelections },
      result,
    );
  }

  return {
    ...state,
    roundSelections,
  };
}

function beginRoundAnimation(
  state: ClientBattleState,
  result: RoundResult,
): ClientBattleState {
  if (state.phase !== "selectingActions") {
    return state;
  }

  if (result.events.length === 0) {
    return {
      ...state,
      combat: result.nextState,
      phase: result.nextState.phase,
      roundSelections: createEmptyRoundSelections(),
      lastRoundEvents: [],
      pendingRound: null,
    };
  }

  return {
    ...state,
    phase: "animating",
    lastRoundEvents: [],
    pendingRound: {
      result,
      nextEventIndex: 0,
      currentEventApplied: false,
    },
  };
}

function applyDamageEvent(
  state: CombatState,
  event: Pick<
    DamageEvent,
    "targetId" | "remainingHp" | "statusChanges"
  >,
): CombatState {
  const applyStatusChanges = (
    statuses: CombatState["enemies"][number]["statuses"],
    changes: StatusChange[],
  ) =>
    changes.reduce((nextStatuses, change) => {
      if (change.type === "removed") {
        return nextStatuses.filter(
          (status) => status.id !== change.statusId,
        );
      }

      return [
        ...nextStatuses.filter(
          (status) => status.id !== change.status.id,
        ),
        change.status,
      ];
    }, statuses);

  if (isCharacterInstanceId(event.targetId)) {
    return {
      ...state,
      characters: {
        ...state.characters,
        [event.targetId]: {
          ...state.characters[event.targetId],
          hp: event.remainingHp,
          statuses: applyStatusChanges(
            state.characters[event.targetId].statuses,
            event.statusChanges,
          ),
        },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === event.targetId
        ? {
            ...enemy,
            hp: event.remainingHp,
            statuses: applyStatusChanges(
              enemy.statuses,
              event.statusChanges,
            ),
          }
        : enemy,
    ),
  };
}

function applyCurrentCombatEvent(
  state: ClientBattleState,
): ClientBattleState {
  const pendingRound = state.pendingRound;

  if (
    !pendingRound ||
    pendingRound.currentEventApplied ||
    state.phase !== "animating"
  ) {
    return state;
  }

  const event = pendingRound.result.events[pendingRound.nextEventIndex];

  if (!event) {
    return finishRound(state);
  }

  const combatAfterEvent =
    event.type === "damage"
      ? applyDamageEvent(state.combat, event)
      : event.type === "multiTargetDamage"
        ? event.impacts.reduce(
            (combat, impact) => applyDamageEvent(combat, impact),
            state.combat,
          )
      : state.combat;

  return {
    ...state,
    combat: combatAfterEvent,
    lastRoundEvents: pendingRound.result.events.slice(
      0,
      pendingRound.nextEventIndex + 1,
    ),
    pendingRound: {
      ...pendingRound,
      currentEventApplied: true,
    },
  };
}

function advanceCombatEvent(state: ClientBattleState): ClientBattleState {
  const pendingRound = state.pendingRound;

  if (
    !pendingRound ||
    !pendingRound.currentEventApplied ||
    state.phase !== "animating"
  ) {
    return state;
  }

  const nextEventIndex = pendingRound.nextEventIndex + 1;

  if (nextEventIndex >= pendingRound.result.events.length) {
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

function finishRound(state: ClientBattleState): ClientBattleState {
  const pendingRound = state.pendingRound;

  if (!pendingRound) {
    return state;
  }

  return {
    ...state,
    combat: pendingRound.result.nextState,
    phase: pendingRound.result.nextState.phase,
    roundSelections: createEmptyRoundSelections(),
    lastRoundEvents: pendingRound.result.events,
    pendingRound: null,
  };
}
