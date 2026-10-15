import assert from "node:assert/strict";
import { test } from "node:test";
import { ABILITIES } from "../src/data/abilities";
import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type {
  AbilityRank,
  EnemyInstanceId,
  GameSetup,
} from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 63,
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

function resolveCyclone(
  enemyHp: number[],
  rank: AbilityRank = 1,
) {
  const state = createInitialCombatState(setup);
  const enemyTemplate = state.enemies[0];
  state.enemyIntents = {};
  state.enemies = enemyHp.map((hp, index) => ({
    ...enemyTemplate,
    instanceId: `enemy-${index + 1}` as EnemyInstanceId,
    hp,
    stats: {
      ...enemyTemplate.stats,
      maxHp: Math.max(hp, enemyTemplate.stats.maxHp),
    },
    statuses: [],
  }));
  state.characters["character-1"].abilityRanks = {
    ...state.characters["character-1"].abilityRanks,
    cyclone: rank,
  };
  state.characters["character-1"].pp = 50;

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "cyclone",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections);
}

test("Cyclone defines three stronger Rank 2 hits and belongs to the reward pool", () => {
  const ability = ABILITIES.cyclone;

  assert.equal(ability.target, "singleEnemy");
  assert.equal(ability.element, "wind");
  assert.equal(ability.ranks[1]?.ppCost, 8);
  assert.equal(ability.ranks[2]?.ppCost, 8);
  assert.deepEqual(
    ability.ranks[1]?.effects.map((effect) =>
      effect.type === "damage"
        ? [
            effect.basePower,
            effect.elementalPowerScaling,
            effect.criticalHit,
            effect.retargetOnDefeat,
            effect.multiHitIndex,
          ]
        : null,
    ),
    [
      [6, 0.4, { chance: 0.05, damageMultiplier: 1.5 }, true, 0],
      [6, 0.4, { chance: 0.05, damageMultiplier: 1.5 }, true, 1],
      [6, 0.4, { chance: 0.05, damageMultiplier: 1.5 }, true, 2],
    ],
  );
  assert.deepEqual(
    ability.ranks[2]?.effects.map((effect) =>
      effect.type === "damage"
        ? [effect.basePower, effect.elementalPowerScaling]
        : null,
    ),
    [
      [8, 0.5],
      [8, 0.5],
      [8, 0.5],
    ],
  );
  assert.ok(
    ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "cyclone"),
  );
});

test("Cyclone hits its selected living target three times", () => {
  const result = resolveCyclone([200, 200]);
  const hits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "cyclone",
  );

  assert.deepEqual(
    hits.map((hit) => [hit.targetId, hit.multiHitIndex]),
    [
      ["enemy-1", 0],
      ["enemy-1", 1],
      ["enemy-1", 2],
    ],
  );
  assert.equal(result.nextState.characters["character-1"].pp, 42);
});

test("Cyclone sends all remaining hits to another enemy after a kill", () => {
  const result = resolveCyclone([1, 200, 200]);
  const hits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "cyclone",
  );

  assert.equal(hits.length, 3);
  assert.equal(hits[0].targetId, "enemy-1");
  assert.notEqual(hits[1].targetId, "enemy-1");
  assert.equal(hits[2].targetId, hits[1].targetId);
});

test("Cyclone can retarget again when each hit defeats its target", () => {
  const result = resolveCyclone([1, 1, 1]);
  const hits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "cyclone",
  );

  assert.equal(hits.length, 3);
  assert.equal(new Set(hits.map((hit) => hit.targetId)).size, 3);
  assert.ok(hits.every((hit) => hit.remainingHp === 0));
});

test("Cyclone stops when no living enemy remains", () => {
  const result = resolveCyclone([1]);
  const hits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "cyclone",
  );

  assert.equal(hits.length, 1);
  assert.equal(hits[0].multiHitIndex, 0);
});
