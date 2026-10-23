import {
  resolveImmediateQuickAbility,
  resolveImmediateWarhoundAutoAttack,
  resolveRound,
} from "../combat/resolveRound";
import {
  areAllLivingPlayersReady,
  createEmptyRoundSelections,
  selectPlayerItem,
  selectPlayerAction,
} from "../combat/playerActions";
import { isCharacterInstanceId } from "../playerControl";
import type {
  AbilityId,
  ClientBattleState,
  CombatState,
  CombatantId,
  DamageEvent,
  ItemId,
  ItemUseImpact,
  MultiTargetSupportImpact,
  PlayerId,
  RoundResult,
  ReflectedDamage,
  StatusChange,
  SupportEvent,
  CharacterEventState,
} from "../types";

export type GameAction =
  | {
      type: "resolveAutomaticRound";
    }
  | {
      type: "submitPlayerAction";
      playerId: PlayerId;
      abilityId: AbilityId;
      targetId: CombatantId | null;
      secondaryTargetId?: CombatantId | null;
    }
  | {
      type: "submitPlayerItem";
      playerId: PlayerId;
      itemId: ItemId;
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
    }
  | {
      type: "syncCombatState";
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
    return beginRoundAnimation(
      state,
      action.result,
      action.result.nextState.round === state.combat.round &&
        action.result.nextState.phase === "selectingActions",
    );
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

  if (action.type === "syncCombatState") {
    return {
      ...state,
      combat: action.combatState,
      phase: action.combatState.phase,
    };
  }

  if (state.phase !== "selectingActions") {
    return state;
  }

  if (action.type === "resolveAutomaticRound") {
    if (!areAllLivingPlayersReady(state.combat, state.roundSelections)) {
      return state;
    }

    return beginRoundAnimation(
      state,
      resolveRound(state.combat, state.roundSelections),
    );
  }

  if (action.type === "submitPlayerAction" && action.abilityId === "autoAttack") {
    const characterId =
      state.combat.players[action.playerId].controlledCharacterId;

    if (state.roundSelections[characterId].action === null) {
      const immediateResult = resolveImmediateWarhoundAutoAttack(
        state.combat,
        {
          kind: "ability",
          actorId: characterId,
          abilityId: "autoAttack",
          targetId: action.targetId,
        },
      );

      if (immediateResult) {
        return beginRoundAnimation(state, immediateResult, true);
      }
    }
  }

  const roundSelections =
    action.type === "submitPlayerItem"
      ? selectPlayerItem(state.combat, state.roundSelections, action)
      : selectPlayerAction(state.combat, state.roundSelections, action);

  if (!roundSelections) {
    return state;
  }

  if (action.type === "submitPlayerAction") {
    const characterId =
      state.combat.players[action.playerId].controlledCharacterId;
    const previousQuickActionCount =
      state.roundSelections[characterId].quickActions.length;
    const immediateAction =
      roundSelections[characterId].quickActions[previousQuickActionCount];

    if (immediateAction?.kind === "ability") {
      const immediateResult = resolveImmediateQuickAbility(
        state.combat,
        immediateAction,
      );

      if (immediateResult) {
        return beginRoundAnimation(state, immediateResult, true);
      }
    }
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
  preserveRoundSelections = false,
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
      preserveRoundSelections,
    },
  };
}

