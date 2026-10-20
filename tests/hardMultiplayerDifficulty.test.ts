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

test("Hard Mode multiplayer increases enemy Attack by 25 percent for the whole run", () => {
  const state = createInitialCombatState({
    mode: "twoPlayer",
    initialLoadout: "run",
    difficulty: "hard",
    randomSeed: 819,
    startingEncounterId: "mountainPass",
    players,
  });

  assert.equal(state.difficulty, "hard");
  for (const enemy of state.enemies) {
    assert.equal(
      enemy.stats.attack,
      Math.round(ENEMY_DEFINITIONS[enemy.enemyId].stats.attack * 1.25),
    );
  }

  const laterEncounter = startEncounter(state, "darkMage");
  for (const enemy of laterEncounter.enemies) {
    assert.equal(
      enemy.stats.attack,
      Math.round(ENEMY_DEFINITIONS[enemy.enemyId].stats.attack * 1.25),
    );
  }
});

test("normal runs increase enemy Attack by 10 percent", () => {
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
      Math.round(ENEMY_DEFINITIONS[enemy.enemyId].stats.attack * 1.1),
    );
  }
});

test("the host can create a clearly labelled Hard Mode multiplayer room", () => {
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

  assert.match(startScreen, /Hard Mode/);
  assert.match(startScreen, /Enemies do 25% more damage/);
  assert.match(startScreen, /Hard Mode[\s\S]{0,500}type="checkbox"/);
  assert.match(lobbyScreen, /Hard Mode/);
  assert.match(characterScreen, /Hard Mode/);
  assert.match(battleScreen, /Hard Mode/);
  assert.match(server, /request\.difficulty === "hard"/);
});
