import { io, type Socket } from "socket.io-client";
import type {
  AutomaticRoundRequest,
  BloodpactSelectionRequest,
  CharacterReadinessState,
  ClientToServerEvents,
  CreateRoomRequest,
  LobbyState,
  MultiplayerActionRequest,
  MultiplayerActionResult,
  MultiplayerItemRequest,
  MultiplayerItemResult,
  ImmediateItemResult,
  ReformGhostRequest,
  PlayerReadinessState,
  RoomConnection,
  ServerToClientEvents,
  UpgradeReadinessState,
  UpgradeSelectionRequest,
  ActTransitionReadinessState,
} from "./protocol";
import type {
  CharacterDraft,
  CombatState,
  RoundResult,
} from "../game/types";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.PROD ? window.location.origin : "http://localhost:3001");

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SERVER_URL,
  {
    autoConnect: false,
    reconnection: false,
  },
);

let connectionPromise: Promise<void> | null = null;

function connect() {
  if (socket.connected) {
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise<void>((resolve, reject) => {
    const handleConnect = () => {
      socket.off("connect_error", handleConnectError);
      connectionPromise = null;
      resolve();
    };
    const handleConnectError = () => {
      socket.off("connect", handleConnect);
      connectionPromise = null;
      reject(new Error("Could not connect to the game server."));
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleConnectError);
    socket.connect();
  });

  return connectionPromise;
}

export function disconnectMultiplayerSession() {
  connectionPromise = null;
  socket.disconnect();
}

export async function submitMultiplayerBloodpact(request: BloodpactSelectionRequest) {
  await connect();
  return new Promise<boolean>((resolve, reject) => {
    socket.timeout(10000).emit("selectBloodpact", request, (error, accepted) => {
      if (error) reject(new Error("Bloodpact selection timed out. Please try again."));
      else resolve(accepted);
    });
  });
}

export function subscribeToBloodpact(handleUpdated: (state: CombatState) => void) {
  socket.on("bloodpactUpdated", handleUpdated);
  return () => { socket.off("bloodpactUpdated", handleUpdated); };
}

export async function createMultiplayerRoom(
  difficulty: CreateRoomRequest["difficulty"] = "normal",
) {
  await connect();

  return new Promise<RoomConnection>((resolve) => {
    socket.emit("createRoom", { difficulty }, resolve);
  });
}

export async function joinMultiplayerRoom(roomCode: string) {
  await connect();

  return new Promise<RoomConnection>((resolve, reject) => {
    socket.emit("joinRoom", { roomCode }, (result) => {
      if (result.ok) {
        resolve(result.connection);
        return;
      }

      reject(
        new Error(
          result.reason === "roomFull"
            ? "This game is already full."
            : "Room code not found.",
        ),
      );
    });
  });
}

export async function submitMultiplayerCharacter(character: CharacterDraft) {
  await connect();

  return new Promise<void>((resolve, reject) => {
    socket.emit("submitCharacter", character, (accepted) => {
      if (accepted) {
        resolve();
        return;
      }

      reject(new Error("Character selection could not be submitted."));
    });
  });
}

export async function submitMultiplayerAction(
  request: MultiplayerActionRequest,
) {
  await connect();

  return new Promise<MultiplayerActionResult>((resolve) => {
    socket.emit("selectAction", request, resolve);
  });
}

export async function resolveMultiplayerAutomaticRound(
  request: AutomaticRoundRequest,
) {
  await connect();

  return new Promise<boolean>((resolve) => {
    socket.emit("resolveAutomaticRound", request, resolve);
  });
}

export async function submitMultiplayerItem(
  request: MultiplayerItemRequest,
) {
  await connect();

  return new Promise<MultiplayerItemResult>((resolve) => {
    socket.emit("selectItem", request, resolve);
  });
}

export async function submitMultiplayerReform(
  request: ReformGhostRequest,
) {
  await connect();

  return new Promise<boolean>((resolve) => {
    socket.emit("reformGhost", request, resolve);
  });
}

export async function submitMultiplayerUpgrade(
  request: UpgradeSelectionRequest,
) {
  await connect();

  return new Promise<boolean>((resolve) => {
    socket.emit("selectUpgrade", request, resolve);
  });
}

export async function submitMultiplayerActTransitionReady() {
  await connect();

  return new Promise<boolean>((resolve) => {
    socket.emit("actTransitionReady", resolve);
  });
}

export function subscribeToLobby(
  handleLobbyUpdated: (lobby: LobbyState) => void,
) {
  socket.on("lobbyUpdated", handleLobbyUpdated);

  return () => {
    socket.off("lobbyUpdated", handleLobbyUpdated);
  };
}

export function subscribeToSessionEnded(handleSessionEnded: () => void) {
  socket.on("sessionEnded", handleSessionEnded);

  return () => {
    socket.off("sessionEnded", handleSessionEnded);
  };
}

export function subscribeToCharacterReadiness(
  handleReadinessUpdated: (state: CharacterReadinessState) => void,
) {
  socket.on("characterReadinessUpdated", handleReadinessUpdated);

  return () => {
    socket.off("characterReadinessUpdated", handleReadinessUpdated);
  };
}

export function subscribeToGameStarted(
  handleGameStarted: (state: CombatState) => void,
) {
  socket.on("gameStarted", handleGameStarted);

  return () => {
    socket.off("gameStarted", handleGameStarted);
  };
}

export function subscribeToPlayerReadiness(
  handleReadinessUpdated: (state: PlayerReadinessState) => void,
) {
  socket.on("playerReadinessUpdated", handleReadinessUpdated);

  return () => {
    socket.off("playerReadinessUpdated", handleReadinessUpdated);
  };
}

export function subscribeToRoundResolved(
  handleRoundResolved: (result: RoundResult) => void,
) {
  socket.on("roundResolved", handleRoundResolved);

  return () => {
    socket.off("roundResolved", handleRoundResolved);
  };
}

export function subscribeToImmediateItemResolved(
  handleItemResolved: (result: ImmediateItemResult) => void,
) {
  socket.on("immediateItemResolved", handleItemResolved);

  return () => {
    socket.off("immediateItemResolved", handleItemResolved);
  };
}

export function subscribeToGhostReformed(
  handleGhostReformed: (state: CombatState) => void,
) {
  socket.on("ghostReformed", handleGhostReformed);

  return () => {
    socket.off("ghostReformed", handleGhostReformed);
  };
}

export function subscribeToUpgradeReadiness(
  handleReadinessUpdated: (state: UpgradeReadinessState) => void,
) {
  socket.on("upgradeReadinessUpdated", handleReadinessUpdated);

  return () => {
    socket.off("upgradeReadinessUpdated", handleReadinessUpdated);
  };
}

export function subscribeToActTransitionReadiness(
  handleReadinessUpdated: (state: ActTransitionReadinessState) => void,
) {
  socket.on("actTransitionReadinessUpdated", handleReadinessUpdated);

  return () => {
    socket.off("actTransitionReadinessUpdated", handleReadinessUpdated);
  };
}

export function subscribeToRewardStageUpdated(
  handleRewardStageUpdated: (state: CombatState) => void,
) {
  socket.on("rewardStageUpdated", handleRewardStageUpdated);

  return () => {
    socket.off("rewardStageUpdated", handleRewardStageUpdated);
  };
}

export function subscribeToEncounterStarted(
  handleEncounterStarted: (state: CombatState) => void,
) {
  socket.on("encounterStarted", handleEncounterStarted);

  return () => {
    socket.off("encounterStarted", handleEncounterStarted);
  };
}
