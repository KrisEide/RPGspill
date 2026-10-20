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
  randomSeed: 31,
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

function useSearingBrand(
  rank: AbilityRank,
  targetStartsBurning = false,
  targetResistance?: number,
) {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.enemies = [
    {
      ...state.enemies[0],
      hp: 25,
      stats: {
        ...state.enemies[0].stats,
        resistance: targetResistance ?? state.enemies[0].stats.resistance,
      },
      statuses: targetStartsBurning
        ? [
            {
              id: "burn" as const,
              sourceId: "character-1" as const,
              appliedRound: 0,
              remainingRounds: 2,
              fullDurationRounds: 2,
              tickBasePower: 4,
            },
          ]
        : [],
    },
  ];
  state.characters["character-1"].abilityRanks = {
    ...state.characters["character-1"].abilityRanks,
    searingBrand: rank,
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "searingBrand",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections);
}

test("Searing Brand uses the agreed damage, scaling, PP cost, and Burn strength", () => {
  const ability = ABILITIES.searingBrand;

  assert.equal(ability.ranks[1]?.ppCost, 4);
  assert.equal(ability.ranks[1]?.effects[0]?.type, "damage");
  assert.deepEqual(ability.ranks[1]?.effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 7,
    attackScaling: 0,
    elementalPowerScaling: 0.3,
    statusOnHit: { statusId: "burn" },
  });
  assert.equal(ability.ranks[2]?.ppCost, 4);
  assert.equal(STATUS_DEFINITIONS.burn.endOfRoundDamage?.basePower, 4);
  assert.equal(
    STATUS_DEFINITIONS.burn.endOfRoundDamage?.ignoresMitigation,
    true,
  );
  assert.ok(
    ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "searingBrand"),
  );
});

test("Burn deals its full fixed damage regardless of Resistance", () => {
  const result = useSearingBrand(1, false, 999);
  const burnEvent = result.events.find(
    (event) => event.type === "statusDamage" && event.statusId === "burn",
  );

  assert.ok(burnEvent && burnEvent.type === "statusDamage");
  assert.equal(burnEvent.amount, 4);
});

test("Rank 1 applies Burn without an extra immediate tick", () => {
  const result = useSearingBrand(1);
  const burnEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "burn",
  );

  assert.equal(burnEvents.length, 1);
});

test("Rank 2 immediately triggers Burn once when the target was not Burning", () => {
  const result = useSearingBrand(2);
  const burnEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "burn",
  );

  assert.equal(burnEvents.length, 2);
});

test("Rank 2 does not add an immediate tick when the target was already Burning", () => {
  const result = useSearingBrand(2, true);
  const burnEvents = result.events.filter(
    (event) => event.type === "statusDamage" && event.statusId === "burn",
  );

  assert.equal(burnEvents.length, 1);
});
