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
  randomSeed: 47,
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

function resolveBackwind(
  rank: AbilityRank,
  partnerActsFirst: boolean,
  sameTarget = true,
) {
  const state = createInitialCombatState(setup);
  state.randomSeed = 47;
  state.enemyIntents = {};
  state.enemies = Array.from(
    { length: sameTarget ? 1 : 2 },
    (_, index) => ({
      ...state.enemies[0],
      instanceId: `enemy-${index + 1}` as EnemyInstanceId,
      hp: 200,
      stats: { ...state.enemies[0].stats, maxHp: 200, resistance: 0 },
      statuses: [],
    }),
  );
  state.characters["character-1"].abilityRanks.windSlash = 1;
  state.characters["character-2"].abilityRanks.backwind = rank;
  state.characters["character-1"].stats.agility = partnerActsFirst ? 20 : 10;
  state.characters["character-2"].stats.agility = partnerActsFirst ? 10 : 20;
  state.characters["character-2"].pp = 50;

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "windSlash",
    targetId: sameTarget ? "enemy-1" : "enemy-2",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "backwind",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);
  const hit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "backwind",
  );
  assert.ok(hit && hit.type === "damage");
  return { hit, state: result.nextState };
}

test("Backwind defines its coordinated Wind bonuses and critical hit", () => {
  const ability = ABILITIES.backwind;

  assert.equal(ability.target, "singleEnemy");
  assert.equal(ability.element, "wind");
  assert.equal(ability.ranks[1]?.ppCost, 6);
  assert.equal(ability.ranks[2]?.ppCost, 6);
  assert.deepEqual(ability.ranks[1]?.effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 12,
    attackScaling: 0,
    elementalPowerScaling: 0.6,
    criticalHit: { chance: 0.05, damageMultiplier: 1.5 },
    partnerElementDamageBonus: { element: "wind", multiplier: 1.5 },
  });
  assert.deepEqual(ability.ranks[2]?.effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 12,
    attackScaling: 0,
    elementalPowerScaling: 0.6,
    criticalHit: { chance: 0.05, damageMultiplier: 1.5 },
    partnerElementDamageBonus: { element: "wind", multiplier: 1.75 },
  });
  assert.ok(
    ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "backwind"),
  );
});

test("Backwind gains its Rank 1 bonus after the partner deals Wind damage", () => {
  const { hit, state } = resolveBackwind(1, true);

  assert.equal(hit.backwindBonus, true);
  assert.equal(hit.isCritical, false);
  assert.ok(hit.amount >= 23 && hit.amount <= 27);
  assert.equal(state.characters["character-2"].pp, 44);
});

test("Backwind does not gain its bonus when it acts before the partner", () => {
  const { hit } = resolveBackwind(1, false);

  assert.equal(hit.backwindBonus, false);
  assert.equal(hit.isCritical, false);
  assert.ok(hit.amount >= 15 && hit.amount <= 18);
});

test("Backwind does not gain its bonus from Wind damage to another enemy", () => {
  const { hit } = resolveBackwind(1, true, false);

  assert.equal(hit.backwindBonus, false);
  assert.equal(hit.isCritical, false);
  assert.ok(hit.amount >= 15 && hit.amount <= 18);
});

test("Rank 2 raises the coordinated damage bonus to 75 percent", () => {
  const { hit } = resolveBackwind(2, true);

  assert.equal(hit.backwindBonus, true);
  assert.equal(hit.isCritical, false);
  assert.ok(hit.amount >= 26 && hit.amount <= 32);
});
