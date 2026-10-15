import assert from "node:assert/strict";
import { test } from "node:test";
import { ITEM_DEFINITIONS } from "../src/data/items";
import { resolveImmediateItemUse } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

function createSetup(randomSeed: number): GameSetup {
  return {
    mode: "singlePlayer",
    initialLoadout: "run",
    randomSeed,
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
}

function useSteelDart(randomSeed: number) {
  const state = createInitialCombatState(createSetup(randomSeed));
  state.characters["character-1"].inventory.steelDart = 1;
  state.enemies[0].stats.defense = 0;

  return resolveImmediateItemUse(state, {
    kind: "item",
    actorId: "character-1",
    itemId: "steelDart",
    targetId: "enemy-1",
  });
}

test("all damaging items use the normal 80-to-100-percent damage variance", () => {
  for (const itemId of [
    "throwingKnife",
    "blastBomb",
    "razorBomb",
    "steelDart",
    "fuseDart",
  ]) {
    const damageEffect = ITEM_DEFINITIONS[itemId].effects.find(
      (effect) => effect.type === "damage",
    );
    assert.equal(damageEffect?.usesDamageVariance, true);
  }

  const lowRoll = useSteelDart(0);
  const highRoll = useSteelDart(1_000);

  assert.ok(lowRoll);
  assert.ok(highRoll);
  assert.equal(lowRoll.event.impacts[0].damageAmount, 4);
  assert.equal(highRoll.event.impacts[0].damageAmount, 5);
});
