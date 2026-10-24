import assert from "node:assert/strict";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { CHARACTER_PRESETS } from "../src/data/presets";
import { calculateDamage } from "../src/game/combat/calculateDamage";
import { applyDamageVariance } from "../src/game/combat/damageVariance";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { gameReducer } from "../src/game/state/gameReducer";
import {
  createClientBattleState,
  createInitialCombatState,
} from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 731,
  startingEncounterId: "orcBrothers",
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

function getDamageBasePower(abilityId: keyof typeof ABILITIES) {
  const effect = ABILITIES[abilityId].ranks[1].effects.find(
    (candidate) => candidate.type === "damage",
  );

  assert.ok(effect && effect.type === "damage");
  return effect.basePower;
}

function getDamageRangeAgainstRowan(
  abilityId: "gorakAutoAttack" | "smash",
  enemyId: "gorakBoss" | "brakkBoss",
) {
  const ability = ABILITIES[abilityId];
  const effect = ability.ranks[1].effects[0];
  assert.ok(effect.type === "damage");

  const mitigatedDamage = calculateDamage({
    attacker: ENEMY_DEFINITIONS[enemyId].stats,
    defender: CHARACTER_PRESETS.char1.stats,
    element: ability.element,
    effect,
  });

  return [
    applyDamageVariance(mitigatedDamage, 0),
    applyDamageVariance(mitigatedDamage, 0.999_999),
  ];
}

function defendWithBoth(state: CombatState) {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "defend",
    targetId: "character-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return selections;
}

function attackWithRowanAndDefendWithLyra(state: CombatState) {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-2",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return selections;
}

function prepareShieldCharge(targetAgility: number) {
  const state = createInitialCombatState(setup);
  state.enemies[0].hp = 0;
  state.characters["character-1"].stats.agility = targetAgility;
  state.characters["character-1"].barrier = 0;
  state.enemyIntents = {
    "enemy-2": {
      abilityId: "shieldCharge",
      targetId: "character-1",
      targetIds: ["character-1"],
    },
  };
  return state;
}

test("the Orc Brothers use their original boss health totals", () => {
  assert.equal(ENEMY_DEFINITIONS.brakkBoss.stats.maxHp, 220);
  assert.equal(ENEMY_DEFINITIONS.gorakBoss.stats.maxHp, 180);
});

test("Gorak's basic attack and both of Brakk's attacks use their stronger values", () => {
  assert.equal(getDamageBasePower("gorakAutoAttack"), 24);
  assert.equal(getDamageBasePower("shieldCharge"), 19);
  assert.equal(getDamageBasePower("bloodCleave"), 20);
  assert.equal(getDamageBasePower("smash"), 40);

  const gorakAttack = ABILITIES.gorakAutoAttack.ranks[1].effects[0];
  const shieldCharge = ABILITIES.shieldCharge.ranks[1].effects[0];
  const bloodCleave = ABILITIES.bloodCleave.ranks[1].effects[0];

  assert.ok(gorakAttack.type === "damage");
  assert.deepEqual(gorakAttack.criticalHit, {
    chance: 0.2,
    damageMultiplier: 1.5,
  });
  assert.deepEqual(getDamageRangeAgainstRowan("gorakAutoAttack", "gorakBoss"), [
    14, 17,
  ]);
  assert.deepEqual(getDamageRangeAgainstRowan("smash", "brakkBoss"), [23, 28]);
  assert.ok(shieldCharge.type === "damage");
  assert.deepEqual(shieldCharge.statusOnHpDamage, { statusId: "stunned" });
  assert.ok(bloodCleave.type === "damage");
  assert.deepEqual(bloodCleave.statusOnHpDamage, {
    statusId: "bleed",
    chance: 1,
  });
});

test("Blood Cleave always applies Bleed to both heroes when it damages HP", () => {
  const state = createInitialCombatState(setup);
  state.enemies[0].statuses = [];
  state.characters["character-1"].barrier = 0;
  state.characters["character-2"].barrier = 0;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "bloodCleave",
      targetId: null,
      targetIds: ["character-1", "character-2"],
    },
  };

  const result = resolveRound(state, createEmptyRoundSelections());
  const cleave = result.events.find(
    (event) =>
      event.type === "multiTargetDamage" && event.abilityId === "bloodCleave",
  );

  assert.ok(cleave && cleave.type === "multiTargetDamage");
  assert.equal(cleave.impacts.length, 2);
  for (const characterId of ["character-1", "character-2"] as const) {
    assert.ok(
      result.nextState.characters[characterId].statuses.some(
        (status) => status.id === "bleed",
      ),
    );
  }
});

