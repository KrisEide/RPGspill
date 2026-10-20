import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import { CHARACTER_PRESETS } from "../src/data/presets";
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
  randomSeed: 419,
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

function useSteamBurst(
  rank: AbilityRank,
  burningEnemyIndexes: number[],
  cinderCurseEnemyIndex?: number,
) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies = Array.from({ length: 3 }, (_, index) => ({
    ...structuredClone(state.enemies[index % state.enemies.length]),
    instanceId: `enemy-${index + 1}` as EnemyInstanceId,
    hp: 200,
    barrier: 0,
    stats: {
      ...state.enemies[index % state.enemies.length].stats,
      maxHp: 200,
      resistance: 0,
    },
    statuses: [
      ...(burningEnemyIndexes.includes(index)
        ? [
            {
              id: "burn" as const,
              sourceId: "character-2" as const,
              appliedRound: 0,
              remainingRounds: 2,
              fullDurationRounds: 2,
              tickBasePower: 4,
            },
          ]
        : []),
      ...(index === cinderCurseEnemyIndex
        ? [
            {
              id: "cinderCurse" as const,
              sourceId: "character-2" as const,
              appliedRound: 0,
              tickBasePower: 8,
            },
          ]
        : []),
    ],
  }));
  state.characters["character-1"].abilityRanks.steamBurst = rank;
  state.characters["character-1"].pp = 50;

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "steamBurst",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  return resolveRound(state, selections);
}

test("Steam Burst defines both ranks and enters Water rewards", () => {
  const ability = ABILITIES.steamBurst;

  assert.equal(ability.element, "water");
  assert.equal(ability.target, "singleEnemy");
  assert.equal(ability.ranks[1].ppCost, 7);
  assert.deepEqual(ability.ranks[1].effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 20,
    attackScaling: 0,
    elementalPowerScaling: 0.8,
    steamBurst: {
      consumeStatusId: "burn",
      damageAllOtherEnemies: true,
      explosionBasePower: 17,
      explosionElementalPowerScaling: 0.7,
      consumeStatusFromAllEnemies: true,
    },
  });
  assert.equal(ability.ranks[2]?.ppCost, 7);
  assert.ok(
    ABILITY_REWARD_POOL.some(
      ({ abilityId, tags }) =>
        abilityId === "steamBurst" &&
        tags.includes("water") &&
        tags.includes("burn") &&
        tags.includes("aoe"),
    ),
  );
});

test("Steam Burst is available to both heroes in the development build", () => {
  assert.equal(CHARACTER_PRESETS.char1.developmentAbilityRanks.steamBurst, 1);
  assert.equal(CHARACTER_PRESETS.char2.developmentAbilityRanks.steamBurst, 1);
});

test("Steam Burst stays single-target when the selected enemy is not Burning", () => {
  const result = useSteamBurst(1, []);
  const steamEvents = result.events.filter(
    (event) =>
      "abilityId" in event && event.abilityId === "steamBurst",
  );

  assert.equal(steamEvents.length, 1);
  assert.equal(steamEvents[0]?.type, "damage");
  assert.equal(result.nextState.enemies[1].hp, 200);
  assert.equal(result.nextState.enemies[2].hp, 200);
});

test("Steam Burst consumes every Burn once and explodes against every other living enemy", () => {
  const result = useSteamBurst(1, [0, 1, 2], 1);
  const mainHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "steamBurst",
  );
  const explosion = result.events.find(
    (event) =>
      event.type === "multiTargetDamage" &&
      event.abilityId === "steamBurst",
  );

  assert.ok(mainHit && mainHit.type === "damage");
  assert.ok(explosion && explosion.type === "multiTargetDamage");
  assert.deepEqual(
    explosion.impacts.map((impact) => impact.targetId),
    ["enemy-2", "enemy-3"],
  );
  assert.equal(
    mainHit.statusChanges.some(
      (change) => change.type === "removed" && change.statusId === "burn",
    ),
    true,
  );
  assert.equal(
    result.nextState.enemies.some((enemy) =>
      enemy.statuses.some((status) => status.id === "burn"),
    ),
    false,
  );
  assert.equal(
    result.nextState.enemies[1].statuses.some(
      (status) => status.id === "cinderCurse",
    ),
    true,
  );
  assert.equal(
    explosion.impacts.every((impact) =>
      impact.statusChanges.some(
        (change) => change.type === "removed" && change.statusId === "burn",
      ),
    ),
    true,
  );
  assert.equal(
    result.events.some(
      (event) => event.type === "statusDamage" && event.statusId === "burn",
    ),
    false,
  );
  assert.equal(explosion.impacts.every((impact) => impact.amount > 0), true);
});

test("Rank 2 uses full power and Weakens every enemy hit by the steam explosion", () => {
  const ability = ABILITIES.steamBurst;
  const rankTwoEffect = ability.ranks[2]?.effects[0];
  const result = useSteamBurst(2, [0]);

  assert.deepEqual(rankTwoEffect, {
    type: "damage",
    damageType: "elemental",
    basePower: 24,
    attackScaling: 0,
    elementalPowerScaling: 0.9,
    statusOnHit: { statusId: "weakened", magnitude: 0.3 },
    steamBurst: {
      consumeStatusId: "burn",
      damageAllOtherEnemies: true,
      explosionBasePower: 20,
      explosionElementalPowerScaling: 0.8,
      consumeStatusFromAllEnemies: true,
    },
  });
  assert.equal(
    result.nextState.enemies[0].statuses.some(
      (status) => status.id === "weakened",
    ),
    true,
  );
  assert.equal(
    result.nextState.enemies.every((enemy) =>
      enemy.statuses.some((status) => status.id === "weakened"),
    ),
    true,
  );
});

test("Steam Burst uses separate supplied sprites for impact and explosion", () => {
  const visuals = readFileSync(
    new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(visuals, /steamburst\.png/);
  assert.match(visuals, /steamburstburnexplosion\.png/);
  assert.match(visuals, /variant: "steamBurst"/);
  assert.match(visuals, /variant: "steamBurstExplosion"/);
  assert.match(styles, /battleScene__targetEffect--steamBurst/);
  assert.match(styles, /battleScene__battlefieldEffect--steamBurstExplosion/);
});
