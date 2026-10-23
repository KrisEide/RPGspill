import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRewardTagAffinityWeight,
  generateRewardOffers,
} from "../src/game/rewards/rewardSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { AbilityId, GameSetup, RewardTag } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 23,
  startingEncounterId: "mountainPass",
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

test("tag affinity stays a small nudge even when many tags match", () => {
  const ownedTags: RewardTag[] = ["fire", "burn", "damage", "single_target"];

  assert.equal(getRewardTagAffinityWeight(["water", "healing"], ownedTags), 1);
  assert.equal(getRewardTagAffinityWeight(["fire"], ownedTags), 1.05);
  assert.equal(
    getRewardTagAffinityWeight(
      ["fire", "burn", "damage", "single_target"],
      ownedTags,
    ),
    1.2,
  );
  assert.equal(
    getRewardTagAffinityWeight(
      ["fire", "burn", "damage", "single_target", "aoe", "high_cost"],
      [...ownedTags, "aoe", "high_cost"],
    ),
    1.25,
  );
});

test("Act 2 offers Rank 2 abilities much more often than new abilities", () => {
  const rankOneAbilities: AbilityId[] = [
    "fireball",
    "cinderCurse",
    "rootseed",
    "earthquake",
    "crashingWave",
    "tidalDrain",
    "windSlash",
    "razorGale",
  ];
  let rankTwoOffers = 0;
  let newAbilityOffers = 0;

  for (let seed = 0; seed < 1_000; seed += 1) {
    const state = createInitialCombatState(setup);
    for (const character of Object.values(state.characters)) {
      for (const abilityId of rankOneAbilities) {
        character.abilityRanks[abilityId] = 1;
      }
    }

    const offers = Object.values(generateRewardOffers(state, seed).offers).flat();
    rankTwoOffers += offers.filter((offer) => offer.type === "abilityRank").length;
    newAbilityOffers += offers.filter((offer) => offer.type === "newAbility").length;
  }

  assert.ok(rankTwoOffers > newAbilityOffers * 2);
});
