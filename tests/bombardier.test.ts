import assert from "node:assert/strict";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
import {
  createEmptyRoundSelections,
  selectPlayerItem,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { PASSIVE_VALUES } from "../src/game/passives/passiveSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup, ItemId } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 937,
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

function resolveItem(itemId: ItemId, hasBombardier: boolean) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].inventory[itemId] = 1;
  state.characters["character-1"].passives = hasBombardier
    ? { bombardier: true }
    : {};
  for (const enemy of state.enemies) {
    enemy.hp = 200;
    enemy.stats.maxHp = 200;
    enemy.stats.defense = 0;
    enemy.stats.resistance = 0;
  }

  const selections = selectPlayerItem(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      itemId,
      targetId: itemId === "throwingKnife" ? "enemy-1" : null,
    },
  );
  assert.ok(selections);

  const result = resolveRound(state, selections);
  const event = result.events.find(
    (candidate) => candidate.type === "itemUse" && candidate.itemId === itemId,
  );
  assert.ok(event && event.type === "itemUse");
  return event;
}

test("Bombardier is a tagged 35 percent bomb damage passive", () => {
  const passive = PASSIVE_DEFINITIONS.bombardier;

  assert.ok(passive);
  assert.equal(PASSIVE_VALUES.bombardierDamageBonus, 0.35);
  assert.deepEqual(passive.tags, ["items", "damage", "aoe"]);
});

test("Bombardier increases direct damage from both bombs", () => {
  for (const itemId of ["blastBomb", "razorBomb"] as const) {
    const normal = resolveItem(itemId, false);
    const empowered = resolveItem(itemId, true);

    assert.ok(
      empowered.impacts[0].damageAmount > normal.impacts[0].damageAmount,
      `${itemId} should deal more direct damage`,
    );
  }
});

test("Bombardier does not strengthen Razor Bomb's Bleed", () => {
  const normal = resolveItem("razorBomb", false);
  const empowered = resolveItem("razorBomb", true);
  const getBleed = (event: typeof normal) =>
    event.impacts[0].statusChanges.find(
      (change) => change.type === "applied" && change.status.id === "bleed",
    );

  assert.deepEqual(getBleed(empowered), getBleed(normal));
});

test("Bombardier does not increase other damaging items", () => {
  const normal = resolveItem("throwingKnife", false);
  const empowered = resolveItem("throwingKnife", true);

  assert.equal(
    empowered.impacts[0].damageAmount,
    normal.impacts[0].damageAmount,
  );
});
