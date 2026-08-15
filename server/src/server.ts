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
  selectPlayerAction,
} from "../../src/game/combat/playerActions";
import { resolveRound } from "../../src/game/combat/resolveRound";
import { createInitialCombatState } from "../../src/game/state/initialState";
import { startEncounter } from "../../src/game/state/encounterState";
import {
  applyRewardChoices,
  isRewardOfferedToCharacter,
} from "../../src/game/rewards/rewardSystem";
import { ENCOUNTER_DEFINITIONS } from "../../src/data/encounters";
import type {
  CharacterDraft,
  CombatState,
  GameSetup,
  PlayerId,
  RoundSelections,
  UpgradeChoiceId,
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
  upgradeSelections: Record<PlayerId, UpgradeChoiceId | null>;
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

    return (
      combatState.characters[characterId].hp <= 0 ||
      room.roundSelections[characterId] !== null
    );
  });

  return {
    round: combatState.round,
    readyPlayerIds,
  };
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
      respond(false);
      return;
    }

    const roundSelections = selectPlayerAction(
      room.combatState,
      room.roundSelections,
      {
        playerId,
        abilityId: request.abilityId,
        targetId: request.targetId,
      },
    );

    if (!roundSelections) {
      respond(false);
      return;
    }

    room.roundSelections = roundSelections;
    respond(true);
    io.to(room.code).emit(
      "playerReadinessUpdated",
      createPlayerReadinessState(room),
    );

    if (!areAllLivingPlayersReady(room.combatState, roundSelections)) {
      return;
    }

    const result = resolveRound(room.combatState, roundSelections);
    room.combatState = result.nextState;
    room.roundSelections = createEmptyRoundSelections();
    io.to(room.code).emit("roundResolved", result);
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
      room.combatState.phase !== "victory" ||
      room.combatState.encounterId !== request.completedEncounterId ||
      !nextEncounterId ||
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

    if (PLAYER_ORDER.some((id) => room.upgradeSelections[id] === null)) {
      return;
    }

    const firstCharacterChoice =
      room.upgradeSelections[
        room.combatState.characters["character-1"].ownerId
      ];
    const secondCharacterChoice =
      room.upgradeSelections[
        room.combatState.characters["character-2"].ownerId
      ];

    if (!firstCharacterChoice || !secondCharacterChoice) {
      return;
    }

    const upgradedCombatState = applyRewardChoices(room.combatState, {
      "character-1": firstCharacterChoice,
      "character-2": secondCharacterChoice,
    });

    if (!upgradedCombatState) {
      return;
    }

    room.combatState = startEncounter(
      upgradedCombatState,
      nextEncounterId,
    );
    room.roundSelections = createEmptyRoundSelections();
    room.upgradeSelections = {
      player1: null,
      player2: null,
    };
    io.to(room.code).emit("encounterStarted", room.combatState);
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
