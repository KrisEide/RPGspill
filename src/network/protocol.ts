import type {
  AbilityId,
  CharacterDraft,
  CharacterInstanceId,
  CombatantId,
  CombatState,
  EncounterId,
  PlayerId,
  RoundResult,
  UpgradeChoiceId,
} from "../game/types";

export type LobbyStatus = "waitingForPlayer" | "ready";

export type LobbyState = {
  roomCode: string;
  status: LobbyStatus;
  connectedPlayerIds: PlayerId[];
};

export type RoomConnection = {
  playerId: PlayerId;
  controlledCharacterId: CharacterInstanceId;
  lobby: LobbyState;
};

export type JoinRoomRequest = {
  roomCode: string;
};

export type CharacterReadinessState = {
  roomCode: string;
  readyPlayerIds: PlayerId[];
  allPlayersReady: boolean;
};

export type MultiplayerActionRequest = {
  round: number;
  abilityId: AbilityId;
  targetId: CombatantId | null;
};

export type PlayerReadinessState = {
  round: number;
  readyPlayerIds: PlayerId[];
};

export type UpgradeSelectionRequest = {
  completedEncounterId: EncounterId;
  choiceId: UpgradeChoiceId;
};

export type UpgradeReadinessState = {
  completedEncounterId: EncounterId;
  readyPlayerIds: PlayerId[];
};

export type JoinRoomResult =
  | {
      ok: true;
      connection: RoomConnection;
    }
  | {
      ok: false;
      reason: "roomNotFound" | "roomFull";
    };

export interface ServerToClientEvents {
  lobbyUpdated: (lobby: LobbyState) => void;
  characterReadinessUpdated: (state: CharacterReadinessState) => void;
  gameStarted: (state: CombatState) => void;
  playerReadinessUpdated: (state: PlayerReadinessState) => void;
  roundResolved: (result: RoundResult) => void;
  upgradeReadinessUpdated: (state: UpgradeReadinessState) => void;
  encounterStarted: (state: CombatState) => void;
  sessionEnded: () => void;
}

export interface ClientToServerEvents {
  createRoom: (respond: (connection: RoomConnection) => void) => void;
  joinRoom: (
    request: JoinRoomRequest,
    respond: (result: JoinRoomResult) => void,
  ) => void;
  submitCharacter: (
    character: CharacterDraft,
    respond: (accepted: boolean) => void,
  ) => void;
  selectAction: (
    request: MultiplayerActionRequest,
    respond: (accepted: boolean) => void,
  ) => void;
  selectUpgrade: (
    request: UpgradeSelectionRequest,
    respond: (accepted: boolean) => void,
  ) => void;
}

export type InterServerEvents = Record<never, never>;

export type SocketData = {
  roomCode?: string;
  playerId?: PlayerId;
};
