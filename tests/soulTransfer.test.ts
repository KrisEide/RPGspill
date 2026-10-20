import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import {
  applyCharacterHp,
  reformGhost,
} from "../src/game/ghost/ghostSystem";
import { gameReducer } from "../src/game/state/gameReducer";
import {
  createClientBattleState,
  createInitialCombatState,
} from "../src/game/state/initialState";
import type { ActiveStatus, CombatState, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 91,
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

function stateWithGhostHp(ghostHp: number) {
  const state = createInitialCombatState(setup);
  state.characters["character-1"] = applyCharacterHp(
    state.characters["character-1"],
    0,
  );
  state.characters["character-1"].hp = ghostHp;
  state.characters["character-1"].stats.agility = 0;
  return state;
}

function chooseGhostAndLivingActions(state: CombatState) {
  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "ghostStrike",
    targetId: "enemy-1",
  })!;
  selections = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  })!;
  return selections;
}

test("Soul Link shares the party HP left after the full lethal hit", () => {
  const state = stateWithGhostHp(50);
  state.characters["character-2"].hp = 3;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };

  const result = resolveRound(state, chooseGhostAndLivingActions(state));
  const lethalHit = result.events.find(
    (event) => event.type === "damage" && event.targetId === "character-2",
  );
  const transfer = result.events.find((event) => event.type === "soulTransfer");

  assert.ok(lethalHit && lethalHit.type === "damage");
  assert.ok(transfer && transfer.type === "soulTransfer");
  const partyHpAfterHit = 50 + 3 - lethalHit.amount;
  assert.equal(
    transfer.ghostRemainingHp + transfer.targetRemainingHp,
    partyHpAfterHit,
  );
  assert.equal(transfer.targetRemainingHp, Math.ceil(partyHpAfterHit / 2));
  assert.equal(transfer.ghostRemainingHp, Math.floor(partyHpAfterHit / 2));
  assert.equal(transfer.ghostHpLost, 50 - transfer.ghostRemainingHp);
  assert.equal(transfer.targetHpRestored, transfer.targetRemainingHp);
  assert.equal(result.nextState.characters["character-2"].form, "living");
  assert.equal(result.nextState.characters["character-1"].soulLinkActive, false);
  assert.notEqual(result.nextState.phase, "defeat");
});

test("Soul Link can leave both heroes at 1 HP", () => {
  const state = stateWithGhostHp(5);
  state.characters["character-2"].hp = 1;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };

  const result = resolveRound(state, chooseGhostAndLivingActions(state));
  const transfer = result.events.find((event) => event.type === "soulTransfer");

  assert.ok(transfer && transfer.type === "soulTransfer");
  assert.equal(transfer.ghostRemainingHp, 1);
  assert.equal(transfer.targetRemainingHp, 1);
  assert.equal(result.nextState.characters["character-2"].form, "living");
  assert.equal(result.nextState.characters["character-1"].soulLinkActive, false);
});

test("a Ghost at 1 HP cannot prevent the last living hero from falling", () => {
  const state = stateWithGhostHp(1);
  state.characters["character-2"].hp = 1;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };

  const result = resolveRound(state, chooseGhostAndLivingActions(state));

  assert.equal(
    result.events.some((event) => event.type === "soulTransfer"),
    false,
  );
  assert.equal(result.nextState.characters["character-2"].form, "ghost");
  assert.equal(result.nextState.phase, "defeat");
});

test("a broken Soul Link cannot activate again until a new Ghost Form", () => {
  const state = stateWithGhostHp(80);
  state.characters["character-1"].soulLinkActive = false;
  state.characters["character-2"].hp = 1;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };

  const result = resolveRound(state, chooseGhostAndLivingActions(state));

  assert.equal(
    result.events.some((event) => event.type === "soulTransfer"),
    false,
  );
  assert.equal(result.nextState.characters["character-2"].form, "ghost");
});

test("entering a new Ghost Form activates a fresh Soul Link", () => {
  const state = createInitialCombatState(setup);
  assert.equal(state.characters["character-1"].soulLinkActive, false);

  const ghost = applyCharacterHp(state.characters["character-1"], 0);
  assert.equal(ghost.form, "ghost");
  assert.equal(ghost.soulLinkActive, true);

  state.characters["character-1"] = {
    ...ghost,
    hp: 100,
    ghostReformReady: true,
    soulLinkActive: false,
  };
  const reformed = reformGhost(state, "character-1");
  assert.ok(reformed);
  assert.equal(reformed.characters["character-1"].soulLinkActive, false);

  const nextGhostForm = applyCharacterHp(
    reformed.characters["character-1"],
    0,
  );
  assert.equal(nextGhostForm.soulLinkActive, true);
});

test("enemy status damage can trigger Soul Transfer", () => {
  const state = stateWithGhostHp(20);
  state.enemyIntents = {};
  state.characters["character-2"].hp = 1;
  state.characters["character-2"].statuses = [
    {
      id: "burn",
      sourceId: "enemy-1",
      appliedRound: 0,
      remainingRounds: 1,
    } satisfies ActiveStatus,
  ];

  const result = resolveRound(state, chooseGhostAndLivingActions(state));
  const transfer = result.events.find((event) => event.type === "soulTransfer");

  assert.ok(transfer && transfer.type === "soulTransfer");
  // Ghost Strike restores 1 HP before the fixed 4-damage Burn tick: 20 -> 21.
  assert.equal(
    transfer.ghostRemainingHp + transfer.targetRemainingHp,
    21 + 1 - 4,
  );
  assert.equal(transfer.ghostRemainingHp, 9);
  assert.equal(transfer.targetRemainingHp, 9);
});

test("the client shows the lethal hit before applying the transfer", () => {
  const state = stateWithGhostHp(80);
  state.characters["character-2"].hp = 1;
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-2",
      targetIds: ["character-2"],
    },
  };
  const result = resolveRound(state, chooseGhostAndLivingActions(state));
  let client = gameReducer(createClientBattleState(state), {
    type: "receiveRoundResult",
    result,
  });

  for (const event of result.events) {
    client = gameReducer(client, { type: "applyCurrentCombatEvent" });
    if (event.type === "damage" && event.targetId === "character-2") {
      assert.equal(client.combat.characters["character-2"].hp, 0);
      assert.equal(client.combat.characters["character-2"].form, "living");
    }
    if (event.type === "soulTransfer") {
      assert.equal(
        client.combat.characters[event.ghostId].hp,
        event.ghostRemainingHp,
      );
      assert.equal(
        client.combat.characters[event.targetId].hp,
        event.targetRemainingHp,
      );
      assert.equal(
        client.combat.characters[event.ghostId].soulLinkActive,
        false,
      );
    }
    client = gameReducer(client, { type: "advanceCombatEvent" });
  }

  assert.deepEqual(client.combat, result.nextState);
});
