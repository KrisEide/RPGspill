import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
  randomSeed: 440,
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

test("victory restores 5 HP and 5 PP through a final recovery event", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].hp = 50;
  state.characters["character-1"].pp = 10;
  state.characters["character-2"].hp = state.characters["character-2"].stats.maxHp - 2;
  state.characters["character-2"].pp = state.characters["character-2"].stats.maxPp - 2;
  state.enemies.forEach((enemy, index) => {
    enemy.hp = index === 0 ? 1 : 0;
  });
  state.enemyIntents = {};

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;

  const result = resolveRound(state, selections);
  const recovery = result.events.at(-1);

  assert.equal(result.nextState.phase, "victory");
  assert.equal(recovery?.type, "postCombatRecovery");
  if (recovery?.type === "postCombatRecovery") {
    assert.deepEqual(recovery.impacts, [
      {
        targetId: "character-1",
        hpRestored: 5,
        ppRestored: 5,
        remainingHp: 55,
        remainingPp: 15,
      },
      {
        targetId: "character-2",
        hpRestored: 2,
        ppRestored: 2,
        remainingHp: 110,
        remainingPp: 50,
      },
    ]);
  }
});

test("the recovery presentation delays rewards and exposes resource gains in party status", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const partyStatus = readFileSync(
    new URL("../src/features/battle/components/PartyStatusPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /POST_COMBAT_RECOVERY_IMPACT_DELAY_MS/);
  assert.match(battleScreen, /POST_COMBAT_RECOVERY_EVENT_DURATION_MS/);
  assert.match(
    battleScreen,
    /currentCombatEvent\?\.type === "postCombatRecovery"/,
  );
  assert.match(partyStatus, /partyStatus--showResourceChanges/);
});
