import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTION_ABILITY_DEFINITIONS } from "../src/data/abilities/actions";
import { ITEM_DEFINITIONS, getItemUseProfile } from "../src/data/items";
import { getItemRewardWeight } from "../src/game/items/itemSystem";
import {
  createEmptyRoundSelections,
  selectPlayerItem,
} from "../src/game/combat/playerActions";
import {
  resolveImmediateItemUse,
  resolveRound,
} from "../src/game/combat/resolveRound";
import { applyCharacterHp } from "../src/game/ghost/ghostSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 403,
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

test("Ghost Heal restores 12 fixed Ghost HP", () => {
  assert.deepEqual(
    ACTION_ABILITY_DEFINITIONS.ghostHeal.ranks[1].effects,
    [{ type: "ghostHealing", amount: 12 }],
  );
});

test("Mysterious Potion is twice as likely as Phoenix Tonic but remains rare", () => {
  assert.equal(ITEM_DEFINITIONS.mysteriousPotion.rarity, "rare");
  assert.equal(ITEM_DEFINITIONS.mysteriousPotion.rewardWeight, 2);
  assert.equal(ITEM_DEFINITIONS.phoenixTonic.rewardWeight ?? 1, 1);
  assert.equal(getItemRewardWeight("mysteriousPotion"), 2);
  assert.equal(getItemRewardWeight("phoenixTonic"), 1);
});

test("Mysterious Potion hides its purpose while living and becomes Quick in Ghost Form", () => {
  const definition = ITEM_DEFINITIONS.mysteriousPotion;
  assert.equal(definition.description, "Its effect is unknown.");
  assert.equal(getItemUseProfile(definition, "living")?.useTiming, "action");
  assert.equal(getItemUseProfile(definition, "living")?.resolutionTiming, "turn");
  assert.equal(getItemUseProfile(definition, "ghost")?.useTiming, "quickAction");
  assert.equal(getItemUseProfile(definition, "ghost")?.resolutionTiming, "preRound");
});

test("a living hero consumes Mysterious Potion and loses 5 HP through Barrier", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].hp = 50;
  state.characters["character-1"].barrier = 20;
  state.characters["character-1"].inventory.mysteriousPotion = 1;
  state.enemyIntents = {};

  let selections = createEmptyRoundSelections();
  selections = selectPlayerItem(state, selections, {
    playerId: "player1",
    itemId: "mysteriousPotion",
    targetId: "character-1",
  })!;
  const result = resolveRound(state, selections);
  const event = result.events.find(
    (candidate) => candidate.type === "itemUse" && candidate.itemId === "mysteriousPotion",
  );

  assert.ok(event && event.type === "itemUse");
  assert.equal(event.impacts[0].damageAmount, 5);
  assert.equal(result.nextState.characters["character-1"].hp, 45);
  assert.equal(result.nextState.characters["character-1"].barrier, 20);
  assert.equal(result.nextState.characters["character-1"].inventory.mysteriousPotion, 0);
});

test("lethal living use enters Ghost Form through the normal item event", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].hp = 5;
  state.characters["character-1"].barrier = 20;
  state.characters["character-1"].inventory.mysteriousPotion = 1;
  state.enemyIntents = {};

  let selections = createEmptyRoundSelections();
  selections = selectPlayerItem(state, selections, {
    playerId: "player1",
    itemId: "mysteriousPotion",
    targetId: "character-1",
  })!;
  const result = resolveRound(state, selections);
  const event = result.events.find(
    (candidate) => candidate.type === "itemUse" && candidate.itemId === "mysteriousPotion",
  );

  assert.ok(event && event.type === "itemUse");
  assert.equal(event.impacts[0].characterState?.form, "ghost");
  assert.equal(result.nextState.characters["character-1"].form, "ghost");
  assert.equal(result.nextState.characters["character-1"].hp, 30);
  assert.equal(result.nextState.characters["character-1"].barrier, 0);
});

test("a Ghost consumes one Mysterious Potion for 10 HP and 10 Barrier", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );
  state.characters["character-1"].hp = 90;
  state.characters["character-1"].inventory.mysteriousPotion = 2;

  const result = resolveImmediateItemUse(state, {
    kind: "item",
    actorId: "character-1",
    itemId: "mysteriousPotion",
    targetId: "character-1",
  });

  assert.ok(result);
  assert.equal(result.nextState.characters["character-1"].hp, 100);
  assert.equal(result.nextState.characters["character-1"].barrier, 10);
  assert.equal(result.nextState.characters["character-1"].ghostReformReady, true);
  assert.equal(result.nextState.characters["character-1"].inventory.mysteriousPotion, 1);
  assert.equal(result.event.impacts[0].healingAmount, 10);
  assert.equal(result.event.impacts[0].barrierAmount, 10);

  const secondUse = resolveImmediateItemUse(result.nextState, {
    kind: "item",
    actorId: "character-1",
    itemId: "mysteriousPotion",
    targetId: "character-1",
  });
  assert.ok(secondUse);
  assert.equal(secondUse.nextState.characters["character-1"].hp, 110);
  assert.equal(secondUse.nextState.characters["character-1"].barrier, 20);
  assert.equal(secondUse.nextState.characters["character-1"].inventory.mysteriousPotion, 0);
  assert.equal(
    resolveImmediateItemUse(secondUse.nextState, {
      kind: "item",
      actorId: "character-1",
      itemId: "mysteriousPotion",
      targetId: "character-1",
    }),
    null,
  );
});

test("ordinary items remain unavailable to a Ghost", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );
  state.characters["character-1"].inventory.powerTonic = 1;

  assert.equal(
    resolveImmediateItemUse(state, {
      kind: "item",
      actorId: "character-1",
      itemId: "powerTonic",
      targetId: "character-1",
    }),
    null,
  );
});