function applyDamageEvent(
  state: CombatState,
  event: Pick<
    DamageEvent,
    "targetId" | "remainingHp" | "statusChanges"
  > & {
    actorId?: DamageEvent["actorId"];
    actorHealingAmount?: number;
    actorRemainingHp?: number;
    actorCharacterState?: CharacterEventState;
    sourceId?: CombatantId;
    sourceHealingAmount?: number;
    sourceRemainingHp?: number;
    sourceCharacterState?: CharacterEventState;
    remainingBarrier?: number;
    reflectedDamage?: ReflectedDamage;
    characterState?: CharacterEventState;
  },
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
          ...(event.characterState ?? {}),
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

  const combatAfterStatuses = event.statusChanges.reduce((combat, change) => {
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
            (status) =>
              status.id !== change.statusId ||
              (change.sourceId !== undefined &&
                status.sourceId !== change.sourceId),
          )
        : [
            ...combatant.statuses.filter(
              (status) =>
                status.id !== change.status.id ||
                ((change.status.id === "cinderCurse" ||
                  change.status.id === "rootseed") &&
                  status.sourceId !== change.status.sourceId),
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

  const combatAfterCharacterSnapshot =
    isCharacterInstanceId(event.targetId) && event.characterState
      ? {
          ...combatAfterStatuses,
          characters: {
            ...combatAfterStatuses.characters,
            [event.targetId]: {
              ...combatAfterStatuses.characters[event.targetId],
              ...event.characterState,
              statuses:
                combatAfterStatuses.characters[event.targetId].statuses,
            },
          },
        }
      : combatAfterStatuses;

  const combatAfterReflection = event.reflectedDamage
    ? applyDamageEvent(combatAfterCharacterSnapshot, {
        targetId: event.reflectedDamage.targetId,
        remainingHp: event.reflectedDamage.remainingHp,
        remainingBarrier: event.reflectedDamage.remainingBarrier,
        statusChanges: event.reflectedDamage.statusChanges,
      })
    : combatAfterCharacterSnapshot;

  const combatAfterActorRecovery = event.actorId &&
    isCharacterInstanceId(event.actorId) &&
    event.actorRemainingHp !== undefined
    ? {
        ...combatAfterReflection,
        characters: {
          ...combatAfterReflection.characters,
          [event.actorId]: {
            ...combatAfterReflection.characters[event.actorId],
            hp: event.actorRemainingHp,
            ...(event.actorCharacterState ?? {}),
          },
        },
      }
    : combatAfterReflection;

  return event.sourceId &&
    isCharacterInstanceId(event.sourceId) &&
    event.sourceRemainingHp !== undefined
    ? {
        ...combatAfterActorRecovery,
        characters: {
          ...combatAfterActorRecovery.characters,
          [event.sourceId]: {
            ...combatAfterActorRecovery.characters[event.sourceId],
            hp: event.sourceRemainingHp,
            ...(event.sourceCharacterState ?? {}),
          },
        },
      }
    : combatAfterActorRecovery;
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

function applySupportImpact(
  state: CombatState,
  event: SupportEvent | MultiTargetSupportImpact,
): CombatState {
  const combatAfterSupport = isCharacterInstanceId(event.targetId)
    ? {
        ...state,
        characters: {
          ...state.characters,
          [event.targetId]: {
            ...state.characters[event.targetId],
            hp: event.remainingHp,
            barrier: event.remainingBarrier,
            pp: event.remainingPp ?? state.characters[event.targetId].pp,
            ...(event.characterState ?? {}),
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
                barrier: event.remainingBarrier,
              }
            : enemy,
        ),
      };

  const combatAfterActorCost =
    "actorId" in event &&
    isCharacterInstanceId(event.actorId) &&
    event.actorRemainingHp !== undefined
      ? {
          ...combatAfterSupport,
          characters: {
            ...combatAfterSupport.characters,
            [event.actorId]: {
              ...combatAfterSupport.characters[event.actorId],
              hp: event.actorRemainingHp,
              ...(event.actorCharacterState ?? {}),
            },
          },
        }
      : combatAfterSupport;

  const combatAfterItemGain =
    isCharacterInstanceId(event.targetId) &&
    event.gainedItemId &&
    event.gainedItemQuantity !== undefined
      ? {
          ...combatAfterActorCost,
          characters: {
            ...combatAfterActorCost.characters,
            [event.targetId]: {
              ...combatAfterActorCost.characters[event.targetId],
              inventory: {
                ...combatAfterActorCost.characters[event.targetId].inventory,
                [event.gainedItemId]: event.gainedItemQuantity,
              },
            },
          },
        }
      : combatAfterActorCost;

  return applyStatusChanges(combatAfterItemGain, event.statusChanges);
}

function applyItemImpact(
  state: CombatState,
  impact: ItemUseImpact,
): CombatState {
  const combatAfterValues = isCharacterInstanceId(impact.targetId)
    ? {
        ...state,
        characters: {
          ...state.characters,
          [impact.targetId]: {
            ...state.characters[impact.targetId],
            hp: impact.remainingHp,
            pp: impact.remainingPp,
            barrier: impact.remainingBarrier,
            ...(impact.characterState ?? {}),
          },
        },
      }
    : {
        ...state,
        enemies: state.enemies.map((enemy) =>
          enemy.instanceId === impact.targetId
            ? {
                ...enemy,
                hp: impact.remainingHp,
                pp: impact.remainingPp,
                barrier: impact.remainingBarrier,
              }
            : enemy,
        ),
      };

  return applyStatusChanges(combatAfterValues, impact.statusChanges);
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

  let combatAfterEvent =
    event.type === "postCombatRecovery"
      ? {
          ...state.combat,
          characters: event.impacts.reduce(
            (characters, impact) => ({
              ...characters,
              [impact.targetId]: {
                ...characters[impact.targetId],
                hp: impact.remainingHp,
                pp: impact.remainingPp,
              },
            }),
            state.combat.characters,
          ),
        }
      : event.type === "barrierRemoved"
      ? {
          ...state.combat,
          characters: event.impacts.reduce(
            (characters, impact) => ({
              ...characters,
              [impact.targetId]: {
                ...characters[impact.targetId],
                barrier: impact.remainingBarrier,
              },
            }),
            state.combat.characters,
          ),
        }
      : event.type === "bloodpact"
      ? {
          ...state.combat,
          characters: {
            ...state.combat.characters,
            [event.targetId]: {
              ...state.combat.characters[event.targetId],
              hp: event.remainingHp,
              barrier: event.remainingBarrier,
              ...event.characterState,
            },
          },
        }
      : event.type === "soulTransfer"
        ? {
            ...state.combat,
            characters: {
              ...state.combat.characters,
              [event.ghostId]: {
                ...state.combat.characters[event.ghostId],
                hp: event.ghostRemainingHp,
                ...event.ghostCharacterState,
              },
              [event.targetId]: {
                ...state.combat.characters[event.targetId],
                hp: event.targetRemainingHp,
                ...event.targetCharacterState,
              },
            },
          }
      : event.type === "phoenixRebirth"
        ? {
            ...state.combat,
            characters: {
              ...state.combat.characters,
              [event.targetId]: {
                ...state.combat.characters[event.targetId],
                hp: event.remainingHp,
                barrier: event.remainingBarrier,
                ...event.characterState,
                spirits: {
                  ...state.combat.characters[event.targetId].spirits,
                  phoenix: state.combat.characters[event.targetId].spirits.phoenix
                    ? {
                        ...state.combat.characters[event.targetId].spirits.phoenix,
                        activeUsesRemaining: event.phoenixActiveUsesRemaining,
                      }
                    : undefined,
                },
              },
            },
          }
      : event.type === "defend" && isCharacterInstanceId(event.targetId)
        ? {
            ...state.combat,
            characters: {
              ...state.combat.characters,
              [event.targetId]: {
                ...state.combat.characters[event.targetId],
                barrier: event.remainingBarrier,
              },
            },
          }
      : event.type === "manaWard"
        ? {
            ...state.combat,
            characters: {
              ...state.combat.characters,
              [event.targetId]: {
                ...state.combat.characters[event.targetId],
                barrier: event.remainingBarrier,
              },
            },
          }
      : event.type === "tailwind"
        ? {
            ...state.combat,
            characters: {
              ...state.combat.characters,
              [event.targetId]: {
                ...state.combat.characters[event.targetId],
                passiveCombatState: {
                  ...state.combat.characters[event.targetId]
                    .passiveCombatState,
                  tailwindActive: event.active,
                },
              },
            },
          }
      : event.type === "earthDemonSummoned"
        ? { ...state.combat, earthDemon: event.summon }
      : event.type === "enemySummoned"
        ? { ...state.combat, enemies: [...state.combat.enemies, ...event.summonedEnemies] }
      : event.type === "earthDemonHit"
        ? applyStatusChanges(
            {
              ...state.combat,
              earthDemon: state.combat.earthDemon && !event.destroyed
                ? { ...state.combat.earthDemon, hp: event.remainingHp }
                : null,
            },
            event.statusChanges,
          )
      : event.type === "earthDemonAttack"
        ? {
            ...state.combat,
            enemies: state.combat.enemies.map((enemy) =>
              enemy.instanceId === event.targetId
                ? {
                    ...enemy,
                    hp: event.remainingHp,
                    barrier: event.remainingBarrier,
                  }
                : enemy,
            ),
          }
      : event.type === "damage" ||
    event.type === "selfDamage" ||
    event.type === "statusDamage" ||
    event.type === "spiritDamage"
      ? applyDamageEvent(state.combat, event)
      : event.type === "support"
        ? applySupportImpact(state.combat, event)
        : event.type === "multiTargetSupport"
          ? event.impacts.reduce(
              (combat, impact) => applySupportImpact(combat, impact),
              state.combat,
            )
            : event.type === "multiTargetDamage"
            ? event.impacts.reduce(
                (combat, impact) => applyDamageEvent(combat, impact),
                state.combat,
              )
              : event.type === "itemUse"
                ? event.impacts.reduce(
                    (combat, impact) => applyItemImpact(combat, impact),
                    state.combat,
                  )
                : event.type === "wait"
                  ? (() => {
                      const combatAfterStatuses = applyStatusChanges(
                        state.combat,
                        event.statusChanges,
                      );
                      return {
                        ...combatAfterStatuses,
                        enemies: combatAfterStatuses.enemies.map((enemy) =>
                          enemy.instanceId === event.targetId &&
                          (event.remainingDefense !== undefined ||
                            event.remainingHp !== undefined)
                            ? {
                                ...enemy,
                                hp: event.remainingHp ?? enemy.hp,
                                stats: {
                                  ...enemy.stats,
                                  defense:
                                    event.remainingDefense ??
                                    enemy.stats.defense,
                                },
                              }
                            : enemy,
                        ),
                      };
                    })()
                : event.type === "wake" ||
                    event.type === "skipTurn" ||
                    event.type === "statusApplied" ||
                    event.type === "charge"
                  ? applyStatusChanges(state.combat, event.statusChanges)
                : state.combat;

  if (event.type === "damage" && event.linkedSupportImpact) {
    combatAfterEvent = applySupportImpact(
      combatAfterEvent,
      event.linkedSupportImpact,
    );

    if (event.linkedSecondarySupportImpacts) {
      combatAfterEvent = event.linkedSecondarySupportImpacts.reduce(
        (combat, impact) => applySupportImpact(combat, impact),
        combatAfterEvent,
      );
    }
  }

  if (
    (event.type === "support" || event.type === "multiTargetSupport" || event.type === "bloodpact") &&
    event.secondaryImpacts
  ) {
    combatAfterEvent = event.secondaryImpacts.reduce(
      (combat, impact) => applySupportImpact(combat, impact),
      combatAfterEvent,
    );
  }

  if (event.type === "itemUse") {
    combatAfterEvent = {
      ...combatAfterEvent,
      characters: {
        ...combatAfterEvent.characters,
        [event.actorId]: {
          ...combatAfterEvent.characters[event.actorId],
          inventory: {
            ...combatAfterEvent.characters[event.actorId].inventory,
            [event.itemId]: event.remainingQuantity,
          },
          itemDamageBonus: event.damageBonus,
        },
      },
    };
  }

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
    roundSelections: pendingRound.preserveRoundSelections
      ? state.roundSelections
      : createEmptyRoundSelections(),
    lastRoundEvents: pendingRound.result.events,
    pendingRound: null,
  };
}