test("Shield Charge stuns a slower hero and skips their queued action", () => {
  const state = prepareShieldCharge(10);
  const result = resolveRound(
    state,
    attackWithRowanAndDefendWithLyra(state),
  );

  const charge = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "shieldCharge",
  );
  assert.ok(charge && charge.type === "damage");
  assert.ok(charge.amount > 0);
  assert.ok(
    charge.statusChanges.some(
      (change) =>
        change.type === "applied" &&
        change.combatantId === "character-1" &&
        change.status.id === "stunned",
    ),
  );
  assert.ok(
    result.events.some(
      (event) =>
        event.type === "skipTurn" &&
        event.actorId === "character-1" &&
        event.reason === "stunned",
    ),
  );
});

test("the client shows Stun as soon as Shield Charge hits", () => {
  const state = prepareShieldCharge(10);
  const result = resolveRound(
    state,
    attackWithRowanAndDefendWithLyra(state),
  );
  let client = gameReducer(createClientBattleState(state), {
    type: "receiveRoundResult",
    result,
  });

  while (true) {
    const pendingRound = client.pendingRound;
    assert.ok(pendingRound);
    const event = pendingRound.result.events[pendingRound.nextEventIndex];
    if (event.type === "damage" && event.abilityId === "shieldCharge") {
      break;
    }
    client = gameReducer(client, { type: "applyCurrentCombatEvent" });
    client = gameReducer(client, { type: "advanceCombatEvent" });
  }

  assert.equal(
    client.combat.characters["character-1"].statuses.some(
      (status) => status.id === "stunned",
    ),
    false,
  );
  client = gameReducer(client, { type: "applyCurrentCombatEvent" });
  assert.equal(
    client.combat.characters["character-1"].statuses.some(
      (status) => status.id === "stunned",
    ),
    true,
  );
});

test("Shield Charge stun waits for the next round when the hero already acted", () => {
  const state = prepareShieldCharge(20);
  const charged = resolveRound(state, defendWithBoth(state));

  assert.equal(
    charged.events.some(
      (event) =>
        event.type === "skipTurn" && event.actorId === "character-1",
    ),
    false,
  );
  assert.ok(
    charged.nextState.characters["character-1"].statuses.some(
      (status) => status.id === "stunned",
    ),
  );

  charged.nextState.enemyIntents = {};
  const nextRound = resolveRound(
    charged.nextState,
    defendWithBoth(charged.nextState),
  );
  assert.ok(
    nextRound.events.some(
      (event) =>
        event.type === "skipTurn" &&
        event.actorId === "character-1" &&
        event.reason === "stunned",
    ),
  );
  assert.equal(
    nextRound.nextState.characters["character-1"].statuses.some(
      (status) => status.id === "stunned",
    ),
    false,
  );
});

test("Catch Breath cleanses Brakk's damage-over-time effects but keeps other debuffs", () => {
  const state = createInitialCombatState(setup);
  const brakk = state.enemies[0];
  state.enemies[1].hp = 0;
  brakk.hp = 150;
  brakk.statuses = [
    { id: "burn", sourceId: "character-1", appliedRound: 1, remainingRounds: 2 },
    { id: "poison", sourceId: "character-1", appliedRound: 1 },
    { id: "bleed", sourceId: "character-1", appliedRound: 1, remainingRounds: 3 },
    { id: "cinderCurse", sourceId: "character-1", appliedRound: 1 },
    { id: "rootseed", sourceId: "character-1", appliedRound: 1 },
    { id: "cracked", sourceId: "character-1", appliedRound: 1, remainingRounds: 2 },
    { id: "weakened", sourceId: "character-1", appliedRound: 1, magnitude: 0.2 },
  ];
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "catchBreath",
      targetId: "enemy-1",
      targetIds: ["enemy-1"],
    },
  };

  const result = resolveRound(state, createEmptyRoundSelections());
  const remainingStatusIds = result.nextState.enemies[0].statuses.map(
    (status) => status.id,
  );
  const rest = result.events.find(
    (event) => event.type === "wait" && event.abilityId === "catchBreath",
  );

  assert.deepEqual(remainingStatusIds.sort(), ["cracked", "weakened"]);
  assert.ok(rest && rest.type === "wait");
  assert.equal(rest.statusChanges.length, 5);
  assert.equal(rest.healingAmount, 10);
  assert.equal(rest.remainingHp, 160);
  assert.equal(result.nextState.enemies[0].hp, 160);
});
