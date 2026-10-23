import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpiritState } from "../src/data/spirits";
import {
  resolveImmediateItemUse,
  resolveRound,
} from "../src/game/combat/resolveRound";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { gameReducer } from "../src/game/state/gameReducer";
import { createInitialGameState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "development",
  randomSeed: 57,
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

function createIronquillState() {
  const state = createInitialGameState(setup);
  state.combat.characters["character-1"].spirits = {
    ironquill: createSpiritState("ironquill"),
  };
  state.combat.enemies = [
    {
      ...state.combat.enemies[0],
      hp: 200,
      stats: { ...state.combat.enemies[0].stats, maxHp: 200 },
    },
  ];
  return state;
}

function finishCurrentAnimation(state: ReturnType<typeof createIronquillState>) {
  let next = state;
  while (next.phase === "animating") {
    next = gameReducer(next, { type: "applyCurrentCombatEvent" });
    next = gameReducer(next, { type: "advanceCombatEvent" });
  }
  return next;
}

function getAbilityDamage(
  result: ReturnType<typeof resolveRound>,
  abilityId: "fireball",
) {
  const event = result.events.find(
    (candidate) =>
      candidate.type === "damage" && candidate.abilityId === abilityId,
  );
  assert.ok(event && event.type === "damage");
  return event.amount;
}

test("Ironquill resolves immediately and readies its full bonus before action selection", () => {
  const initial = createIronquillState();
  const triggered = gameReducer(initial, {
    type: "submitPlayerAction",
    playerId: "player1",
    abilityId: "ironquill",
    targetId: "enemy-1",
  });

  assert.equal(triggered.phase, "animating");
  assert.equal(triggered.combat.round, 1);
  assert.deepEqual(
    triggered.pendingRound?.result.events.map((event) =>
      event.type === "damage" ? event.abilityId : event.type,
    ),
    ["ironquill", "ironquill", "ironquill"],
  );
  assert.equal(
    triggered.pendingRound?.result.nextState.characters["character-1"].spirits
      .ironquill?.steelDartAbilityBonusStacks,
    3,
  );

  const ready = finishCurrentAnimation(triggered);
  assert.equal(ready.phase, "selectingActions");
  assert.equal(ready.combat.round, 1);
  assert.equal(
    ready.combat.characters["character-1"].spirits.ironquill
      ?.activeUsesRemaining,
    0,
  );
  assert.equal(
    ready.combat.characters["character-1"].spirits.ironquill
      ?.steelDartAbilityBonusStacks,
    3,
  );
  assert.equal(ready.roundSelections["character-1"].action, null);

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(ready.combat, selections, {
    playerId: "player1",
    abilityId: "fireball",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(ready.combat, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;

  const boosted = resolveRound(ready.combat, selections);
  const baselineState = structuredClone(ready.combat);
  baselineState.characters["character-1"].spirits.ironquill = {
    ...baselineState.characters["character-1"].spirits.ironquill!,
    steelDartAbilityBonusStacks: 0,
  };
  const baseline = resolveRound(baselineState, selections);

  assert.equal(
    getAbilityDamage(boosted, "fireball"),
    Math.round(getAbilityDamage(baseline, "fireball") * 1.3),
  );
  assert.equal(
    boosted.nextState.characters["character-1"].spirits.ironquill
      ?.steelDartAbilityBonusStacks,
    0,
  );
});

test("acting first is still a queued priority action rather than Quick", () => {
  const initial = createIronquillState();
  initial.combat.characters["character-1"].spirits = {
    swiftWing: createSpiritState("swiftWing"),
  };

  const selected = gameReducer(initial, {
    type: "submitPlayerAction",
    playerId: "player1",
    abilityId: "swiftWing",
    targetId: "enemy-1",
  });

  assert.equal(selected.phase, "selectingActions");
  assert.equal(
    selected.roundSelections["character-1"].action?.kind === "ability"
      ? selected.roundSelections["character-1"].action.abilityId
      : null,
    "swiftWing",
  );
});

test("Rank 2 Ironquill grants one non-bankable free Steel Dart each round", () => {
  const initial = createIronquillState().combat;
  initial.characters["character-1"].spirits = {
    ironquill: createSpiritState("ironquill", 2),
  };
  initial.characters["character-1"].inventory = {};

  const firstDart = resolveImmediateItemUse(initial, {
    kind: "item",
    actorId: "character-1",
    itemId: "steelDart",
    targetId: "enemy-1",
  });

  assert.ok(firstDart);
  assert.equal(firstDart.nextState.characters["character-1"].inventory.steelDart ?? 0, 0);
  assert.equal(
    firstDart.nextState.characters["character-1"].spirits.ironquill
      ?.freeSteelDartAvailable,
    false,
  );
  assert.equal(
    firstDart.nextState.characters["character-1"].spirits.ironquill
      ?.steelDartAbilityBonusStacks,
    1,
  );
  assert.equal(
    resolveImmediateItemUse(firstDart.nextState, {
      kind: "item",
      actorId: "character-1",
      itemId: "steelDart",
      targetId: "enemy-1",
    }),
    null,
  );

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(firstDart.nextState, selections, {
    playerId: "player1",
    abilityId: "defend",
    targetId: "character-1",
  })!;
  selections = selectPlayerAction(firstDart.nextState, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  const nextRound = resolveRound(firstDart.nextState, selections);

  assert.equal(nextRound.nextState.round, 2);
  assert.equal(
    nextRound.nextState.characters["character-1"].spirits.ironquill
      ?.freeSteelDartAvailable,
    true,
  );
  assert.equal(nextRound.nextState.characters["character-1"].inventory.steelDart ?? 0, 0);
});
