import assert from "node:assert/strict";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { PASSIVE_VALUES } from "../src/game/passives/passiveSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type {
  AbilityId,
  CombatState,
  GameSetup,
  PassiveId,
} from "../src/game/types";

const tailwindId = "tailwind" as PassiveId;
const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 4821,
  startingEncounterId: "slimeTrail",
  players: {
    player1: {
      id: "player1",
      controlledCharacterId: "character-1",
      character: {
        name: "Rowan",
        presetId: "char1",
        portraitId: "c1p1",
      },
    },
    player2: {
      id: "player2",
      controlledCharacterId: "character-2",
      character: {
        name: "Lyra",
        presetId: "char2",
        portraitId: "c2p1",
      },
    },
  },
};

function createState(abilityId: AbilityId, tailwindActive = false) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].passives = { [tailwindId]: true };
  state.characters["character-1"].abilityRanks[abilityId] = 1;
  state.characters["character-1"].passiveCombatState = {
    ...state.characters["character-1"].passiveCombatState,
    tailwindActive,
  };
  state.enemies[0].hp = 500;
  state.enemies[0].stats.maxHp = 500;
  return state;
}

function useAbility(state: CombatState, abilityId: AbilityId) {
  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId,
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);
  return resolveRound(state, selections);
}

function firstDamage(result: ReturnType<typeof resolveRound>) {
  const event = result.events.find(
    (candidate) =>
      candidate.type === "damage" &&
      candidate.actorId === "character-1",
  );
  assert.ok(event && event.type === "damage");
  return event;
}

test("Tailwind is a tagged non-stacking Wind critical passive", () => {
  const passive = PASSIVE_DEFINITIONS[tailwindId];

  assert.equal(PASSIVE_VALUES.tailwindDamageBonus, 0.25);
  assert.equal(passive.category, "wind");
  assert.ok(passive.tags.includes("wind"));
  assert.ok(passive.tags.includes("crit"));
  assert.match(passive.description, /next Wind ability/i);
});

test("a critical hit readies Tailwind for the next Wind ability", () => {
  const state = createState("autoAttack");
  state.characters["character-1"].stats.criticalChance = 1;
  const result = useAbility(state, "autoAttack");

  assert.equal(
    result.nextState.characters["character-1"].passiveCombatState
      .tailwindActive,
    true,
  );
  assert.equal(
    result.events.filter(
      (event) => event.type === "tailwind" && event.active,
    ).length,
    1,
  );
});

test("Tailwind empowers the whole next Wind ability and is consumed", () => {
  const normalState = createState("windSlash");
  normalState.characters["character-1"].stats.criticalChance = -1;
  const empoweredState = structuredClone(normalState);
  empoweredState.characters["character-1"].passiveCombatState.tailwindActive =
    true;

  const normal = useAbility(normalState, "windSlash");
  const empowered = useAbility(empoweredState, "windSlash");

  assert.equal(
    firstDamage(empowered).amount,
    Math.round(firstDamage(normal).amount * 1.25),
  );
  assert.equal(
    empowered.nextState.characters["character-1"].passiveCombatState
      .tailwindActive,
    false,
  );
  assert.ok(
    empowered.events.some(
      (event) => event.type === "tailwind" && !event.active,
    ),
  );
});

test("a critical empowered Wind ability immediately readies Tailwind again", () => {
  const state = createState("windSlash", true);
  state.characters["character-1"].stats.criticalChance = 1;
  const result = useAbility(state, "windSlash");

  assert.equal(firstDamage(result).isCritical, true);
  assert.equal(
    result.nextState.characters["character-1"].passiveCombatState
      .tailwindActive,
    true,
  );
  assert.ok(
    result.events.some(
      (event) => event.type === "tailwind" && event.rearmed,
    ),
  );
});
