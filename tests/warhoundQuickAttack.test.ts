import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpiritState, SPIRIT_DEFINITIONS } from "../src/data/spirits";
import { gameReducer } from "../src/game/state/gameReducer";
import { createInitialGameState } from "../src/game/state/initialState";
import { startEncounter } from "../src/game/state/encounterState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 41,
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

function createWarhoundState() {
  const state = createInitialGameState(setup);
  state.combat.characters["character-1"].spirits = {
    warhound: createSpiritState("warhound"),
  };
  state.combat.enemies = [
    {
      ...state.combat.enemies[0],
      hp: 100,
      stats: { ...state.combat.enemies[0].stats, maxHp: 100 },
    },
  ];
  return state;
}

function finishCurrentAnimation(state: ReturnType<typeof createWarhoundState>) {
  let next = state;
  while (next.phase === "animating") {
    next = gameReducer(next, { type: "applyCurrentCombatEvent" });
    next = gameReducer(next, { type: "advanceCombatEvent" });
  }
  return next;
}

test("Warhound grants one immediate Quick Auto Attack per encounter", () => {
  assert.equal(
    SPIRIT_DEFINITIONS.warhound.passive
      .firstAutoAttackEachEncounterIsQuick,
    true,
  );

  const initial = createWarhoundState();
  const triggered = gameReducer(initial, {
    type: "submitPlayerAction",
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  });

  assert.equal(triggered.phase, "animating");
  assert.equal(triggered.combat.round, 1);
  assert.equal(triggered.pendingRound?.result.events[0]?.type, "damage");
  assert.equal(
    triggered.pendingRound?.result.events[0]?.type === "damage"
      ? triggered.pendingRound.result.events[0].abilityId
      : null,
    "autoAttack",
  );
  assert.equal(
    triggered.pendingRound?.result.nextState.characters["character-1"]
      .spirits.warhound?.passiveTriggeredThisEncounter,
    true,
  );
  assert.equal(triggered.roundSelections["character-1"].action, null);

  const afterQuickAttack = finishCurrentAnimation(triggered);
  assert.equal(afterQuickAttack.phase, "selectingActions");
  assert.equal(afterQuickAttack.combat.round, 1);

  const secondAttack = gameReducer(afterQuickAttack, {
    type: "submitPlayerAction",
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  });

  assert.equal(secondAttack.phase, "selectingActions");
  assert.equal(
    secondAttack.roundSelections["character-1"].action?.kind === "ability"
      ? secondAttack.roundSelections["character-1"].action.abilityId
      : null,
    "autoAttack",
  );
});

test("a new encounter restores Warhound's Quick Auto Attack", () => {
  const initial = createWarhoundState();
  initial.combat.characters["character-1"].spirits.warhound = {
    ...initial.combat.characters["character-1"].spirits.warhound!,
    passiveTriggeredThisEncounter: true,
  };

  const nextEncounter = startEncounter(initial.combat, "growingThreat");

  assert.equal(
    nextEncounter.characters["character-1"].spirits.warhound
      ?.passiveTriggeredThisEncounter,
    false,
  );
});
