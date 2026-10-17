import assert from "node:assert/strict";
import { test } from "node:test";
import { ITEM_DEFINITIONS } from "../src/data/items";
import {
  createEmptyRoundSelections,
  selectPlayerItem,
} from "../src/game/combat/playerActions";
import {
  resolveImmediateItemUse,
  resolveRound,
} from "../src/game/combat/resolveRound";
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

test("damaging items use variance except Throwing Knife's fixed True damage", () => {
  for (const itemId of [
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

  const throwingKnifeDamage = ITEM_DEFINITIONS.throwingKnife.effects.find(
    (effect) => effect.type === "damage",
  );
  assert.equal(throwingKnifeDamage?.damageType, "true");
  assert.equal(throwingKnifeDamage?.usesDamageVariance, false);

  const lowRoll = useSteelDart(0);
  const highRoll = useSteelDart(1_000);

  assert.ok(lowRoll);
  assert.ok(highRoll);
  assert.equal(lowRoll.event.impacts[0].damageAmount, 4);
  assert.equal(highRoll.event.impacts[0].damageAmount, 5);
});

test("Throwing Knife deals exactly 30 damage regardless of defensive stats or roll", () => {
  for (const randomSeed of [0, 1_000]) {
    const state = createInitialCombatState(createSetup(randomSeed));
    state.enemyIntents = {};
    state.characters["character-1"].inventory.throwingKnife = 1;
    state.enemies[0].hp = 100;
    state.enemies[0].stats.maxHp = 100;
    state.enemies[0].stats.defense = 500;
    state.enemies[0].stats.resistance = 500;
    state.enemies[0].statuses = [
      {
        id: "bleed",
        sourceId: "character-1",
        appliedRound: 0,
        remainingRounds: 3,
        fullDurationRounds: 3,
        tickBasePower: 3,
      },
    ];
    state.characters["character-1"].passives = { bloodScent: true };

    const selections = selectPlayerItem(
      state,
      createEmptyRoundSelections(),
      {
        playerId: "player1",
        itemId: "throwingKnife",
        targetId: "enemy-1",
      },
    );
    assert.ok(selections);

    const result = resolveRound(state, selections);
    const event = result.events.find(
      (candidate) =>
        candidate.type === "itemUse" &&
        candidate.itemId === "throwingKnife",
    );

    assert.ok(event && event.type === "itemUse");
    assert.equal(event.impacts[0].damageAmount, 30);
  }
});
