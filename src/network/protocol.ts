import type {
  AbilityId,
  CharacterDraft,
  CharacterInstanceId,
  CombatantId,
  CombatState,
  EncounterId,
  ItemId,
  ItemUseEvent,
  PlayerId,
  RewardChoiceId,
  RoundResult,
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
  secondaryTargetId: CombatantId | null;
};

export type MultiplayerActionResult = {
  accepted: boolean;
  playerReady: boolean;
};

export type AutomaticRoundRequest = {
  round: number;
};

export type MultiplayerItemRequest = {
  round: number;
  itemId: ItemId;
  targetId: CombatantId | null;
};

export type ReformGhostRequest = {
  round: number;
};

export type MultiplayerItemResult = {
  accepted: boolean;
  resolvedImmediately: boolean;
};

export type ImmediateItemResult = {
  state: CombatState;
  event: ItemUseEvent;
};

export type PlayerReadinessState = {
  round: number;
  readyPlayerIds: PlayerId[];
};

export type UpgradeSelectionRequest = {
  completedEncounterId: EncounterId;
  choiceId: RewardChoiceId;
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
  immediateItemResolved: (result: ImmediateItemResult) => void;
  ghostReformed: (state: CombatState) => void;
  upgradeReadinessUpdated: (state: UpgradeReadinessState) => void;
  rewardStageUpdated: (state: CombatState) => void;
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
    respond: (result: MultiplayerActionResult) => void,
  ) => void;
  resolveAutomaticRound: (
    request: AutomaticRoundRequest,
    respond: (accepted: boolean) => void,
  ) => void;
  selectItem: (
    request: MultiplayerItemRequest,
    respond: (result: MultiplayerItemResult) => void,
  ) => void;
  reformGhost: (
    request: ReformGhostRequest,
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
