import assert from "node:assert/strict";
import { test } from "node:test";
import { ABILITIES } from "../src/data/abilities";
import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import { STATUS_DEFINITIONS } from "../src/data/statuses";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { AbilityRank, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 67,
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

function useLacerate(
  rank: AbilityRank,
  targetStartsBleeding = false,
  criticalChance = 0,
) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies = [
    {
      ...state.enemies[0],
      hp: 100,
      stats: { ...state.enemies[0].stats, maxHp: 100 },
      statuses: targetStartsBleeding
        ? [
            {
              id: "bleed" as const,
              sourceId: "character-1" as const,
              appliedRound: 0,
              remainingRounds: 3,
              fullDurationRounds: 3,
              tickBasePower: 3,
            },
          ]
        : [],
    },
  ];
  state.characters["character-1"].abilityRanks.lacerate = rank;
  state.characters["character-1"].pp = 50;
  state.characters["character-1"].stats.criticalChance = criticalChance;

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "lacerate",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections);
}

test("Lacerate defines both ranks and improves the base Bleed tick", () => {
  const ability = ABILITIES.lacerate;

  assert.equal(ability.ranks[1]?.ppCost, 5);
  assert.deepEqual(ability.ranks[1]?.effects[0], {
    type: "damage",
    damageType: "physical",
    basePower: 11,
    attackScaling: 1,
    elementalPowerScaling: 0,
    criticalHit: {
      chance: 0.05,
      damageMultiplier: 1.5,
    },
    statusOnHit: { statusId: "bleed" },
  });
  assert.equal(ability.ranks[2]?.ppCost, 5);
  assert.deepEqual(ability.ranks[2]?.effects[0], {
    type: "damage",
    damageType: "physical",
    basePower: 14,
    attackScaling: 1,
    elementalPowerScaling: 0,
    criticalHit: {
      chance: 0.05,
      damageMultiplier: 1.5,
    },
    statusOnHit: {
      statusId: "bleed",
      triggerTickIfAlreadyActive: true,
    },
  });
  assert.equal(STATUS_DEFINITIONS.bleed.endOfRoundDamage?.basePower, 3);
  assert.ok(
    ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "lacerate"),
  );
});

test("Lacerate can critically hit while Bleed remains a normal status tick", () => {
  const result = useLacerate(1, false, 1);
  const lacerateHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "lacerate",
  );
  const bleedTick = result.events.find(
    (event) => event.type === "statusDamage" && event.statusId === "bleed",
  );

  assert.ok(lacerateHit && lacerateHit.type === "damage");
  assert.equal(lacerateHit.isCritical, true);
  assert.ok(bleedTick && bleedTick.type === "statusDamage");
  assert.equal(bleedTick.amount, 3);
});

test("Rank 1 applies Bleed without an additional immediate tick", () => {
  const result = useLacerate(1);
  const bleedEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "bleed",
  );

  assert.equal(bleedEvents.length, 1);
  assert.equal(result.nextState.characters["character-1"].pp, 45);
});

test("Rank 2 does not trigger an immediate tick on a fresh target", () => {
  const result = useLacerate(2);
  const bleedEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "bleed",
  );

  assert.equal(bleedEvents.length, 1);
});

test("Rank 2 immediately triggers existing Bleed before the end-of-round tick", () => {
  const result = useLacerate(2, true);
  const bleedEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "bleed",
  );

  assert.equal(bleedEvents.length, 2);
  assert.equal(bleedEvents[0].amount, 3);
});
