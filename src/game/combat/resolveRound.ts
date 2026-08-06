import { ABILITIES } from "../../data/actions";
import { calculateDamage } from "./calculateDamage";
import { applyDamageVariance } from "./damageVariance";
import { nextRandom } from "./random";
import {
  CHARACTER_ORDER,
  isCharacterInstanceId,
} from "../playerControl";
import type {
  CombatAction,
  CombatantId,
  CombatEvent,
  CombatState,
  RoundResult,
  RoundOutcomePhase,
  RoundSelections,
} from "../types";

function getCombatant(state: CombatState, id: CombatantId) {
  if (isCharacterInstanceId(id)) {
    return state.characters[id];
  }

  return state.enemies.find((enemy) => enemy.instanceId === id);
}

function updateHp(
  state: CombatState,
  id: CombatantId,
  hp: number,
): CombatState {
  if (isCharacterInstanceId(id)) {
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
  state: CombatState,
  id: CombatantId,
  amount: number,
): CombatState {
  if (amount === 0) {
    return state;
  }

  if (isCharacterInstanceId(id)) {
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

function createEnemyActions(state: CombatState): CombatAction[] {
  const livingCharacters = CHARACTER_ORDER.filter(
    (characterId) => state.characters[characterId].hp > 0,
  );

  if (livingCharacters.length === 0) {
    return [];
  }

  return state.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy, index) => ({
      actorId: enemy.instanceId,
      abilityId: enemy.abilityIds[0],
      targetId:
        livingCharacters[(state.round - 1 + index) % livingCharacters.length],
    }));
}

function getSelectedPlayerActions(selections: RoundSelections) {
  const actions: CombatAction[] = [];

  for (const characterId of CHARACTER_ORDER) {
    const action = selections[characterId];
    if (action) {
      actions.push(action);
    }
  }

  return actions;
}

export function resolveRound(
  state: CombatState,
  selections: RoundSelections,
): RoundResult {
  let nextState: CombatState = {
    ...state,
    characters: {
      "character-1": { ...state.characters["character-1"] },
      "character-2": { ...state.characters["character-2"] },
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

  const playersAlive = CHARACTER_ORDER.some(
    (characterId) => nextState.characters[characterId].hp > 0,
  );
  const enemiesAlive = nextState.enemies.some((enemy) => enemy.hp > 0);
  const phase: RoundOutcomePhase = !playersAlive
    ? "defeat"
    : !enemiesAlive
      ? "victory"
      : "selectingActions";

  return {
    nextState: {
      ...nextState,
      randomSeed,
      round: phase === "selectingActions" ? state.round + 1 : state.round,
      phase,
    },
    events,
  };
}
