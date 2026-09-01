import { createServer } from "node:http";
import { randomInt } from "node:crypto";
import { resolve } from "node:path";
import express from "express";
import { Server } from "socket.io";
import {
  DEFAULT_PLAYER_CHARACTER_CONTROL,
  PLAYER_ORDER,
} from "../../src/game/playerControl";
import {
  areAllLivingPlayersReady,
  createEmptyRoundSelections,
  doesCharacterNeedAction,
  isValidPlayerTarget,
  selectPlayerItem,
  selectPlayerAction,
} from "../../src/game/combat/playerActions";
import {
  resolveImmediateItemUse,
  resolveRound,
} from "../../src/game/combat/resolveRound";
import { ITEM_DEFINITIONS } from "../../src/data/items";
import { createInitialCombatState } from "../../src/game/state/initialState";
import { startEncounter } from "../../src/game/state/encounterState";
import { reformGhost } from "../../src/game/ghost/ghostSystem";
import {
  applyRewardChoices,
  getRewardParticipantCharacterIds,
  isRewardOfferedToCharacter,
} from "../../src/game/rewards/rewardSystem";
import { ENCOUNTER_DEFINITIONS } from "../../src/data/encounters";
import type {
  CharacterDraft,
  CharacterInstanceId,
  CombatState,
  GameSetup,
  PlayerId,
  RewardChoiceId,
  RoundSelections,
} from "../../src/game/types";
import type {
  CharacterReadinessState,
  ClientToServerEvents,
  InterServerEvents,
  JoinRoomResult,
  LobbyState,
  PlayerReadinessState,
  RoomConnection,
  ServerToClientEvents,
  SocketData,
  UpgradeReadinessState,
} from "../../src/network/protocol";

type ConnectedPlayer = {
  playerId: PlayerId;
  socketId: string;
  character: CharacterDraft | null;
};

type GameRoom = {
  code: string;
  player1: ConnectedPlayer;
  player2: ConnectedPlayer | null;
  combatState: CombatState | null;
  roundSelections: RoundSelections;
  upgradeSelections: Record<PlayerId, RewardChoiceId | null>;
};

const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 4;
const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const DIST_DIRECTORY = resolve(process.cwd(), "dist");

const rooms = new Map<string, GameRoom>();
const app = express();
const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});
app.use(express.static(DIST_DIRECTORY));
app.use((request, response, next) => {
  if (request.method !== "GET") {
    next();
    return;
  }

  response.sendFile(resolve(DIST_DIRECTORY, "index.html"));
});

function createRoomCode() {
  let roomCode = "";

  do {
    roomCode = Array.from(
      { length: ROOM_CODE_LENGTH },
      () => ROOM_CODE_CHARACTERS[randomInt(ROOM_CODE_CHARACTERS.length)],
    ).join("");
  } while (rooms.has(roomCode));

  return roomCode;
}

function createLobbyState(room: GameRoom): LobbyState {
  const connectedPlayerIds: PlayerId[] = [room.player1.playerId];

  if (room.player2) {
    connectedPlayerIds.push(room.player2.playerId);
  }

  return {
    roomCode: room.code,
    status: room.player2 ? "ready" : "waitingForPlayer",
    connectedPlayerIds,
  };
}

function createRoomConnection(
  playerId: PlayerId,
  lobby: LobbyState,
): RoomConnection {
  return {
    playerId,
    controlledCharacterId: DEFAULT_PLAYER_CHARACTER_CONTROL[playerId],
    lobby,
  };
}

function createCharacterReadinessState(
  room: GameRoom,
): CharacterReadinessState {
  const readyPlayerIds: PlayerId[] = [];

  if (room.player1.character) {
    readyPlayerIds.push("player1");
  }

  if (room.player2?.character) {
    readyPlayerIds.push("player2");
  }

  return {
    roomCode: room.code,
    readyPlayerIds,
    allPlayersReady: readyPlayerIds.length === 2,
  };
}

function createPlayerReadinessState(room: GameRoom): PlayerReadinessState {
  const combatState = room.combatState;

  if (!combatState) {
    return {
      round: 0,
      readyPlayerIds: [],
    };
  }

  const readyPlayerIds = PLAYER_ORDER.filter((playerId) => {
    const characterId = combatState.players[playerId].controlledCharacterId;

    return !doesCharacterNeedAction(
      combatState,
      room.roundSelections,
      characterId,
    );
  });

  return {
    round: combatState.round,
    readyPlayerIds,
  };
}

function resolveReadyCombatRound(room: GameRoom) {
  if (
    !room.combatState ||
    room.combatState.phase !== "selectingActions" ||
    !areAllLivingPlayersReady(room.combatState, room.roundSelections)
  ) {
    return false;
  }

  const result = resolveRound(room.combatState, room.roundSelections);
  room.combatState = result.nextState;
  room.roundSelections = createEmptyRoundSelections();
  io.to(room.code).emit("roundResolved", result);
  io.to(room.code).emit(
    "playerReadinessUpdated",
    createPlayerReadinessState(room),
  );
  return true;
}

