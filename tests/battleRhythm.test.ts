import assert from "node:assert/strict";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
import { createSpiritState } from "../src/data/spirits";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { PASSIVE_VALUES } from "../src/game/passives/passiveSystem";
import { gameReducer } from "../src/game/state/gameReducer";
import {
  createInitialCombatState,
  createInitialGameState,
} from "../src/game/state/initialState";
import type { GameSetup, PassiveId } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 301,
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

const battleRhythmId = "battleRhythm" as PassiveId;

test("Battle Rhythm is a tagged passive that restores 3 PP", () => {
  const passive = PASSIVE_DEFINITIONS[battleRhythmId];

  assert.ok(passive);
  assert.equal(PASSIVE_VALUES.battleRhythmPp, 3);
  assert.ok(passive.tags.includes("physical"));
  assert.ok(passive.tags.includes("pp"));
  assert.ok(passive.tags.includes("auto_attack"));
});

test("Battle Rhythm restores PP whenever a regular Auto Attack resolves", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].passives = { [battleRhythmId]: true };
  state.characters["character-1"].pp = 10;

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "autoAttack",
      targetId: "enemy-1",
    },
  );
  assert.ok(selections);

  const result = resolveRound(state, selections);
  const hit = result.events.find(
    (event) =>
      event.type === "damage" &&
      event.actorId === "character-1" &&
      event.abilityId === "autoAttack",
  );

  assert.ok(hit && hit.type === "damage");
  assert.equal(result.nextState.characters["character-1"].pp, 13);
  assert.equal(hit.actorPpRecoveryAmount, 3);
  assert.equal(hit.actorCharacterState?.pp, 13);
});

test("Battle Rhythm also restores PP for Warhound's Quick Auto Attack", () => {
  const state = createInitialGameState(setup);
  state.combat.characters["character-1"].passives = {
    [battleRhythmId]: true,
  };
  state.combat.characters["character-1"].pp = 10;
  state.combat.characters["character-1"].spirits = {
    warhound: createSpiritState("warhound"),
  };

  const triggered = gameReducer(state, {
    type: "submitPlayerAction",
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  });
  const hit = triggered.pendingRound?.result.events.find(
    (event) =>
      event.type === "damage" &&
      event.actorId === "character-1" &&
      event.abilityId === "autoAttack",
  );

  assert.ok(hit && hit.type === "damage");
  assert.equal(
    triggered.pendingRound?.result.nextState.characters["character-1"].pp,
    13,
  );
  assert.equal(hit.actorPpRecoveryAmount, 3);
});
