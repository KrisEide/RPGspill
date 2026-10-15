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
  AbilityId,
  AbilityRank,
  CombatState,
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

function createTwinFlamesState(rank: AbilityRank = 1, enemyCount = 3) {
  const state = createInitialCombatState(setup);
  const enemyTemplate = state.enemies[0];
  state.enemyIntents = {};
  state.enemies = Array.from({ length: enemyCount }, (_, index) => ({
    ...enemyTemplate,
    instanceId: `enemy-${index + 1}` as EnemyInstanceId,
    hp: 200,
    barrier: 0,
    stats: { ...enemyTemplate.stats, maxHp: 200 },
    statuses: [],
  }));
  state.characters["character-2"].abilityRanks = {
    ...state.characters["character-2"].abilityRanks,
    twinFlames: rank,
  };
  state.characters["character-2"].pp = 50;
  return state;
}

function resolveWithPartnerAbility(
  partnerAbilityId: AbilityId,
  options: {
    rank?: AbilityRank;
    enemyCount?: number;
    state?: CombatState;
    partnerTargetId?: "enemy-1" | "character-1" | null;
  } = {},
) {
  const state =
    options.state ??
    createTwinFlamesState(options.rank ?? 1, options.enemyCount ?? 3);
  state.characters["character-1"].abilityRanks = {
    ...state.characters["character-1"].abilityRanks,
    [partnerAbilityId]: 1,
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: partnerAbilityId,
    targetId:
      options.partnerTargetId === undefined
        ? partnerAbilityId === "earthquake"
          ? null
          : "enemy-1"
        : options.partnerTargetId,
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "twinFlames",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections);
}

test("Twin Flames defines both ranks and belongs to the reward pool", () => {
  const ability = ABILITIES.twinFlames;
  const rankOne = ability.ranks[1]!;
  const rankTwo = ability.ranks[2]!;

  assert.equal(ability.turnOrderRule, "absoluteLast");
  assert.equal(rankOne.ppCost, 9);
  assert.equal(rankTwo.ppCost, 9);
  assert.deepEqual(rankOne.effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 12,
    attackScaling: 0,
    elementalPowerScaling: 0.5,
    twinFlamesCombo: {
      fire: { basePower: 8, elementalPowerScaling: 0.3 },
      water: { partyHealing: 6, cleanseStatusId: "burn" },
      earth: { barrierRemoval: 20 },
      wind: { additionalEnemy: true },
      ghost: { healing: 10 },
    },
  });
  assert.deepEqual(rankTwo.effects[0], {
    type: "damage",
    damageType: "elemental",
    basePower: 14,
    attackScaling: 0,
    elementalPowerScaling: 0.6,
    twinFlamesCombo: {
      fire: { basePower: 10, elementalPowerScaling: 0.4 },
      water: { partyHealing: 8, cleanseStatusId: "burn" },
      earth: { barrierRemoval: 25 },
      wind: { additionalEnemy: true },
      ghost: { healing: 10 },
    },
  });
  assert.ok(
    ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "twinFlames"),
  );
});

test("Twin Flames resolves after the partner, enemies, and other always-last abilities", () => {
  const state = createTwinFlamesState(1, 1);
  state.characters["character-1"].abilityRanks.earthquake = 1;
  state.characters["character-1"].stats.agility = 1;
  state.characters["character-2"].stats.agility = 99;
  state.enemies[0].stats.agility = 50;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-1",
      targetIds: ["character-1"],
    },
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "earthquake",
    targetId: null,
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "twinFlames",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);
  const actionIds = result.events
    .filter(
      (event) =>
        event.type === "damage" || event.type === "multiTargetDamage",
    )
    .map((event) => event.abilityId);

  assert.equal(actionIds.at(-1), "twinFlames");
  assert.ok(actionIds.indexOf("autoAttack") < actionIds.indexOf("twinFlames"));
  assert.ok(actionIds.indexOf("earthquake") < actionIds.indexOf("twinFlames"));
  assert.equal(result.nextState.characters["character-2"].pp, 41);
});

test("Fire damage from the partner gives Twin Flames a real second hit", () => {
  const result = resolveWithPartnerAbility("fireball");
  const twinHits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.equal(twinHits.length, 2);
  assert.deepEqual(
    twinHits.map((event) => event.targetId),
    ["enemy-1", "enemy-1"],
  );
  assert.equal(twinHits[0].twinFlamesElement, "fire");
  assert.equal(twinHits[1].twinFlamesFollowUp, true);
});

