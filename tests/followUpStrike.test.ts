import assert from "node:assert/strict";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
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
  randomSeed: 311,
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

function autoAttackWithFollowUp(defense = 0) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies = [state.enemies[0]];
  state.enemies[0].hp = 200;
  state.enemies[0].stats.maxHp = 200;
  state.enemies[0].stats.defense = defense;
  state.characters["character-1"].passives.followUpStrike = true;

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "autoAttack",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  return resolveRound(state, selections);
}

test("Follow-up Strike is an Auto Attack passive in the reward pool", () => {
  const passive = PASSIVE_DEFINITIONS.followUpStrike;

  assert.equal(passive.name, "Follow-up Strike");
  assert.ok(passive.tags.includes("physical"));
  assert.ok(passive.tags.includes("auto_attack"));
});

test("Follow-up Strike adds a weaker second hit to every Auto Attack", () => {
  const result = autoAttackWithFollowUp();
  const hits = result.events.filter(
    (event) =>
      event.type === "damage" &&
      event.actorId === "character-1" &&
      event.abilityId === "autoAttack",
  );

  assert.equal(hits.length, 2);
  assert.equal(hits[0].multiHitIndex, undefined);
  assert.equal(hits[1].multiHitIndex, 1);
  assert.ok(hits[1].amount < hits[0].amount);
});

test("enemy Defense reduces both Follow-up Strike hits separately", () => {
  const unarmoredResult = autoAttackWithFollowUp();
  const armoredResult = autoAttackWithFollowUp(10);
  const unarmoredHits = unarmoredResult.events.filter(
    (event) =>
      event.type === "damage" &&
      event.actorId === "character-1" &&
      event.abilityId === "autoAttack",
  );
  const armoredHits = armoredResult.events.filter(
    (event) =>
      event.type === "damage" &&
      event.actorId === "character-1" &&
      event.abilityId === "autoAttack",
  );

  assert.equal(armoredHits.length, 2);
  assert.ok(armoredHits[0].amount < unarmoredHits[0].amount);
  assert.ok(armoredHits[1].amount < unarmoredHits[1].amount);
});

test("Follow-up Strike does not activate Battle Rhythm twice", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies = [state.enemies[0]];
  state.enemies[0].hp = 200;
  state.enemies[0].stats.maxHp = 200;
  state.characters["character-1"].passives = {
    followUpStrike: true,
    battleRhythm: true,
  };
  state.characters["character-1"].pp = 10;

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "autoAttack",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  const result = resolveRound(state, selections);

  assert.equal(result.nextState.characters["character-1"].pp, 13);
});
