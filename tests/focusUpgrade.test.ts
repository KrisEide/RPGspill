import assert from "node:assert/strict";
import test from "node:test";

import { STAT_UPGRADE_DEFINITIONS } from "../src/data/upgrades";
import { applyRewardChoices } from "../src/game/rewards/rewardSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 719,
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

test("Focus grants 10 Max PP and immediately restores 15 PP", () => {
  const state = createInitialCombatState(setup);
  const focus = STAT_UPGRADE_DEFINITIONS.focus;
  const character = state.characters["character-1"];
  const startingMaxPp = character.stats.maxPp;
  character.pp = 10;
  state.rewardOffers = {
    "character-1": [focus],
    "character-2": [],
  };

  const result = applyRewardChoices(state, { "character-1": "focus" });

  assert.ok(result);
  assert.equal(result.characters["character-1"].stats.maxPp, startingMaxPp + 10);
  assert.equal(result.characters["character-1"].pp, 25);
  assert.match(focus.description, /restore 15 PP/);
});

test("every Attack and elemental Power reward grants five points", () => {
  const powerUpgradeIds = [
    "power",
    "flame-affinity",
    "tidal-affinity",
    "stone-affinity",
    "gale-affinity",
  ] as const;

  for (const upgradeId of powerUpgradeIds) {
    const upgrade = STAT_UPGRADE_DEFINITIONS[upgradeId];

    assert.equal(upgrade.effect.amount, 5, upgrade.title);
    assert.match(upgrade.description, /\+5/, upgrade.title);
  }
});
