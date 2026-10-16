import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { PASSIVE_VALUES } from "../src/game/passives/passiveSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup, PassiveId } from "../src/game/types";
import { getDefendPassiveBonuses } from "../src/features/battle/data/defendBonuses";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 317,
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

const braceId = "brace" as PassiveId;
const counterguardId = "counterguard" as PassiveId;

function defendWithRowan(passives: PassiveId[], enemyAttacks: boolean) {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].passives = Object.fromEntries(
    passives.map((passiveId) => [passiveId, true]),
  );
  state.enemies[0] = {
    ...state.enemies[0],
    hp: 100,
    barrier: 0,
    stats: { ...state.enemies[0].stats, maxHp: 100, defense: 0 },
  };
  state.enemyIntents = enemyAttacks
    ? {
        "enemy-1": {
          abilityId: "autoAttack",
          targetId: "character-1",
          targetIds: ["character-1"],
        },
      }
    : {};

  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId: "defend",
      targetId: "character-1",
    },
  );
  assert.ok(selections);

  return { state, result: resolveRound(state, selections) };
}

test("Brace grants 6 Barrier when Defend resolves", () => {
  const { result } = defendWithRowan([braceId], false);
  const defendEvent = result.events.find(
    (event) => event.type === "defend" && event.actorId === "character-1",
  );

  assert.equal(PASSIVE_VALUES.braceBarrier, 6);
  assert.equal(result.nextState.characters["character-1"].barrier, 6);
  assert.ok(defendEvent && defendEvent.type === "defend");
  assert.equal(defendEvent.barrierAmount, 6);
  assert.equal(defendEvent.remainingBarrier, 6);
});

test("Counterguard retaliates when Defend absorbs the entire enemy hit", () => {
  const { state } = defendWithRowan([counterguardId], true);
  state.characters["character-1"].barrier = 50;
  const defendedResult = resolveRound(
    state,
    selectPlayerAction(state, createEmptyRoundSelections(), {
      playerId: "player1",
      abilityId: "defend",
      targetId: "character-1",
    })!,
  );
  const hit = defendedResult.events.find(
    (event) => event.type === "damage" && event.actorId === "enemy-1",
  );

  assert.ok(hit && hit.type === "damage");
  assert.equal(PASSIVE_VALUES.counterguardDamage, 4);
  assert.deepEqual(hit.reflectedDamage?.passiveIds, ["counterguard"]);
  assert.equal(hit.reflectedDamage?.amount, 4);
  assert.equal(defendedResult.nextState.enemies[0].hp, 96);
  assert.equal(hit.remainingHp, state.characters["character-1"].hp);
});

test("Counterguard and Thorns stack on the same defended hit", () => {
  const { state } = defendWithRowan([counterguardId, "thorns"], true);
  state.characters["character-1"].barrier = 10;
  const result = resolveRound(
    state,
    selectPlayerAction(state, createEmptyRoundSelections(), {
      playerId: "player1",
      abilityId: "defend",
      targetId: "character-1",
    })!,
  );
  const hit = result.events.find(
    (event) => event.type === "damage" && event.actorId === "enemy-1",
  );

  assert.ok(hit && hit.type === "damage");
  assert.deepEqual(hit.reflectedDamage?.passiveIds, [
    "thorns",
    "counterguard",
  ]);
  assert.equal(hit.reflectedDamage?.amount, 7);
  assert.equal(result.nextState.enemies[0].hp, 93);
});

test("Defend passives enter the reward pool with build tags", () => {
  assert.deepEqual(PASSIVE_DEFINITIONS[braceId].tags, [
    "defend",
    "barrier",
    "defense",
  ]);
  assert.deepEqual(PASSIVE_DEFINITIONS[counterguardId].tags, [
    "defend",
    "physical",
    "damage",
  ]);
});

test("Brace shows its Barrier gain during the Defend event", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /const defendBarrierAmount/);
  assert.match(battleScreen, /supportNumber--brace/);
  assert.match(battleScreen, /defendBarrierAmount/);
});

test("Defend info lists only the active hero's direct passive bonuses", () => {
  assert.deepEqual(getDefendPassiveBonuses({}), []);
  assert.deepEqual(
    getDefendPassiveBonuses({
      brace: true,
      counterguard: true,
      thorns: true,
    }),
    [
      { name: "Brace", effect: "+6 Barrier" },
      { name: "Counterguard", effect: "Attackers take 4 Physical damage" },
    ],
  );
  assert.deepEqual(
    getDefendPassiveBonuses({ leaveItToMe: true }),
    [
      {
        name: "Leave It to Me",
        effect: "Ally's next damaging ability deals +25% damage",
      },
    ],
  );
});

test("the command bar renders owned Defend bonuses beside its description", () => {
  const commandBar = readFileSync(
    new URL(
      "../src/features/battle/components/CommandBar.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(commandBar, /defendBonuses/);
  assert.match(commandBar, /cmdbar__defendBonuses/);
  assert.match(battleScreen, /getDefendPassiveBonuses/);
  assert.match(battleScreen, /defendBonuses={defendBonuses}/);
});
