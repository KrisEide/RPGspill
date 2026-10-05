import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 123,
  startingEncounterId: "darkMage",
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

function mageState(darkBolts: number, barriers: [number, number]) {
  const initial = createInitialCombatState(setup);
  const mage = initial.enemies.find((enemy) => enemy.enemyId === "orcMage")!;
  const state: CombatState = {
    ...initial,
    characters: {
      "character-1": { ...initial.characters["character-1"], barrier: barriers[0] },
      "character-2": { ...initial.characters["character-2"], barrier: barriers[1] },
    },
    enemies: [{ ...mage, orcMageDarkBoltsSinceShatter: darkBolts }],
    enemyIntents: {},
  };

  return prepareEnemyIntents(state);
}

test("Orc Mage waits for two executed Dark Bolts before checking Barrier", () => {
  assert.equal(mageState(0, [10, 0]).enemyIntents["enemy-1"]?.abilityId, "darkBolt");
  assert.equal(mageState(1, [10, 0]).enemyIntents["enemy-1"]?.abilityId, "darkBolt");
  assert.equal(mageState(2, [0, 0]).enemyIntents["enemy-1"]?.abilityId, "darkBolt");
  assert.equal(mageState(2, [1, 0]).enemyIntents["enemy-1"]?.abilityId, "shatterWard");
});

test("a failed Shatter Ward check retries after one Dark Bolt", () => {
  const result = resolveRound(
    mageState(2, [0, 0]),
    createEmptyRoundSelections(),
  );
  const mage = result.nextState.enemies[0];

  assert.equal(result.events[0]?.abilityId, "darkBolt");
  assert.equal(mage.orcMageDarkBoltsSinceShatter, 2);

  const retryState = prepareEnemyIntents({
    ...result.nextState,
    phase: "selectingActions",
    characters: {
      ...result.nextState.characters,
      "character-1": {
        ...result.nextState.characters["character-1"],
        barrier: 1,
      },
    },
  });
  assert.equal(retryState.enemyIntents["enemy-1"]?.abilityId, "shatterWard");
});

test("Shatter Ward removes both barriers and resets the Dark Bolt cycle", () => {
  const result = resolveRound(
    mageState(2, [12, 7]),
    createEmptyRoundSelections(),
  );
  const event = result.events.find((candidate) => candidate.type === "barrierRemoved");

  assert.ok(event);
  assert.deepEqual(
    event.impacts.map((impact) => impact.barrierRemoved),
    [12, 7],
  );
  assert.equal(result.nextState.characters["character-1"].barrier, 0);
  assert.equal(result.nextState.characters["character-2"].barrier, 0);
  assert.equal(result.nextState.enemies[0].orcMageDarkBoltsSinceShatter, 0);
  assert.equal(result.nextState.enemyIntents["enemy-1"]?.abilityId, "darkBolt");
});
