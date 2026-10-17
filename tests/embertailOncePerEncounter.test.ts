import assert from "node:assert/strict";
import test from "node:test";

import { createKnownSpirits, createSpiritState } from "../src/data/spirits";
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
  randomSeed: 812,
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

function resolveAutoAttackRound(state: CombatState) {
  state.enemyIntents = {};
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return resolveRound(state, selections);
}

test("Embertail's bonus attack triggers only once per encounter", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = createKnownSpirits(["embertail"]);
  state.enemies.forEach((enemy) => {
    enemy.hp = 200;
    enemy.stats.maxHp = 200;
  });

  const firstRound = resolveAutoAttackRound(state);
  const secondRound = resolveAutoAttackRound(firstRound.nextState);

  assert.equal(
    firstRound.events.filter(
      (event) => event.type === "spiritDamage" && event.spiritId === "embertail",
    ).length,
    1,
  );
  assert.equal(
    secondRound.events.filter(
      (event) => event.type === "spiritDamage" && event.spiritId === "embertail",
    ).length,
    0,
  );
  assert.equal(
    secondRound.nextState.characters["character-1"].spirits.embertail
      ?.passiveTriggeredThisEncounter,
    true,
  );
});

test("Rank 2 Embertail applies Burn with its encounter-opening attack", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = {
    embertail: createSpiritState("embertail", 2),
  };
  state.enemies.forEach((enemy) => {
    enemy.hp = 200;
    enemy.stats.maxHp = 200;
  });

  const result = resolveAutoAttackRound(state);
  const hit = result.events.find(
    (event) => event.type === "spiritDamage" && event.spiritId === "embertail",
  );

  assert.equal(hit?.type, "spiritDamage");
  assert.ok(
    hit.statusChanges.some(
      (change) => change.type === "applied" && change.status.id === "burn",
    ),
  );
  assert.ok(
    result.nextState.enemies[0].statuses.some((status) => status.id === "burn"),
  );
});
