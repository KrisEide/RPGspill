import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ITEM_DEFINITIONS } from "../src/data/items";
import { resolveImmediateItemUse } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 73,
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

test("Power Tonic resolves immediately and readies its damage buff", () => {
  assert.equal(ITEM_DEFINITIONS.powerTonic.useTiming, "quickAction");
  assert.equal(ITEM_DEFINITIONS.powerTonic.resolutionTiming, "preRound");

  const state = createInitialCombatState(setup);
  state.characters["character-1"].inventory.powerTonic = 1;

  const result = resolveImmediateItemUse(state, {
    kind: "item",
    actorId: "character-1",
    itemId: "powerTonic",
    targetId: "character-1",
  });

  assert.ok(result);
  assert.equal(result.nextState.round, 1);
  assert.equal(
    result.nextState.characters["character-1"].inventory.powerTonic,
    0,
  );
  assert.deepEqual(
    result.nextState.characters["character-1"].itemDamageBonus,
    { amount: 0.25, expiresRound: 1 },
  );
});

test("Power Tonic keeps a readable activation and a persistent yellow aura", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const gameCss = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /POWER_TONIC_ACTIVATION_DURATION_MS\s*=\s*2600/);
  assert.match(battleScreen, /itemDamageBonus[\s\S]*battleScene__playerUnit--powerBuff/);
  assert.match(gameCss, /\.battleScene__playerUnit--powerBuff::after/);
  assert.match(gameCss, /@keyframes powerTonicAura/);
});
