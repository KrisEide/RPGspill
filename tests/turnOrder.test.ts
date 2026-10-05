import assert from "node:assert/strict";
import { test } from "node:test";
import { createInitialCombatState } from "../src/game/state/initialState";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 1,
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

function createDefendSelections(state: ReturnType<typeof createInitialCombatState>) {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "defend",
    targetId: "character-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return selections;
}

test("equal Agility uses deterministic random order", () => {
  const firstActors = new Set<string>();

  for (const seed of [0, 1_000, 10_000, 100_000]) {
    const state = createInitialCombatState(setup);
    state.randomSeed = seed;
    state.enemyIntents = {};
    const selections = createDefendSelections(state);
    const firstResult = resolveRound(state, selections);
    const repeatedResult = resolveRound(state, selections);

    assert.deepEqual(firstResult, repeatedResult);
    firstActors.add(firstResult.events[0]?.actorId ?? "none");
  }

  assert.deepEqual(firstActors, new Set(["character-1", "character-2"]));
});

test("higher Agility still always acts first", () => {
  for (const seed of [0, 1_000, 10_000, 100_000]) {
    const state = createInitialCombatState(setup);
    state.randomSeed = seed;
    state.enemyIntents = {};
    state.characters["character-2"].stats.agility = 11;
    const result = resolveRound(state, createDefendSelections(state));

    assert.equal(result.events[0]?.actorId, "character-2");
  }
});
