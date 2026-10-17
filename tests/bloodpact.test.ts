import assert from "node:assert/strict";
import { test } from "node:test";
import { createInitialCombatState, createClientBattleState } from "../src/game/state/initialState";
import { startEncounter } from "../src/game/state/encounterState";
import { gameReducer } from "../src/game/state/gameReducer";
import { createKnownSpirits, SPIRIT_DEFINITIONS } from "../src/data/spirits";
import { resolveAbility } from "../src/game/abilities/abilityProgression";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createEmptyRoundSelections, selectPlayerAction, selectPlayerItem } from "../src/game/combat/playerActions";
import { getActiveBloodpactRoles, prepareBloodpactSelection, selectBloodpactRoles } from "../src/game/combat/bloodpact";
import type { CharacterInstanceId, CombatState, GameSetup, RoundSelections } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer", initialLoadout: "run", randomSeed: 12345,
  players: {
    player1: { id: "player1", controlledCharacterId: "character-1", character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" } },
    player2: { id: "player2", controlledCharacterId: "character-2", character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" } },
  },
};

function pendingPact(bothOwners = false): CombatState {
  const state = createInitialCombatState(setup);
  // Keep Bloodpact expectations independent of each hero's starting profile.
  for (const character of Object.values(state.characters)) {
    character.stats.maxHp = 100;
    character.stats.maxPp = 50;
    character.hp = 100;
    character.pp = 50;
  }
  state.characters["character-1"].spirits = createKnownSpirits(["bloodpact"]);
  if (bothOwners) state.characters["character-2"].spirits = createKnownSpirits(["bloodpact"]);
  // Isolate the pact from enemy attacks while retaining a live encounter.
  state.enemyIntents = {};
  return prepareBloodpactSelection(state);
}

function readyPact(sacrificeId: CharacterInstanceId = "character-1") {
  return selectBloodpactRoles(pendingPact(), "player1", sacrificeId)!;
}

function actions(state: CombatState, useActive = false): RoundSelections {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1", abilityId: useActive ? "bloodpact" : "defend", targetId: "character-1",
  })!;
  assert.ok(selections);
  selections = selectPlayerAction(state, selections, {
    playerId: "player2", abilityId: "defend", targetId: "character-2",
  })!;
  assert.ok(selections);
  return selections;
}

test("registered Spirit keeps one free action per encounter at both ranks", () => {
  assert.equal(SPIRIT_DEFINITIONS.bloodpact.activeUsesPerEncounter, 1);
  const active = resolveAbility("bloodpact", 1)!;
  assert.equal(active.ppCost, 0);
  assert.equal(active.useTiming, "action");
  const rankTwo = resolveAbility("bloodpact", 2)!;
  assert.equal(rankTwo.ppCost, 0);
  assert.equal(rankTwo.useTiming, "action");
  assert.deepEqual(rankTwo.effects[0], {
    type: "bloodpact",
    hpCost: 10,
    barrierAmount: 45,
  });
});

test("encounter start blocks actions and resolution until the owner chooses", () => {
  const state = pendingPact();
  const selections = createEmptyRoundSelections();
  assert.equal(state.phase, "selectingBloodpact");
  assert.equal(selectPlayerAction(state, selections, { playerId: "player1", abilityId: "defend", targetId: "character-1" }), null);
  assert.equal(selectPlayerItem(state, selections, { playerId: "player1", itemId: "steelDart", targetId: "enemy-1" }), null);
  assert.deepEqual(resolveRound(state, selections), { nextState: state, events: [] });
});

test("roles are owned, validated, and cannot be reversed after selection", () => {
  const state = pendingPact();
  assert.equal(selectBloodpactRoles(state, "player2", "character-1"), null);
  assert.equal(selectBloodpactRoles(state, "player1", "enemy-1" as CharacterInstanceId), null);
  const selected = selectBloodpactRoles(state, "player1", "character-2")!;
  assert.equal(selected.phase, "selectingActions");
  assert.deepEqual(selected.characters["character-1"].spirits.bloodpact?.bloodpactRoles, {
    sacrificeId: "character-2", protectedId: "character-1",
  });
  assert.equal(selectBloodpactRoles(selected, "player1", "character-1"), null);
  assert.equal(state.characters["character-1"].spirits.bloodpact?.bloodpactRoles, null);
});

test("two owners select independent locked pacts before either can act", () => {
  const first = selectBloodpactRoles(pendingPact(true), "player1", "character-1")!;
  assert.equal(first.phase, "selectingBloodpact");
  assert.equal(selectBloodpactRoles(first, "player1", "character-2"), null);
  const ready = selectBloodpactRoles(first, "player2", "character-1")!;
  assert.equal(ready.phase, "selectingActions");
  const result = resolveRound(ready, actions(ready));
  assert.equal(result.nextState.characters["character-1"].hp, 98);
  assert.equal(result.nextState.characters["character-2"].barrier, 4);
});

