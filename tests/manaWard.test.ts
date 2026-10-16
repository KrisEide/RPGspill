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
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 829,
  startingEncounterId: "slimeTrail",
  players: {
    player1: {
      id: "player1",
      controlledCharacterId: "character-1",
      character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" },
    },
    player2: {
      id: "player2",
      controlledCharacterId: "character-2",
      character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" },
    },
  },
};

function castCinderCurse(withProtectedCasting = false) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].abilityRanks.cinderCurse = 1;
  state.characters["character-1"].passives = {
    manaWard: true,
    ...(withProtectedCasting ? { protectedCasting: true } : {}),
  };
  state.characters["character-1"].pp = 30;
  state.characters["character-1"].barrier = withProtectedCasting ? 1 : 0;

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "cinderCurse",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  return resolveRound(state, selections);
}

test("Mana Ward is a tagged passive that grants 6 Barrier", () => {
  const passive = PASSIVE_DEFINITIONS.manaWard;

  assert.ok(passive);
  assert.equal(PASSIVE_VALUES.manaWardBarrier, 6);
  assert.ok(passive.tags.includes("pp"));
  assert.ok(passive.tags.includes("barrier"));
});

test("Mana Ward grants Barrier when an 8 PP ability is used", () => {
  const result = castCinderCurse();
  const wardEvent = result.events.find(
    (event) => event.type === "manaWard" && event.actorId === "character-1",
  );

  assert.equal(result.nextState.characters["character-1"].pp, 22);
  assert.equal(result.nextState.characters["character-1"].barrier, 6);
  assert.ok(wardEvent && wardEvent.type === "manaWard");
  assert.equal(wardEvent.barrierAmount, 6);
  assert.equal(wardEvent.remainingBarrier, 6);
});

test("Mana Ward uses base PP cost when Protected Casting reduces the payment", () => {
  const result = castCinderCurse(true);

  assert.equal(result.nextState.characters["character-1"].pp, 23);
  assert.equal(result.nextState.characters["character-1"].barrier, 7);
  assert.ok(result.events.some((event) => event.type === "manaWard"));
});

test("Mana Ward does not trigger from an ability below 8 PP", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].abilityRanks.fireball = 1;
  state.characters["character-1"].passives = { manaWard: true };

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "fireball",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  const result = resolveRound(state, selections);

  assert.equal(result.nextState.characters["character-1"].barrier, 0);
  assert.ok(!result.events.some((event) => event.type === "manaWard"));
});

test("a charged ability triggers Mana Ward when PP is paid, not on release", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies[0].hp = 200;
  state.enemies[0].stats.maxHp = 200;
  state.characters["character-1"].abilityRanks.stonebreaker = 1;
  state.characters["character-1"].passives = { manaWard: true };

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "stonebreaker",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  const chargeRound = resolveRound(state, selections);
  assert.equal(
    chargeRound.events.filter((event) => event.type === "manaWard").length,
    1,
  );

  const releaseState = {
    ...chargeRound.nextState,
    enemyIntents: {},
  };
  const releaseRound = resolveRound(
    releaseState,
    createEmptyRoundSelections(),
  );

  assert.equal(
    releaseRound.events.filter((event) => event.type === "manaWard").length,
    0,
  );
});
