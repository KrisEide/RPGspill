import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { createInitialCombatState } from "../src/game/state/initialState";
import { startEncounter } from "../src/game/state/encounterState";
import type { GameSetup } from "../src/game/types";

const players: GameSetup["players"] = {
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
};

test("Hard Test multiplayer increases enemy Attack by 15 percent for the whole run", () => {
  const state = createInitialCombatState({
    mode: "twoPlayer",
    initialLoadout: "run",
    difficulty: "hardTest",
    randomSeed: 819,
    startingEncounterId: "mountainPass",
    players,
  });

  assert.equal(state.difficulty, "hardTest");
  for (const enemy of state.enemies) {
    assert.equal(
      enemy.stats.attack,
      Math.round(ENEMY_DEFINITIONS[enemy.enemyId].stats.attack * 1.15),
    );
  }

  const laterEncounter = startEncounter(state, "darkMage");
  for (const enemy of laterEncounter.enemies) {
    assert.equal(
      enemy.stats.attack,
      Math.round(ENEMY_DEFINITIONS[enemy.enemyId].stats.attack * 1.15),
    );
  }
});

test("normal runs retain the original enemy Attack", () => {
  const state = createInitialCombatState({
    mode: "twoPlayer",
    initialLoadout: "run",
    randomSeed: 820,
    startingEncounterId: "mountainPass",
    players,
  });

  assert.equal(state.difficulty, "normal");
  for (const enemy of state.enemies) {
    assert.equal(
      enemy.stats.attack,
      ENEMY_DEFINITIONS[enemy.enemyId].stats.attack,
    );
  }
});

test("the host can create a clearly labelled Hard Test multiplayer room", () => {
  const startScreen = readFileSync(
    new URL("../src/features/start/StartScreen.tsx", import.meta.url),
    "utf8",
  );
  const lobbyScreen = readFileSync(
    new URL(
      "../src/features/multiplayer/MultiplayerLobbyScreen.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const characterScreen = readFileSync(
    new URL(
      "../src/features/characterSelect/CharacterSelectScreen.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const server = readFileSync(
    new URL("../server/src/server.ts", import.meta.url),
    "utf8",
  );

  assert.match(startScreen, /Hard Test/);
  assert.match(startScreen, /15% more Attack/);
  assert.match(lobbyScreen, /Hard Test/);
  assert.match(characterScreen, /Hard Test/);
  assert.match(battleScreen, /Hard Test/);
  assert.match(server, /request\.difficulty === "hardTest"/);
});
