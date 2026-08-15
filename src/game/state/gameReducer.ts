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
  PlayerId,
  RoundResult,
  StatusChange,
  SupportEvent,
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
  > & { remainingBarrier?: number },
): CombatState {
  const combatAfterDamage = isCharacterInstanceId(event.targetId)
    ? {
      ...state,
      characters: {
        ...state.characters,
        [event.targetId]: {
          ...state.characters[event.targetId],
          hp: event.remainingHp,
          barrier:
            event.remainingBarrier ??
            state.characters[event.targetId].barrier,
        },
      },
    }
    : {
        ...state,
        enemies: state.enemies.map((enemy) =>
          enemy.instanceId === event.targetId
            ? {
                ...enemy,
                hp: event.remainingHp,
                barrier: event.remainingBarrier ?? enemy.barrier,
              }
            : enemy,
        ),
      };

  return event.statusChanges.reduce((combat, change) => {
    const combatant = isCharacterInstanceId(change.combatantId)
      ? combat.characters[change.combatantId]
      : combat.enemies.find(
          (enemy) => enemy.instanceId === change.combatantId,
        );

    if (!combatant) {
      return combat;
    }

    const statuses =
      change.type === "removed"
        ? combatant.statuses.filter(
            (status) => status.id !== change.statusId,
          )
        : [
            ...combatant.statuses.filter(
              (status) => status.id !== change.status.id,
            ),
            change.status,
          ];

    if (isCharacterInstanceId(change.combatantId)) {
      return {
        ...combat,
        characters: {
          ...combat.characters,
          [change.combatantId]: {
            ...combat.characters[change.combatantId],
            statuses,
          },
        },
      };
    }

    return {
      ...combat,
      enemies: combat.enemies.map((enemy) =>
        enemy.instanceId === change.combatantId
          ? { ...enemy, statuses }
          : enemy,
      ),
    };
  }, combatAfterDamage);
}

function applyStatusChanges(
  state: CombatState,
  statusChanges: StatusChange[],
) {
  return statusChanges.reduce(
    (combat, change) =>
      applyDamageEvent(combat, {
        targetId: change.combatantId,
        remainingHp: isCharacterInstanceId(change.combatantId)
          ? combat.characters[change.combatantId].hp
          : (combat.enemies.find(
              (enemy) => enemy.instanceId === change.combatantId,
            )?.hp ?? 0),
        statusChanges: [change],
      }),
    state,
  );
}

function applySupportEvent(
  state: CombatState,
  event: SupportEvent,
): CombatState {
  const combatAfterSupport = {
    ...state,
    characters: {
      ...state.characters,
      [event.targetId]: {
        ...state.characters[event.targetId],
        hp: event.remainingHp,
        barrier: event.remainingBarrier,
      },
    },
  };

  return applyStatusChanges(combatAfterSupport, event.statusChanges);
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
    event.type === "damage" ||
    event.type === "statusDamage" ||
    event.type === "spiritDamage"
      ? applyDamageEvent(state.combat, event)
      : event.type === "support"
        ? applySupportEvent(state.combat, event)
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
