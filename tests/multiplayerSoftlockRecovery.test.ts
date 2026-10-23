import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  areAllLivingPlayersReady,
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import {
  resolveImmediateItemUse,
  resolveRound,
} from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const app = readFileSync(
  new URL("../src/app/App.tsx", import.meta.url),
  "utf8",
);
const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const socket = readFileSync(
  new URL("../src/network/socket.ts", import.meta.url),
  "utf8",
);
const protocol = readFileSync(
  new URL("../src/network/protocol.ts", import.meta.url),
  "utf8",
);
const server = readFileSync(
  new URL("../server/src/server.ts", import.meta.url),
  "utf8",
);

test("a disconnected multiplayer battle cannot remain silently stuck", () => {
  assert.match(app, /sessionEnded=\{sessionEnded\}/);
  assert.match(battleScreen, /props\.sessionEnded[\s\S]*CONNECTION LOST/);
  assert.match(battleScreen, />\s*RETURN TO START\s*</);
  assert.match(socket, /socket\.on\("disconnect", handleSessionEnded\)/);
});

test("multiplayer actions time out and rejected actions are shown", () => {
  assert.match(
    socket,
    /socket\.timeout\(10000\)\.emit\("selectAction"/,
  );
  assert.match(
    socket,
    /socket\.timeout\(10000\)\.emit\("selectItem"/,
  );
  assert.match(battleScreen, /multiplayerActionError/);
  assert.match(battleScreen, /Action could not be submitted/);
});

test("an immediate Steel Dart still allows Auto Attack after the partner is ready", () => {
  const setup: GameSetup = {
    mode: "twoPlayer",
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
  const state = createInitialCombatState(setup);
  state.characters["character-1"].inventory.steelDart = 1;
  const dart = resolveImmediateItemUse(state, {
    kind: "item",
    actorId: "character-1",
    itemId: "steelDart",
    targetId: "enemy-1",
  });
  assert.ok(dart);

  const selections = createEmptyRoundSelections();
  const partnerReady = selectPlayerAction(dart.nextState, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  });
  assert.ok(partnerReady);

  const bothReady = selectPlayerAction(dart.nextState, partnerReady, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  });
  assert.ok(bothReady);
  assert.equal(areAllLivingPlayersReady(dart.nextState, bothReady), true);
});

test("a stalled multiplayer round exposes a server-guarded Pass Round fallback", () => {
  assert.match(protocol, /forceRound:/);
  assert.match(socket, /submitMultiplayerForceRound/);
  assert.match(server, /FORCE_ROUND_DELAY_MS = 30_000/);
  assert.match(server, /socket\.on\("forceRound"/);
  assert.match(server, /readyPlayerIds\.length !== 1/);
  assert.match(server, /Date\.now\(\) - room\.roundStallStartedAt/);
  assert.match(battleScreen, /setForceRoundAvailable\(true\)/);
  assert.match(battleScreen, /"PASS ROUND"/);
});

test("forcing a stalled round skips only the missing action", () => {
  const setup: GameSetup = {
    mode: "twoPlayer",
    initialLoadout: "run",
    randomSeed: 73,
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
  const state = createInitialCombatState(setup);
  const selections = createEmptyRoundSelections();
  const oneReady = selectPlayerAction(state, selections, {
    playerId: "player2",
    abilityId: "defend",
    targetId: "character-2",
  });
  assert.ok(oneReady);

  const result = resolveRound(state, oneReady);
  assert.equal(result.nextState.round, 2);
  assert.equal(
    result.events.some(
      (event) =>
        "actorId" in event && event.actorId === "character-1",
    ),
    false,
  );
  assert.equal(
    result.events.some(
      (event) =>
        event.type === "defend" && event.actorId === "character-2",
    ),
    true,
  );
});