function createUpgradeReadinessState(
  room: GameRoom,
): UpgradeReadinessState {
  const completedEncounterId = room.combatState?.encounterId;

  if (!completedEncounterId) {
    throw new Error("Cannot create upgrade readiness without combat state.");
  }

  return {
    completedEncounterId,
    readyPlayerIds: PLAYER_ORDER.filter(
      (playerId) => room.upgradeSelections[playerId] !== null,
    ),
  };
}

function startBattleIfReady(room: GameRoom) {
  if (
    room.combatState ||
    !room.player1.character ||
    !room.player2?.character
  ) {
    return;
  }

  const setup: GameSetup = {
    mode: "twoPlayer",
    initialLoadout: "run",
    randomSeed: randomInt(0, 0x1_0000_0000),
    players: {
      player1: {
        id: "player1",
        controlledCharacterId: DEFAULT_PLAYER_CHARACTER_CONTROL.player1,
        character: room.player1.character,
      },
      player2: {
        id: "player2",
        controlledCharacterId: DEFAULT_PLAYER_CHARACTER_CONTROL.player2,
        character: room.player2.character,
      },
    },
  };

  room.combatState = createInitialCombatState(setup);
  room.roundSelections = createEmptyRoundSelections();
  io.to(room.code).emit("gameStarted", room.combatState);
}

