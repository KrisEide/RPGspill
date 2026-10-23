import assert from "node:assert/strict";
import { test } from "node:test";

import { ABILITIES } from "../src/data/abilities";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { AbilityRank, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 416,
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

function useSacrificialStrike(rank: AbilityRank) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies[0] = {
    ...state.enemies[0],
    hp: 200,
    stats: { ...state.enemies[0].stats, maxHp: 200 },
  };
  state.characters["character-1"].hp = 50;
  state.characters["character-1"].barrier = 30;
  state.characters["character-1"].abilityRanks.sacrificialStrike = rank;

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "sacrificialStrike",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections);
}

test("Sacrificial Strike defines its stronger two-rank sacrifice", () => {
  const rankOne = ABILITIES.sacrificialStrike.ranks[1]!;
  const rankTwo = ABILITIES.sacrificialStrike.ranks[2]!;

  assert.deepEqual(rankOne.effects, [
    {
      type: "damage",
      damageType: "physical",
      basePower: 22,
      attackScaling: 1,
      elementalPowerScaling: 0,
      criticalHit: { chance: 0.05, damageMultiplier: 1.5 },
    },
    { type: "selfHpDamage", amount: 5, timing: "beforeDamage" },
  ]);
  assert.deepEqual(rankTwo.effects, [
    {
      type: "damage",
      damageType: "physical",
      basePower: 25,
      attackScaling: 1.1,
      elementalPowerScaling: 0,
      criticalHit: { chance: 0.05, damageMultiplier: 1.5 },
      statusOnHit: { statusId: "bleed" },
    },
    { type: "selfHpDamage", amount: 7, timing: "beforeDamage" },
  ]);
});

test("Rank 1 visibly pays 5 HP before attacking and bypasses Barrier", () => {
  const result = useSacrificialStrike(1);
  const selfDamageIndex = result.events.findIndex(
    (event) =>
      event.type === "selfDamage" &&
      event.abilityId === "sacrificialStrike",
  );
  const attackIndex = result.events.findIndex(
    (event) =>
      event.type === "damage" && event.abilityId === "sacrificialStrike",
  );
  const selfDamage = result.events[selfDamageIndex];

  assert.ok(selfDamage?.type === "selfDamage");
  assert.ok(selfDamageIndex >= 0 && selfDamageIndex < attackIndex);
  assert.equal(selfDamage.amount, 5);
  assert.equal(selfDamage.remainingHp, 45);
  assert.equal(result.nextState.characters["character-1"].barrier, 30);
});

test("Rank 2 pays 7 HP before attacking and always applies Bleed", () => {
  const result = useSacrificialStrike(2);
  const selfDamageIndex = result.events.findIndex(
    (event) =>
      event.type === "selfDamage" &&
      event.abilityId === "sacrificialStrike",
  );
  const attackIndex = result.events.findIndex(
    (event) =>
      event.type === "damage" && event.abilityId === "sacrificialStrike",
  );
  const selfDamage = result.events[selfDamageIndex];
  const attack = result.events[attackIndex];

  assert.ok(selfDamage?.type === "selfDamage");
  assert.ok(attack?.type === "damage");
  assert.ok(selfDamageIndex >= 0 && selfDamageIndex < attackIndex);
  assert.equal(selfDamage.amount, 7);
  assert.equal(selfDamage.remainingHp, 43);
  assert.ok(
    attack.statusChanges.some(
      (change) => change.type === "applied" && change.status.id === "bleed",
    ),
  );
});