test("Water damage removes Burn and heals both heroes", () => {
  const state = createTwinFlamesState();
  state.characters["character-1"].hp = 50;
  state.characters["character-2"].hp = 50;
  state.enemies[0].statuses = [
    {
      id: "burn",
      sourceId: "character-2",
      appliedRound: 0,
      remainingRounds: 2,
      fullDurationRounds: 2,
      tickBasePower: 4,
    },
  ];

  const result = resolveWithPartnerAbility("crashingWave", { state });
  const twinHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.ok(twinHit && twinHit.type === "damage");
  assert.equal(twinHit.twinFlamesElement, "water");
  assert.ok(
    twinHit.statusChanges.some(
      (change) => change.type === "removed" && change.statusId === "burn",
    ),
  );
  assert.equal(result.nextState.characters["character-1"].hp, 56);
  assert.equal(result.nextState.characters["character-2"].hp, 56);
});

test("Earth damage removes capped Barrier before Twin Flames deals damage", () => {
  const state = createTwinFlamesState(1, 1);
  state.enemies[0].barrier = 100;
  const result = resolveWithPartnerAbility("earthquake", { state });
  const twinHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.ok(twinHit && twinHit.type === "damage");
  assert.equal(twinHit.twinFlamesElement, "earth");
  assert.equal(twinHit.barrierRemovedBeforeHit, 20);
  assert.ok(twinHit.absorbedByBarrier > 0);
});

test("Wind damage makes Twin Flames hit one random additional living enemy", () => {
  const result = resolveWithPartnerAbility("windSlash", { enemyCount: 3 });
  const twinHits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.equal(twinHits.length, 2);
  assert.equal(twinHits[0].targetId, "enemy-1");
  assert.notEqual(twinHits[1].targetId, "enemy-1");
  assert.equal(twinHits[1].twinFlamesElement, "wind");
  assert.equal(twinHits[1].twinFlamesFollowUp, true);
});

test("a non-damaging elemental ability does not empower Twin Flames", () => {
  const state = createTwinFlamesState();
  state.characters["character-1"].hp = 90;
  const result = resolveWithPartnerAbility("healingTide", {
    state,
    partnerTargetId: "character-1",
  });
  const twinHits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.equal(twinHits.length, 1);
  assert.equal(twinHits[0].twinFlamesElement, null);
});

test("a damaging Ghost partner secretly restores 10 Ghost HP through Twin Flames", () => {
  const state = createTwinFlamesState(1, 2);
  const ghost = state.characters["character-1"];
  state.characters["character-1"] = {
    ...ghost,
    form: "ghost",
    hp: 40,
    pp: 20,
    savedLivingPp: ghost.pp,
    soulLinkActive: true,
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "ghostBolt",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "twinFlames",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);
  const twinHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.ok(twinHit && twinHit.type === "damage");
  assert.equal(twinHit.twinFlamesGhostPartnerId, "character-1");
  assert.equal(twinHit.linkedSupportImpact?.healingAmount, 10);
  assert.equal(twinHit.linkedSupportImpact?.remainingHp, 53);
  assert.equal(result.nextState.characters["character-1"].hp, 53);
  assert.doesNotMatch(
    ABILITIES.twinFlames.ranks[1]!.description,
    /Ghost|10 HP/i,
  );
});

test("the hidden Ghost effect requires both attacks to hit the same target", () => {
  const state = createTwinFlamesState(1, 2);
  const ghost = state.characters["character-1"];
  state.characters["character-1"] = {
    ...ghost,
    form: "ghost",
    hp: 40,
    pp: 20,
    savedLivingPp: ghost.pp,
    soulLinkActive: true,
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "ghostBolt",
    targetId: "enemy-2",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "twinFlames",
    targetId: "enemy-1",
  })!;

  const result = resolveRound(state, selections);
  const twinHit = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "twinFlames",
  );

  assert.ok(twinHit && twinHit.type === "damage");
  assert.equal(twinHit.twinFlamesGhostPartnerId, undefined);
  assert.equal(result.nextState.characters["character-1"].hp, 43);
});
