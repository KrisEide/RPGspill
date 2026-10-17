import assert from "node:assert/strict";
import test from "node:test";

import { createSpiritState } from "../src/data/spirits";
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
  randomSeed: 177,
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

test("Rank 2 Guard Dog counters the first attack blocked by Bodyguard for 12 damage", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = {
    guardDog: createSpiritState("guardDog", 2),
  };
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-1",
      targetIds: ["character-1"],
    },
  };
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "bodyguard",
    targetId: null,
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;

  const result = resolveRound(state, selections);
  const blockedHit = result.events.find(
    (event) =>
      event.type === "damage" &&
      event.actorId === "enemy-1" &&
      event.targetId === "character-1",
  );
  assert.equal(blockedHit?.type, "damage");
  assert.equal(blockedHit.amount, 0);
  assert.deepEqual(blockedHit.reflectedDamage?.passiveIds, ["guardDog"]);
  assert.equal(blockedHit.reflectedDamage?.amount, 12);
});
