import assert from "node:assert/strict";
import test from "node:test";

import { ITEM_DEFINITIONS } from "../src/data/items";
import { resolveImmediateItemUse } from "../src/game/combat/resolveRound";
import {
  createItemRewardPool,
  grantEncounterItemRewards,
} from "../src/game/items/itemSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup, ItemId } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 711,
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

function countItems(pool: ItemId[]) {
  return pool.reduce<Partial<Record<ItemId, number>>>((counts, itemId) => {
    counts[itemId] = (counts[itemId] ?? 0) + 1;
    return counts;
  }, {});
}

test("the reward bag contains repeated common and uncommon items", () => {
  assert.deepEqual(countItems(createItemRewardPool()), {
    healingPotion: 6,
    elixir: 6,
    throwingKnife: 6,
    blastBomb: 3,
    razorBomb: 3,
    barrierFlask: 3,
    powerTonic: 3,
    cleansingTonic: 3,
    steelDart: 6,
    fuseDart: 3,
    mysteriousPotion: 2,
    phoenixTonic: 1,
  });
});

test("normal rewards and Lucky Haul both consume tokens from the same bag", () => {
  const normalState = createInitialCombatState(setup);
  const startingSize = normalState.characters["character-1"].remainingItemRewardPool.length;
  const normalResult = grantEncounterItemRewards(normalState, 100);

  assert.equal(normalResult.rewards["character-1"].length, 1);
  assert.equal(
    normalResult.state.characters["character-1"].remainingItemRewardPool.length,
    startingSize - 1,
  );

  let luckyResult: ReturnType<typeof grantEncounterItemRewards> | null = null;

  for (let seed = 1; seed <= 1_000; seed += 1) {
    const luckyState = createInitialCombatState(setup);
    luckyState.characters["character-1"].passives.luckyHaul = true;
    const result = grantEncounterItemRewards(luckyState, seed);

    if (result.rewards["character-1"].length === 2) {
      luckyResult = result;
      break;
    }
  }

  assert.ok(luckyResult, "expected to find a deterministic Lucky Haul trigger");
  assert.equal(
    luckyResult.state.characters["character-1"].remainingItemRewardPool.length,
    startingSize - 2,
  );
});

test("an empty reward bag refills before the next normal reward", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].remainingItemRewardPool = [];

  const result = grantEncounterItemRewards(state, 200);

  assert.equal(result.rewards["character-1"].length, 1);
  assert.equal(
    result.state.characters["character-1"].remainingItemRewardPool.length,
    createItemRewardPool().length - 1,
  );
});

test("Lucky Haul refills the bag if the normal reward takes its final token", () => {
  let luckyResult: ReturnType<typeof grantEncounterItemRewards> | null = null;

  for (let seed = 1; seed <= 1_000; seed += 1) {
    const state = createInitialCombatState(setup);
    state.characters["character-1"].remainingItemRewardPool = ["healingPotion"];
    state.characters["character-1"].passives.luckyHaul = true;
    const result = grantEncounterItemRewards(state, seed);

    if (result.rewards["character-1"].length === 2) {
      luckyResult = result;
      break;
    }
  }

  assert.ok(luckyResult, "expected to find a deterministic Lucky Haul trigger");
  assert.equal(luckyResult.rewards["character-1"][0], "healingPotion");
  assert.equal(
    luckyResult.state.characters["character-1"].remainingItemRewardPool.length,
    createItemRewardPool().length - 1,
  );
});

test("Cleansing Tonic is immediate, targets either hero, heals 10, and preserves buffs", () => {
  const definition = ITEM_DEFINITIONS.cleansingTonic;
  assert.equal(definition.target, "singleAlly");
  assert.equal(definition.useTiming, "quickAction");
  assert.equal(definition.resolutionTiming, "preRound");
  assert.equal(
    definition.effects.some(
      (effect) =>
        effect.type === "cleanse" && effect.includeDefenseReductions === true,
    ),
    true,
  );

  const state = createInitialCombatState(setup);
  state.characters["character-1"].inventory.cleansingTonic = 1;
  state.characters["character-2"].hp = 60;
  state.characters["character-2"].statuses = [
    {
      id: "bleed",
      sourceId: "enemy-1",
      appliedRound: 1,
      remainingRounds: 2,
    },
    {
      id: "cracked",
      sourceId: "enemy-1",
      appliedRound: 1,
      remainingRounds: 2,
    },
    {
      id: "goatDefenseBreak",
      sourceId: "enemy-1",
      appliedRound: 1,
      magnitude: 4,
    },
    {
      id: "empowered",
      sourceId: "character-1",
      appliedRound: 1,
      magnitude: 0.25,
    },
  ];

  const result = resolveImmediateItemUse(state, {
    kind: "item",
    actorId: "character-1",
    itemId: "cleansingTonic",
    targetId: "character-2",
  });

  assert.ok(result);
  assert.equal(result.nextState.characters["character-2"].hp, 70);
  assert.deepEqual(
    result.nextState.characters["character-2"].statuses.map((status) => status.id),
    ["empowered"],
  );
  assert.equal(result.event.impacts[0]?.healingAmount, 10);
  assert.deepEqual(result.event.impacts[0]?.statusChanges, [
    {
      type: "removed",
      combatantId: "character-2",
      statusId: "bleed",
    },
    {
      type: "removed",
      combatantId: "character-2",
      statusId: "cracked",
    },
    {
      type: "removed",
      combatantId: "character-2",
      statusId: "goatDefenseBreak",
    },
  ]);
});

test("Healing Potion restores 25 HP", () => {
  assert.deepEqual(ITEM_DEFINITIONS.healingPotion.effects, [
    { type: "restoreHp", amount: 25 },
  ]);
  assert.equal(ITEM_DEFINITIONS.healingPotion.shortDescription, "Restore 25 HP.");
});
