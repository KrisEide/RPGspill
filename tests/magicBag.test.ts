import assert from "node:assert/strict";
import test from "node:test";

import { resolveAbility } from "../src/game/abilities/abilityProgression";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveImmediateQuickAbility } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup, Inventory } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 773,
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

function itemCount(inventory: Inventory) {
  return Object.values(inventory).reduce((total, quantity) => total + quantity, 0);
}

test("Magic Bag is a seven PP Quick ability limited to once per round", () => {
  const rankOne = resolveAbility("magicBag", 1)!;
  assert.equal(rankOne.ppCost, 7);
  assert.equal(rankOne.useTiming, "quickAction");

  const state = createInitialCombatState(setup);
  state.characters["character-1"].abilityRanks.magicBag = 1;
  const startingPp = state.characters["character-1"].pp;
  const startingItems = itemCount(state.characters["character-1"].inventory);
  const selected = selectPlayerAction(state, createEmptyRoundSelections(), {
    playerId: "player1",
    abilityId: "magicBag",
    targetId: "character-1",
  });

  assert.ok(selected);
  assert.equal(selected["character-1"].action, null);
  assert.equal(selected["character-1"].quickActions.length, 1);

  const result = resolveImmediateQuickAbility(
    state,
    selected["character-1"].quickActions[0]!,
  );
  assert.ok(result);
  assert.equal(result.nextState.characters["character-1"].pp, startingPp - 7);
  assert.equal(
    itemCount(result.nextState.characters["character-1"].inventory),
    startingItems + 1,
  );
  assert.equal(
    selectPlayerAction(result.nextState, createEmptyRoundSelections(), {
      playerId: "player1",
      abilityId: "magicBag",
      targetId: "character-1",
    }),
    null,
  );
});

test("Rank 2 Magic Bag guarantees two items", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].abilityRanks.magicBag = 2;
  const startingItems = itemCount(state.characters["character-1"].inventory);
  const result = resolveImmediateQuickAbility(state, {
    kind: "ability",
    actorId: "character-1",
    abilityId: "magicBag",
    targetId: "character-1",
  });

  assert.ok(result);
  assert.equal(
    itemCount(result.nextState.characters["character-1"].inventory),
    startingItems + 2,
  );
  const bagEvent = result.events.find(
    (event) => event.type === "support" && event.abilityId === "magicBag",
  );
  assert.equal(bagEvent?.type, "support");
  if (bagEvent?.type === "support") {
    assert.equal(bagEvent.gainedItemIds?.length, 2);
  }
});
