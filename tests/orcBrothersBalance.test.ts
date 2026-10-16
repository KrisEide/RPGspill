import assert from "node:assert/strict";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
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

test("the Orc Brothers use their five-percent stronger attack power", () => {
  assert.equal(getDamageBasePower("gorakAutoAttack"), 15);
  assert.equal(getDamageBasePower("shieldCharge"), 19);
  assert.equal(getDamageBasePower("bloodCleave"), 17);
  assert.equal(getDamageBasePower("smash"), 28);

  const shieldCharge = ABILITIES.shieldCharge.ranks[1].effects[0];
  const bloodCleave = ABILITIES.bloodCleave.ranks[1].effects[0];

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
