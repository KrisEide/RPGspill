import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 77,
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

test("a normal single-target attack retargets when its selected enemy dies first", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies[0].hp = 1;
  state.characters["character-1"].stats.agility = 20;
  state.characters["character-2"].stats.agility = 10;

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);
  const attacks = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "autoAttack",
  );

  assert.equal(attacks.length, 2);
  assert.deepEqual(
    attacks.map((event) => [event.actorId, event.targetId]),
    [
      ["character-1", "enemy-1"],
      ["character-2", "enemy-2"],
    ],
  );
});
