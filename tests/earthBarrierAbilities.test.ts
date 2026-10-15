import assert from "node:assert/strict";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { AbilityId, AbilityRank, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 211,
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

function useEarthBarrierAbility(
  abilityId: AbilityId,
  rank: AbilityRank,
  targetId: "character-1" | "character-2" | null,
  barriers: [number, number] = [0, 0],
) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].abilityRanks[abilityId] = rank;
  state.characters["character-1"].pp = 50;
  state.characters["character-1"].barrier = barriers[0];
  state.characters["character-2"].barrier = barriers[1];

  const selections = selectPlayerAction(state, createEmptyRoundSelections(), {
    playerId: "player1",
    abilityId,
    targetId,
  });
  assert.ok(selections);

  return resolveRound(state, selections).nextState;
}

test("Stoneguard and Fortify define both ranks and enter Earth rewards", () => {
  const stoneguard = ABILITIES["stoneguard" as AbilityId];
  const fortify = ABILITIES["fortify" as AbilityId];

  assert.ok(stoneguard);
  assert.equal(stoneguard.target, "singleAlly");
  assert.equal(stoneguard.ranks[1].ppCost, 4);
  assert.deepEqual(stoneguard.ranks[1].effects, [
    { type: "barrier", amount: 12 },
  ]);
  assert.deepEqual(stoneguard.ranks[2]?.effects, [
    { type: "barrier", amount: 16, bonusIfNoBarrier: 4 },
  ]);

  assert.ok(fortify);
  assert.equal(fortify.target, "allAllies");
  assert.equal(fortify.ranks[1].ppCost, 7);
  assert.deepEqual(fortify.ranks[1].effects, [
    { type: "barrier", amount: 8 },
  ]);
  assert.deepEqual(fortify.ranks[2]?.effects, [
    { type: "barrier", amount: 11 },
  ]);

  for (const abilityId of ["stoneguard", "fortify"] as const) {
    const reward = ABILITY_REWARD_POOL.find(
      (candidate) => candidate.abilityId === abilityId,
    );
    assert.ok(reward);
    assert.ok(reward.tags.includes("earth"));
    assert.ok(reward.tags.includes("barrier"));
  }
});

test("Stoneguard grants its Rank 2 bonus only to a target without Barrier", () => {
  const rankOne = useEarthBarrierAbility(
    "stoneguard" as AbilityId,
    1,
    "character-2",
  );
  assert.equal(rankOne.characters["character-2"].barrier, 12);
  assert.equal(rankOne.characters["character-1"].pp, 46);

  const rankTwoWithoutBarrier = useEarthBarrierAbility(
    "stoneguard" as AbilityId,
    2,
    "character-2",
  );
  assert.equal(rankTwoWithoutBarrier.characters["character-2"].barrier, 20);

  const rankTwoWithBarrier = useEarthBarrierAbility(
    "stoneguard" as AbilityId,
    2,
    "character-2",
    [0, 3],
  );
  assert.equal(rankTwoWithBarrier.characters["character-2"].barrier, 19);
});

test("Fortify grants Barrier to both heroes", () => {
  const rankOne = useEarthBarrierAbility(
    "fortify" as AbilityId,
    1,
    null,
    [1, 2],
  );
  assert.equal(rankOne.characters["character-1"].barrier, 9);
  assert.equal(rankOne.characters["character-2"].barrier, 10);
  assert.equal(rankOne.characters["character-1"].pp, 43);

  const rankTwo = useEarthBarrierAbility(
    "fortify" as AbilityId,
    2,
    null,
  );
  assert.equal(rankTwo.characters["character-1"].barrier, 11);
  assert.equal(rankTwo.characters["character-2"].barrier, 11);
});
