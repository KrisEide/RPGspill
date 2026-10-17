import assert from "node:assert/strict";
import test from "node:test";

import { createSpiritState } from "../src/data/spirits";
import {
  applyRewardChoices,
  generateRewardOffers,
} from "../src/game/rewards/rewardSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type {
  CharacterInstanceId,
  CombatState,
  GameSetup,
  RewardChoiceId,
} from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 919,
  startingEncounterId: "orcBrothers",
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

function bossVictoryState(): CombatState {
  const state = createInitialCombatState(setup);
  state.phase = "victory";
  state.characters["character-1"].abilityRanks = {
    ...state.characters["character-1"].abilityRanks,
    fireball: 1,
    cyclone: 1,
  };
  state.characters["character-2"].abilityRanks = {
    ...state.characters["character-2"].abilityRanks,
    lacerate: 1,
    stoneguard: 1,
  };
  state.characters["character-1"].spirits = {
    embertail: createSpiritState("embertail"),
  };
  state.characters["character-2"].spirits = {
    phoenix: { ...createSpiritState("phoenix"), activeUsesRemaining: 0 },
  };
  return state;
}

function chooseFirstOffers(state: CombatState) {
  const choices: Partial<Record<CharacterInstanceId, RewardChoiceId>> = {};
  for (const characterId of ["character-1", "character-2"] as const) {
    const offer = state.rewardOffers?.[characterId][0];
    assert.ok(offer);
    choices[characterId] = offer.id;
  }
  return choices;
}

test("the Orc Brothers reward guarantees exactly one random owned Rank 2 option", () => {
  const state = bossVictoryState();

  for (let seed = 1; seed <= 30; seed += 1) {
    const generated = generateRewardOffers(state, seed);
    for (const characterId of ["character-1", "character-2"] as const) {
      const offers = generated.offers[characterId];
      assert.equal(offers.length, 3);
      const rankOffers = offers.filter((offer) => offer.type === "abilityRank");
      assert.equal(rankOffers.length, 1);
      const rankOffer = rankOffers[0];
      assert.equal(rankOffer.type, "abilityRank");
      assert.equal(state.characters[characterId].abilityRanks[rankOffer.abilityId], 1);
      assert.equal(rankOffer.rank, 2);
    }
  }
});

test("the boss reward falls back cleanly when no owned ability can reach Rank 2", () => {
  const state = bossVictoryState();
  state.characters["character-1"].abilityRanks = { autoAttack: 1, defend: 1 };

  const offers = generateRewardOffers(state, 12).offers["character-1"];
  assert.equal(offers.length, 3);
  assert.equal(offers.some((offer) => offer.type === "abilityRank"), false);
});

test("normal boss rewards lead to one Spirit Rank 2 confirmation per hero", () => {
  const state = bossVictoryState();
  const generated = generateRewardOffers(state, state.randomSeed);
  state.rewardOffers = generated.offers;
  state.randomSeed = generated.nextSeed;

  const next = applyRewardChoices(state, chooseFirstOffers(state));
  assert.ok(next);
  assert.equal(next.actTransitionStage, "spiritRank2");
  assert.equal(next.rewardOffers?.["character-1"].length, 1);
  assert.equal(next.rewardOffers?.["character-2"].length, 1);
  assert.equal(next.rewardOffers?.["character-1"][0].type, "spiritRank");
  assert.equal(next.rewardOffers?.["character-2"][0].type, "spiritRank");
  assert.equal(next.characters["character-1"].spirits.embertail?.rank, 1);
});

test("confirming Spirit Rank 2 restores and reforms the party without restoring spent Phoenix", () => {
  const state = bossVictoryState();
  state.characters["character-1"].hp = 9;
  state.characters["character-1"].pp = 2;
  state.characters["character-2"] = {
    ...state.characters["character-2"],
    form: "ghost",
    hp: 44,
    pp: 7,
    savedLivingPp: 3,
    soulLinkActive: true,
  };
  const generated = generateRewardOffers(state, state.randomSeed);
  state.rewardOffers = generated.offers;
  const spiritStage = applyRewardChoices(state, chooseFirstOffers(state));
  assert.ok(spiritStage);

  const restored = applyRewardChoices(
    spiritStage,
    chooseFirstOffers(spiritStage),
  );
  assert.ok(restored);
  assert.equal(restored.actTransitionStage, "restoration");
  assert.equal(restored.rewardOffers, null);
  for (const character of Object.values(restored.characters)) {
    assert.equal(character.form, "living");
    assert.equal(character.hp, character.stats.maxHp);
    assert.equal(character.pp, character.stats.maxPp);
    assert.equal(Object.values(character.spirits)[0]?.rank, 2);
  }
  assert.equal(
    restored.characters["character-2"].spirits.phoenix?.activeUsesRemaining,
    0,
  );
});
