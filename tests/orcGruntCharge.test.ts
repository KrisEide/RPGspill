import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTION_ABILITY_DEFINITIONS } from "../src/data/abilities/actions";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 41,
  startingEncounterId: "forestAmbush",
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

function resolveGruntCharge() {
  let state = createInitialCombatState(setup);
  state = prepareEnemyIntents({ ...state, round: 2, enemyIntents: {} });
  assert.equal(state.enemyIntents["enemy-1"]?.abilityId, "prepareSweep");
  return resolveRound(state, defendWithBoth(state));
}

test("Orc Grunt charges a weaker Multi Attack before releasing it", () => {
  const grunt = ENEMY_DEFINITIONS.level1Orc;
  const multiAttack = ACTION_ABILITY_DEFINITIONS.orcGruntMultiAttack.ranks[1];

  assert.deepEqual(grunt.repeatingActionPattern, [
    "autoAttack",
    "prepareSweep",
    null,
  ]);
  assert.equal(multiAttack.effects[0].type, "damage");
  assert.equal(multiAttack.effects[0].basePower, 7);

  const charged = resolveGruntCharge();
  assert.ok(
    charged.events.some(
      (event) =>
        event.type === "charge" && event.abilityId === "prepareSweep",
    ),
  );
  assert.equal(
    charged.nextState.enemies[0].statuses.find(
      (status) => status.id === "abilityCharge",
    )?.readiedAbilityId,
    "orcGruntMultiAttack",
  );
  assert.equal(
    charged.nextState.enemyIntents["enemy-1"]?.abilityId,
    "orcGruntMultiAttack",
  );
  assert.equal(
    charged.nextState.enemyIntents["enemy-1"]?.isChargeRelease,
    true,
  );

  const released = resolveRound(
    charged.nextState,
    defendWithBoth(charged.nextState),
  );
  const sweep = released.events.find(
    (event) =>
      event.type === "multiTargetDamage" &&
      event.abilityId === "orcGruntMultiAttack",
  );
  assert.ok(sweep && sweep.type === "multiTargetDamage");
  assert.equal(sweep.impacts.length, 2);
  assert.equal(
    released.nextState.enemies[0].statuses.some(
      (status) => status.id === "abilityCharge",
    ),
    false,
  );
});

test("stun breaks the Grunt's prepared Multi Attack", () => {
  const charged = resolveGruntCharge();
  charged.nextState.enemies[0].statuses.push({
    id: "stunned",
    sourceId: "character-1",
    appliedRound: charged.nextState.round,
    remainingRounds: 1,
  });

  const interrupted = resolveRound(
    charged.nextState,
    defendWithBoth(charged.nextState),
  );

  assert.ok(
    interrupted.events.some(
      (event) =>
        event.type === "skipTurn" &&
        event.actorId === "enemy-1" &&
        event.reason === "stunned",
    ),
  );
  assert.equal(
    interrupted.events.some(
      (event) =>
        event.type === "multiTargetDamage" &&
        event.abilityId === "orcGruntMultiAttack",
    ),
    false,
  );
  assert.equal(
    interrupted.nextState.enemies[0].statuses.some(
      (status) => status.id === "abilityCharge",
    ),
    false,
  );
});