test("passive pays HP through Barrier, stacks Barrier, and emits the first events of the round", () => {
  const state = readyPact();
  state.characters["character-1"].barrier = 20;
  state.characters["character-2"].barrier = 7;
  const original = structuredClone(state);
  const result = resolveRound(state, actions(state));
  assert.equal(result.nextState.characters["character-1"].hp, 99);
  assert.equal(result.nextState.characters["character-1"].barrier, 20);
  assert.equal(result.nextState.characters["character-2"].barrier, 9);
  assert.deepEqual(result.events.slice(0, 2).map((event) => event.type === "bloodpact" && event.stage), ["sacrifice", "protected"]);
  assert.equal(result.nextState.round, 2);
  assert.deepEqual(state, original);
});

for (const sacrificeId of ["character-1", "character-2"] as const) {
  test(`active charges locked ${sacrificeId}, never substitutes the caster`, () => {
    const state = readyPact(sacrificeId);
    const protectedId = sacrificeId === "character-1" ? "character-2" : "character-1";
    state.characters[sacrificeId].barrier = 15;
    const result = resolveRound(state, actions(state, true));
    assert.equal(result.nextState.characters[sacrificeId].hp, 89); // Active 10, passive 1.
    assert.equal(result.nextState.characters[sacrificeId].barrier, 15);
    assert.equal(result.nextState.characters[protectedId].hp, 100);
    assert.equal(result.nextState.characters[protectedId].barrier, 32);
    assert.equal(result.nextState.characters["character-1"].pp, 50);
    assert.equal(result.nextState.characters["character-1"].spirits.bloodpact?.activeUsesRemaining, 0);
    const events = result.events.filter((event) => event.type === "bloodpact");
    assert.deepEqual(events.map((event) => [event.stage, event.active]), [
      ["sacrifice", false], ["protected", false], ["sacrifice", true], ["protected", true],
    ]);
  });
}

test("active cannot be retargeted, used by a non-owner, or selected twice", () => {
  const state = readyPact();
  assert.equal(selectPlayerAction(state, createEmptyRoundSelections(), { playerId: "player1", abilityId: "bloodpact", targetId: "character-2" }), null);
  assert.equal(selectPlayerAction(state, createEmptyRoundSelections(), { playerId: "player2", abilityId: "bloodpact", targetId: "character-2" }), null);
  const result = resolveRound(state, actions(state, true));
  assert.equal(selectPlayerAction(result.nextState, createEmptyRoundSelections(), { playerId: "player1", abilityId: "bloodpact", targetId: "character-1" }), null);
  const later = { ...result.nextState, enemyIntents: {} };
  const passive = resolveRound(later, actions(later));
  assert.equal(passive.nextState.characters["character-1"].hp, 88);
  assert.equal(passive.nextState.characters["character-2"].barrier, 34);
});

test("resolver also rejects forged target changes and duplicate active uses", () => {
  const state = readyPact();
  const selections = actions(state, true);
  selections["character-1"].quickActions.push({ kind: "ability", actorId: "character-1", abilityId: "bloodpact", targetId: "character-2" });
  selections["character-1"].quickActions.push({ kind: "ability", actorId: "character-1", abilityId: "bloodpact", targetId: "character-1" });
  const result = resolveRound(state, selections);
  assert.equal(result.events.filter((e) => e.type === "bloodpact" && e.active && e.stage === "sacrifice").length, 1);
  assert.equal(result.nextState.characters["character-1"].hp, 89);
});

test("Barrier cap and Stoneback / Shieldmate hooks apply", () => {
  const state = readyPact();
  state.characters["character-1"].passives.shieldmate = true;
  state.characters["character-2"].spirits = createKnownSpirits(["stoneback"]);
  state.characters["character-2"].barrier = 10;
  const result = resolveRound(state, actions(state, true));
  assert.equal(result.nextState.characters["character-2"].barrier, 47); // 10 + 30 + 5 Stoneback + 2.
  assert.equal(result.nextState.characters["character-1"].barrier, 10); // Shieldmate twice.
  const capped = readyPact();
  capped.characters["character-2"].barrier = 49;
  const cappedResult = resolveRound(capped, actions(capped, true));
  assert.equal(cappedResult.nextState.characters["character-2"].barrier, 50);
  assert.equal(cappedResult.nextState.characters["character-1"].hp, 89);
});

