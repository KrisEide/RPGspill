import assert from "node:assert/strict";
import { test } from "node:test";
import { ENCOUNTER_DEFINITIONS } from "../src/data/encounters";
import { generateRewardOffers } from "../src/game/rewards/rewardSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 23,
  startingEncounterId: "forestAmbush",
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

test("the first Spirit choice follows Encounter 4", () => {
  assert.equal(ENCOUNTER_DEFINITIONS.forestAmbush.number, 4);
  assert.equal(ENCOUNTER_DEFINITIONS.forestAmbush.rewardType, "spirits");
  assert.equal(
    ENCOUNTER_DEFINITIONS.orcReinforcements.rewardType,
    undefined,
  );

  const state = createInitialCombatState(setup);
  const rewards = generateRewardOffers(state, state.randomSeed);

  for (const characterId of ["character-1", "character-2"] as const) {
    assert.equal(rewards.offers[characterId].length, 3);
    assert.ok(
      rewards.offers[characterId].every((offer) => offer.type === "newSpirit"),
    );
  }
});

test("Rank 2 rewards begin as a small chance after Encounter 9", () => {
  const beforeRankTwoSetup: GameSetup = {
    ...setup,
    startingEncounterId: "raiderWarband",
  };
  const rankTwoStartSetup: GameSetup = {
    ...setup,
    startingEncounterId: "guardPatrol",
  };

  for (let seed = 0; seed < 1_000; seed += 1) {
    const state = createInitialCombatState(beforeRankTwoSetup);
    state.characters["character-1"].abilityRanks.fireball = 1;
    state.characters["character-2"].abilityRanks.fireball = 1;
    const rewards = generateRewardOffers(state, seed);

    assert.ok(
      Object.values(rewards.offers)
        .flat()
        .every((offer) => offer.type !== "abilityRank"),
    );
  }

  let sawRankTwo = false;
  let newAbilityOffers = 0;
  let rankTwoOffers = 0;

  for (let seed = 0; seed < 1_000; seed += 1) {
    const state = createInitialCombatState(rankTwoStartSetup);
    state.characters["character-1"].abilityRanks.fireball = 1;
    state.characters["character-2"].abilityRanks.fireball = 1;
    const offers = Object.values(generateRewardOffers(state, seed).offers).flat();

    sawRankTwo ||= offers.some((offer) => offer.type === "abilityRank");
    newAbilityOffers += offers.filter(
      (offer) => offer.type === "newAbility",
    ).length;
    rankTwoOffers += offers.filter(
      (offer) => offer.type === "abilityRank",
    ).length;
  }

  assert.equal(sawRankTwo, true);
  assert.ok(newAbilityOffers > rankTwoOffers * 3);
});
