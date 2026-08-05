import { ABILITIES } from "../../data/actions";
import { calculateDamage } from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { nextRandom } from "./random";
import type {
  CombatAction,
  CombatantId,
  CombatEvent,
  GameState,
  PlayerId,
  RoundOutcomePhase,
  RoundSelections,
} from "../types";

const PLAYER_ORDER: PlayerId[] = ["player1", "player2"];

function isPlayerId(id: CombatantId): id is PlayerId {
  return id === "player1" || id === "player2";
}

function getCombatant(state: GameState, id: CombatantId) {
  if (isPlayerId(id)) {
    return state.characters[id];
  }

  return state.enemies.find((enemy) => enemy.instanceId === id);
}

function updateHp(state: GameState, id: CombatantId, hp: number): GameState {
  if (isPlayerId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...character, hp },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, hp } : enemy,
    ),
  };
}

function spendPp(
  state: GameState,
  id: CombatantId,
  amount: number,
): GameState {
  if (amount === 0) {
    return state;
  }

  if (isPlayerId(id)) {
    const character = state.characters[id];
    return {
      ...state,
      characters: {
        ...state.characters,
        [id]: { ...character, pp: character.pp - amount },
      },
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === id ? { ...enemy, pp: enemy.pp - amount } : enemy,
    ),
  };
}

function createEnemyActions(state: GameState): CombatAction[] {
  const livingPlayers = PLAYER_ORDER.filter(
    (playerId) => state.characters[playerId].hp > 0,
  );

  if (livingPlayers.length === 0) {
    return [];
  }

  return state.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy, index) => ({
      actorId: enemy.instanceId,
      abilityId: enemy.abilityIds[0],
      targetId: livingPlayers[(state.round - 1 + index) % livingPlayers.length],
    }));
}

function getSelectedPlayerActions(selections: RoundSelections) {
  const actions: CombatAction[] = [];

  for (const playerId of PLAYER_ORDER) {
    const action = selections[playerId];
    if (action) {
      actions.push(action);
    }
  }

  return actions;
}

export function resolveRound(
  state: GameState,
  selections: RoundSelections,
): GameState {
  let nextState: GameState = {
    ...state,
    characters: {
      player1: { ...state.characters.player1 },
      player2: { ...state.characters.player2 },
    },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
  };

  const actions = [
    ...getSelectedPlayerActions(selections),
    ...createEnemyActions(state),
  ]
    .map((action, originalOrder) => ({
      action,
      originalOrder,
      agility: getCombatant(state, action.actorId)?.stats.agility ?? 0,
    }))
    .sort(
      (first, second) =>
        second.agility - first.agility ||
        first.originalOrder - second.originalOrder,
    );

  const events: CombatEvent[] = [];
  let randomSeed = state.randomSeed;

  for (const { action } of actions) {
    const actor = getCombatant(nextState, action.actorId);
    const target = getCombatant(nextState, action.targetId);
    const ability = ABILITIES[action.abilityId];

    if (!actor || actor.hp <= 0 || !target || target.hp <= 0) {
      continue;
    }

    if (!actor.abilityIds.includes(action.abilityId) || actor.pp < ability.ppCost) {
      continue;
    }

    nextState = spendPp(nextState, action.actorId, ability.ppCost);

    for (const effect of ability.effects) {
      const currentTarget = getCombatant(nextState, action.targetId);
      if (!currentTarget || currentTarget.hp <= 0) {
        break;
      }

      const normalDamage = calculateDamage({
        attacker: actor.stats,
        defender: currentTarget.stats,
        element: ability.element,
        effect,
      });
      const varianceResult = nextRandom(randomSeed);
      randomSeed = varianceResult.nextSeed;
      let isCritical = false;
      let amount = applyDamageVariance(normalDamage, varianceResult.value);

      if (effect.criticalHit) {
        const randomResult = nextRandom(randomSeed);
        randomSeed = randomResult.nextSeed;
        isCritical = randomResult.value < effect.criticalHit.chance;

        if (isCritical) {
          amount = Math.round(amount * effect.criticalHit.damageMultiplier);
        }
      }

      const remainingHp = Math.max(0, currentTarget.hp - amount);

      nextState = updateHp(nextState, action.targetId, remainingHp);
      events.push({
        type: "damage",
        actorId: action.actorId,
        targetId: action.targetId,
        abilityId: action.abilityId,
        amount,
        remainingHp,
        isCritical,
      });
    }
  }

  const playersAlive = PLAYER_ORDER.some(
    (playerId) => nextState.characters[playerId].hp > 0,
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const phase: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  return {
    ...nextState,
    randomSeed,
    round: phase === "selectingActions" ? state.round + 1 : state.round,
    phase,
    roundSelections: {
      player1: null,
      player2: null,
    },
    lastRoundEvents: events,
  };
}