io.on("connection", (socket) => {
  socket.on("createRoom", async (respond) => {
    const roomCode = createRoomCode();
    const room: GameRoom = {
      code: roomCode,
      player1: {
        playerId: "player1",
        socketId: socket.id,
        character: null,
      },
      player2: null,
      combatState: null,
      roundSelections: createEmptyRoundSelections(),
      upgradeSelections: {
        player1: null,
        player2: null,
      },
    };

    rooms.set(roomCode, room);
    socket.data.roomCode = roomCode;
    socket.data.playerId = "player1";
    await socket.join(roomCode);

    respond(createRoomConnection("player1", createLobbyState(room)));
  });

  socket.on("joinRoom", async ({ roomCode }, respond) => {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const room = rooms.get(normalizedRoomCode);

    if (!room) {
      const result: JoinRoomResult = {
        ok: false,
        reason: "roomNotFound",
      };
      respond(result);
      return;
    }

    if (room.player2) {
      const result: JoinRoomResult = {
        ok: false,
        reason: "roomFull",
      };
      respond(result);
      return;
    }

    room.player2 = {
      playerId: "player2",
      socketId: socket.id,
      character: null,
    };
    socket.data.roomCode = room.code;
    socket.data.playerId = "player2";
    await socket.join(room.code);

    const lobby = createLobbyState(room);
    respond({
      ok: true,
      connection: createRoomConnection("player2", lobby),
    });
    io.to(room.code).emit("lobbyUpdated", lobby);
  });

  socket.on("submitCharacter", (character, respond) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    const player =
      playerId === "player1"
        ? room?.player1
        : playerId === "player2"
          ? room?.player2
          : null;

    if (!room || !player || player.character) {
      respond(false);
      return;
    }

    player.character = {
      ...character,
      name: character.name.trim(),
    };
    respond(true);
    io.to(room.code).emit(
      "characterReadinessUpdated",
      createCharacterReadinessState(room),
    );
    startBattleIfReady(room);
  });

  socket.on("selectAction", (request, respond) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;

    if (
      !room ||
      !room.combatState ||
      !playerId ||
      request.round !== room.combatState.round
    ) {
      respond({ accepted: false, playerReady: false });
      return;
    }

    const roundSelections = selectPlayerAction(
      room.combatState,
      room.roundSelections,
      {
        playerId,
        abilityId: request.abilityId,
        targetId: request.targetId,
        secondaryTargetId: request.secondaryTargetId,
      },
    );

    if (!roundSelections) {
      respond({ accepted: false, playerReady: false });
      return;
    }

    room.roundSelections = roundSelections;
    const characterId =
      room.combatState.players[playerId].controlledCharacterId;
    respond({
      accepted: true,
      playerReady: !doesCharacterNeedAction(
        room.combatState,
        room.roundSelections,
        characterId,
      ),
    });
    io.to(room.code).emit(
      "playerReadinessUpdated",
      createPlayerReadinessState(room),
    );

    resolveReadyCombatRound(room);
  });

  socket.on("resolveAutomaticRound", (request, respond) => {
    const roomCode = socket.data.roomCode;
    const room = roomCode ? rooms.get(roomCode) : undefined;

    if (
      !room ||
      !room.combatState ||
      !socket.data.playerId ||
      request.round !== room.combatState.round
    ) {
      respond(false);
      return;
    }

    respond(resolveReadyCombatRound(room));
  });

  socket.on("selectItem", (request, respond) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;

    if (
      !room ||
      !room.combatState ||
      !playerId ||
      request.round !== room.combatState.round
    ) {
      respond({ accepted: false, resolvedImmediately: false });
      return;
    }

    const characterId =
      room.combatState.players[playerId].controlledCharacterId;
    const definition = ITEM_DEFINITIONS[request.itemId];

    if (
      definition?.resolutionTiming === "preRound" &&
      room.roundSelections[characterId].action === null &&
      isValidPlayerTarget(
        room.combatState,
        characterId,
        request.targetId,
        definition.target,
      )
    ) {
      const result = resolveImmediateItemUse(room.combatState, {
        kind: "item",
        actorId: characterId,
        itemId: request.itemId,
        targetId: request.targetId,
      });

      if (!result) {
        respond({ accepted: false, resolvedImmediately: false });
        return;
      }

      room.combatState = result.nextState;
      respond({ accepted: true, resolvedImmediately: true });
      io.to(room.code).emit("immediateItemResolved", {
        state: room.combatState,
        event: result.event,
      });
      return;
    }

    const roundSelections = selectPlayerItem(
      room.combatState,
      room.roundSelections,
      {
        playerId,
        itemId: request.itemId,
        targetId: request.targetId,
      },
    );

    if (!roundSelections) {
      respond({ accepted: false, resolvedImmediately: false });
      return;
    }

    room.roundSelections = roundSelections;
    respond({ accepted: true, resolvedImmediately: false });
    io.to(room.code).emit(
      "playerReadinessUpdated",
      createPlayerReadinessState(room),
    );

    resolveReadyCombatRound(room);
  });

  socket.on("reformGhost", (request, respond) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;

    if (
      !room ||
      !room.combatState ||
      !playerId ||
      room.combatState.phase !== "selectingActions" ||
      request.round !== room.combatState.round
    ) {
      respond(false);
      return;
    }

    const characterId =
      room.combatState.players[playerId].controlledCharacterId;
    if (room.roundSelections[characterId].action !== null) {
      respond(false);
      return;
    }

    const reformedState = reformGhost(room.combatState, characterId);
    if (!reformedState) {
      respond(false);
      return;
    }

    room.combatState = reformedState;
    respond(true);
    io.to(room.code).emit("ghostReformed", room.combatState);
  });

  socket.on("selectUpgrade", (request, respond) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = roomCode ? rooms.get(roomCode) : undefined;
    const nextEncounterId = room?.combatState
      ? ENCOUNTER_DEFINITIONS[room.combatState.encounterId]
          .nextEncounterId
      : null;

    if (
      !room ||
      !room.combatState ||
      !playerId ||
      (room.combatState.phase !== "victory" &&
        room.combatState.phase !== "rest") ||
      room.combatState.encounterId !== request.completedEncounterId ||
      (room.combatState.phase === "victory" && !nextEncounterId) ||
      room.upgradeSelections[playerId] !== null ||
      !isRewardOfferedToCharacter(
        room.combatState,
        room.combatState.players[playerId].controlledCharacterId,
        request.choiceId,
      )
    ) {
      respond(false);
      return;
    }

    room.upgradeSelections[playerId] = request.choiceId;
    respond(true);
    io.to(room.code).emit(
      "upgradeReadinessUpdated",
      createUpgradeReadinessState(room),
    );

    const rewardParticipantCharacterIds =
      getRewardParticipantCharacterIds(room.combatState);
    const rewardParticipantPlayerIds = PLAYER_ORDER.filter((id) =>
      rewardParticipantCharacterIds.includes(
        room.combatState!.players[id].controlledCharacterId,
      ),
    );

    if (
      rewardParticipantPlayerIds.some(
        (id) => room.upgradeSelections[id] === null,
      )
    ) {
      return;
    }

    const choices: Partial<
      Record<CharacterInstanceId, RewardChoiceId>
    > = {};

    for (const characterId of rewardParticipantCharacterIds) {
      const choice =
        room.upgradeSelections[
          room.combatState.characters[characterId].ownerId
        ];

      if (!choice) {
        return;
      }

      choices[characterId] = choice;
    }

    const currentPhase = room.combatState.phase;
    const upgradedCombatState = applyRewardChoices(
      room.combatState,
      choices,
    );

    if (!upgradedCombatState) {
      return;
    }

    room.roundSelections = createEmptyRoundSelections();
    room.upgradeSelections = {
      player1: null,
      player2: null,
    };

    if (currentPhase === "victory" && nextEncounterId) {
      room.combatState = startEncounter(
        upgradedCombatState,
        nextEncounterId,
      );
      io.to(room.code).emit("encounterStarted", room.combatState);
      return;
    }

    if (
      upgradedCombatState.restStage === "complete" &&
      nextEncounterId
    ) {
      room.combatState = startEncounter(
        upgradedCombatState,
        nextEncounterId,
      );
      io.to(room.code).emit("encounterStarted", room.combatState);
      return;
    }

    room.combatState = upgradedCombatState;
    io.to(room.code).emit("rewardStageUpdated", room.combatState);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;

    if (!roomCode || !rooms.has(roomCode)) {
      return;
    }

    socket.to(roomCode).emit("sessionEnded");
    rooms.delete(roomCode);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Pact & Peril server listening on http://localhost:${PORT}`);
});
