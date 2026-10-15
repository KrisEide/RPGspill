import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyCharacterHp,
  GHOST_MAX_HP,
  GHOST_REFORM_HP,
  getCharacterMaxHp,
  reformGhost,
} from "../src/game/ghost/ghostSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 13,
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

test("reaching 100 Ghost HP permanently readies Reform for that Ghost Form", () => {
  const state = createInitialCombatState(setup);
  let ghost = applyCharacterHp(state.characters["character-1"], 0);

  assert.equal(GHOST_REFORM_HP, 100);
  assert.equal(GHOST_MAX_HP, 120);
  assert.equal(getCharacterMaxHp(ghost), 120);
  assert.equal(ghost.ghostReformReady, false);

  ghost = applyCharacterHp(ghost, 99);
  assert.equal(ghost.ghostReformReady, false);

  ghost = applyCharacterHp(ghost, 100);
  assert.equal(ghost.ghostReformReady, true);

  ghost = applyCharacterHp(ghost, 72);
  assert.equal(ghost.ghostReformReady, true);

  const reformed = reformGhost(
    {
      ...state,
      characters: { ...state.characters, "character-1": ghost },
    },
    "character-1",
  );

  assert.equal(reformed?.characters["character-1"].form, "living");
  assert.equal(reformed?.characters["character-1"].hp, 30);
  assert.equal(
    reformed?.characters["character-1"].ghostReformReady,
    false,
  );
});

test("a new Ghost Form must reach the Reform threshold again", () => {
  const state = createInitialCombatState(setup);
  let ghost = applyCharacterHp(state.characters["character-1"], 0);
  ghost = applyCharacterHp(ghost, 100);
  const reformed = reformGhost(
    {
      ...state,
      characters: { ...state.characters, "character-1": ghost },
    },
    "character-1",
  )!;

  const nextGhost = applyCharacterHp(
    reformed.characters["character-1"],
    0,
  );

  assert.equal(nextGhost.form, "ghost");
  assert.equal(nextGhost.ghostReformReady, false);
  assert.equal(
    reformGhost(
      {
        ...reformed,
        characters: {
          ...reformed.characters,
          "character-1": nextGhost,
        },
      },
      "character-1",
    ),
    null,
  );
});