for (const sacrificeId of ["character-1", "character-2"] as const) {
  test(`lethal active payment by ${sacrificeId} grants Barrier, enters Ghost Form, then pauses`, () => {
    const state = readyPact(sacrificeId);
    state.characters[sacrificeId].hp = 5;
    state.characters[sacrificeId].barrier = 20;
    const result = resolveRound(state, actions(state, true));
    assert.equal(result.nextState.characters[sacrificeId].form, "ghost");
    assert.equal(result.nextState.characters[sacrificeId].barrier, 0);
    assert.equal(result.nextState.characters[sacrificeId === "character-1" ? "character-2" : "character-1"].barrier, 32);
    assert.equal(result.events.filter((e) => e.type === "bloodpact").length, 4);
    assert.equal(getActiveBloodpactRoles(result.nextState, "character-1"), null);
    assert.deepEqual(result.nextState.characters["character-1"].spirits.bloodpact?.bloodpactRoles, state.characters["character-1"].spirits.bloodpact?.bloodpactRoles);
  });
}

test("passive can cause Ghost Form and still grants its final 2 Barrier", () => {
  const state = readyPact();
  state.characters["character-1"].hp = 1;
  const result = resolveRound(state, actions(state));
  assert.equal(result.nextState.characters["character-1"].form, "ghost");
  assert.equal(result.nextState.characters["character-2"].barrier, 2);
});

test("round-start Barrier protects against attacks in that same round", () => {
  const state = readyPact();
  state.enemyIntents = {
    "enemy-1": { abilityId: "autoAttack", targetId: "character-2", targetIds: ["character-2"] },
  };
  const baseline = structuredClone(state);
  baseline.characters["character-1"].spirits = {};
  const result = resolveRound(state, actions(state));
  const withoutPact = resolveRound(baseline, actions(baseline));
  assert.equal(result.nextState.characters["character-2"].hp,
    withoutPact.nextState.characters["character-2"].hp + 2);
});

test("lethal round-start payment cancels the queued living Spirit action", () => {
  const state = readyPact();
  state.characters["character-1"].hp = 1;
  const result = resolveRound(state, actions(state, true));
  assert.equal(result.nextState.characters["character-1"].form, "ghost");
  assert.equal(result.nextState.characters["character-2"].barrier, 2);
  assert.equal(result.nextState.characters["character-1"].spirits.bloodpact?.activeUsesRemaining, 1);
  assert.equal(result.events.some((e) => e.type === "bloodpact" && e.active), false);
});

test("a pact pauses with either hero in Ghost Form and keeps roles when they return", () => {
  const state = readyPact();
  const roles = state.characters["character-1"].spirits.bloodpact?.bloodpactRoles;
  state.characters["character-2"].form = "ghost";
  assert.equal(getActiveBloodpactRoles(state, "character-1"), null);
  assert.equal(selectPlayerAction(state, createEmptyRoundSelections(), { playerId: "player1", abilityId: "bloodpact", targetId: "character-1" }), null);
  assert.equal(resolveRound(state, createEmptyRoundSelections()).events.filter((e) => e.type === "bloodpact").length, 0);
  state.characters["character-2"].form = "living";
  assert.deepEqual(getActiveBloodpactRoles(state, "character-1"), roles);
});

test("new combat resets roles and active; rest encounters do not request roles", () => {
  const state = readyPact();
  const used = resolveRound(state, actions(state, true)).nextState;
  const next = startEncounter(used, "growingThreat");
  assert.equal(next.phase, "selectingBloodpact");
  assert.equal(next.characters["character-1"].spirits.bloodpact?.bloodpactRoles, null);
  assert.equal(next.characters["character-1"].spirits.bloodpact?.activeUsesRemaining, 1);
  assert.equal(selectBloodpactRoles(next, "player1", "character-2")?.phase, "selectingActions");
  assert.equal(startEncounter(used, "spiritCamp").phase, "rest");
});

test("no impossible selection if a hero is permanently dead", () => {
  const state = readyPact();
  state.characters["character-2"].form = "permanentlyDead";
  state.characters["character-2"].hp = 0;
  assert.equal(startEncounter(state, "growingThreat").phase, "selectingActions");
});

test("client applies payment before protection and finishes on authoritative nextState", () => {
  const state = readyPact("character-2");
  const result = resolveRound(state, actions(state, true));
  let client = gameReducer(createClientBattleState(state), { type: "receiveRoundResult", result });
  for (const event of result.events) {
    client = gameReducer(client, { type: "applyCurrentCombatEvent" });
    if (event.type === "bloodpact") {
      assert.equal(client.combat.characters[event.targetId].hp, event.remainingHp);
      assert.equal(client.combat.characters[event.targetId].barrier, event.remainingBarrier);
      if (event.stage === "sacrifice") {
        assert.equal(client.combat.characters["character-1"].barrier, event.active ? 2 : 0);
      }
    }
    client = gameReducer(client, { type: "advanceCombatEvent" });
  }
  assert.equal(client.phase, "selectingActions");
  assert.deepEqual(client.combat, result.nextState);
});
