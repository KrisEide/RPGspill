import assert from "node:assert/strict";
import { test } from "node:test";
import { SPIRIT_DEFINITIONS, createKnownSpirits, refreshSpiritActiveUses } from "../src/data/spirits";
import { createEmptyRoundSelections, selectPlayerAction, selectPlayerItem } from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { applyCharacterHp } from "../src/game/ghost/ghostSystem";
import { createDevelopmentSetup } from "../src/game/development/createDevelopmentSetup";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 818,
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

function chooseDefend(state: CombatState) {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: state.characters["character-1"].form === "ghost" ? "ghostStrike" : "defend",
    targetId: state.characters["character-1"].form === "ghost" ? "enemy-1" : "character-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return selections;
}

test("Phoenix defines a persistent automatic Rebirth and a modest healing passive", () => {
  const phoenix = SPIRIT_DEFINITIONS.phoenix;

  assert.equal(phoenix.automaticActive, true);
  assert.equal(phoenix.activeUsesPerEncounter, 1);
  assert.equal(phoenix.passive.roundStartHealing?.amount, 2);
  assert.equal(phoenix.passive.phoenixTonicReviveBonus?.amount, 10);
});

test("lethal damage spends Rebirth and leaves its owner living at 40 HP with 10 Barrier", () => {
  const state = createInitialCombatState(setup);
  const character = state.characters["character-1"];
  character.spirits = createKnownSpirits(["phoenix"]);
  character.statuses = [
    { id: "burn", sourceId: "enemy-1", appliedRound: 1, remainingRounds: 2 },
    { id: "weakened", sourceId: "enemy-1", appliedRound: 1 },
  ];

  const reborn = applyCharacterHp(character, 0);

  assert.equal(reborn.form, "living");
  assert.equal(reborn.hp, 40);
  assert.equal(reborn.barrier, 10);
  assert.equal(reborn.spirits.phoenix?.activeUsesRemaining, 0);
  assert.deepEqual(reborn.statuses.map((status) => status.id), ["weakened"]);

  const ghost = applyCharacterHp(reborn, 0);
  assert.equal(ghost.form, "ghost");
  assert.equal(ghost.hp, 30);
});

test("encounter refresh never restores a spent Phoenix Rebirth", () => {
  const spirits = createKnownSpirits(["phoenix"]);
  spirits.phoenix!.activeUsesRemaining = 0;

  assert.equal(refreshSpiritActiveUses(spirits).phoenix?.activeUsesRemaining, 0);
});

test("Phoenix heals its living owner for 2 at round start even after Rebirth is spent", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = createKnownSpirits(["phoenix"]);
  state.characters["character-1"].spirits.phoenix!.activeUsesRemaining = 0;
  state.characters["character-1"].hp = 50;
  state.enemyIntents = {};

  const result = resolveRound(state, chooseDefend(state));

  assert.equal(result.nextState.characters["character-1"].hp, 52);
});

test("Phoenix Rebirth resolves before Soul Link", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );
  state.characters["character-1"].hp = 50;
  state.characters["character-2"].spirits = createKnownSpirits(["phoenix"]);
  state.characters["character-2"].hp = 1;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };

  const result = resolveRound(state, chooseDefend(state));

  assert.equal(result.nextState.characters["character-2"].form, "living");
  assert.equal(result.nextState.characters["character-2"].hp, 40);
  assert.equal(result.nextState.characters["character-2"].spirits.phoenix?.activeUsesRemaining, 0);
  assert.equal(result.nextState.characters["character-1"].soulLinkActive, true);
  assert.equal(result.events.some((event) => event.type === "soulTransfer"), false);

  const damageIndex = result.events.findIndex(
    (event) => event.type === "damage" && event.targetId === "character-2",
  );
  const rebirthIndex = result.events.findIndex(
    (event) => event.type === "phoenixRebirth" && event.targetId === "character-2",
  );
  assert.ok(damageIndex >= 0);
  assert.equal(result.events[damageIndex].type === "damage" && result.events[damageIndex].remainingHp, 0);
  assert.equal(rebirthIndex, damageIndex + 1);
  const rebirth = result.events[rebirthIndex];
  assert.equal(rebirth.type, "phoenixRebirth");
  if (rebirth.type === "phoenixRebirth") {
    assert.equal(rebirth.remainingHp, 40);
    assert.equal(rebirth.remainingBarrier, 10);
    assert.equal(rebirth.phoenixActiveUsesRemaining, 0);
  }
});

