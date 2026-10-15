import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { applyCharacterHp } from "../src/game/ghost/ghostSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 41,
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

function chooseActions(state: CombatState) {
  let selections = createEmptyRoundSelections();

  for (const playerId of ["player1", "player2"] as const) {
    const characterId = state.players[playerId].controlledCharacterId;
    const character = state.characters[characterId];
    selections = selectPlayerAction(state, selections, {
      playerId,
      abilityId: character.form === "ghost" ? "ghostStrike" : "defend",
      targetId: character.form === "ghost" ? "enemy-1" : characterId,
    })!;
  }

  return selections;
}

test("the battle is lost when no living hero remains", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );
  state.characters["character-2"] = applyCharacterHp(
    state.characters["character-2"],
    0,
  );

  const result = resolveRound(state, chooseActions(state));

  assert.equal(result.nextState.phase, "defeat");
});

test("one Ghost and one living hero can continue fighting", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );

  const result = resolveRound(state, chooseActions(state));

  assert.equal(result.nextState.phase, "selectingActions");
});