test("lethal ongoing damage finishes before the Phoenix sequence and cleans damaging statuses", () => {
  const state = createInitialCombatState(setup);
  const character = state.characters["character-2"];
  character.spirits = createKnownSpirits(["phoenix"]);
  character.hp = 5;
  character.statuses = [
    {
      id: "burn",
      sourceId: "enemy-1",
      appliedRound: 1,
      remainingRounds: 2,
      tickBasePower: 99,
    },
  ];
  state.enemyIntents = {};

  const result = resolveRound(state, chooseDefend(state));
  const damageIndex = result.events.findIndex(
    (event) => event.type === "statusDamage" && event.targetId === "character-2",
  );
  const rebirthIndex = result.events.findIndex(
    (event) => event.type === "phoenixRebirth" && event.targetId === "character-2",
  );

  assert.ok(damageIndex >= 0);
  assert.equal(result.events[damageIndex].type === "statusDamage" && result.events[damageIndex].remainingHp, 0);
  assert.equal(rebirthIndex, damageIndex + 1);
  assert.equal(result.nextState.characters["character-2"].hp, 40);
  assert.equal(result.nextState.characters["character-2"].statuses.some((status) => status.id === "burn"), false);
});

test("lethal item HP loss also plays Rebirth after the item impact", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = createKnownSpirits(["phoenix"]);
  state.characters["character-1"].hp = 3;
  state.characters["character-1"].inventory.mysteriousPotion = 1;
  state.enemyIntents = {};

  let selections = createEmptyRoundSelections();
  selections = selectPlayerItem(state, selections, {
    playerId: "player1",
    itemId: "mysteriousPotion",
    targetId: "character-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;

  const result = resolveRound(state, selections);
  const itemIndex = result.events.findIndex(
    (event) => event.type === "itemUse" && event.itemId === "mysteriousPotion" && event.visualPhase === "impact",
  );
  const rebirthIndex = result.events.findIndex(
    (event) => event.type === "phoenixRebirth" && event.targetId === "character-1",
  );

  assert.ok(itemIndex >= 0);
  assert.equal(result.events[itemIndex].type === "itemUse" && result.events[itemIndex].impacts[0].remainingHp, 0);
  assert.equal(rebirthIndex, itemIndex + 1);
  assert.equal(result.nextState.characters["character-1"].hp, 40);
});

test("a Phoenix owner revives an ally with 40 HP using Phoenix Tonic", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = createKnownSpirits(["phoenix"]);
  state.characters["character-1"].inventory.phoenixTonic = 1;
  state.characters["character-2"] = applyCharacterHp(
    state.characters["character-2"],
    0,
  );
  state.enemyIntents = {};

  let selections = createEmptyRoundSelections();
  selections = selectPlayerItem(state, selections, {
    playerId: "player1",
    itemId: "phoenixTonic",
    targetId: "character-2",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "ghostStrike",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);

  assert.equal(result.nextState.characters["character-2"].form, "living");
  assert.equal(result.nextState.characters["character-2"].hp, 40);
});

test("the development Ghost toggle bypasses Rebirth without spending it", () => {
  const developmentSetup = createDevelopmentSetup("slimeTrail", 918, {}, true);
  const state = createInitialCombatState(developmentSetup);

  assert.equal(state.characters["character-1"].form, "ghost");
  assert.equal(state.characters["character-1"].spirits.phoenix?.activeUsesRemaining, 1);
});
