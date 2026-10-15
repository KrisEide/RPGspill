import { useEffect, useRef, useState } from "react";
import StartScreen from "../features/start/StartScreen";
import CharacterSelectScreen from "../features/characterSelect/CharacterSelectScreen";
import BattleScreen from "../features/battle/BattleScreen";
import MultiplayerLobbyScreen from "../features/multiplayer/MultiplayerLobbyScreen";
import MultiplayerCharacterReadyScreen from "../features/multiplayer/MultiplayerCharacterReadyScreen";
import { DEFAULT_PLAYER_CHARACTER_CONTROL } from "../game/playerControl";
import { createDevelopmentSetup } from "../game/development/createDevelopmentSetup";
import {
  createMultiplayerRoom,
  disconnectMultiplayerSession,
  joinMultiplayerRoom,
  submitMultiplayerCharacter,
  subscribeToCharacterReadiness,
  subscribeToGameStarted,
  subscribeToLobby,
  subscribeToSessionEnded,
} from "../network/socket";
import type {
  CharacterReadinessState,
  RoomConnection,
} from "../network/protocol";
import type {
  CharacterDraft,
  CombatState,
  GameMode,
  GameSetup,
  EncounterId,
  CharacterInstanceId,
  PassiveId,
  PlayerId,
  PlayerSetup,
} from "../game/types";

type Screen =
  | "start"
  | "character"
  | "multiplayerLobby"
  | "multiplayerCharacterReady"
  | "battle";

function createRandomSeed() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [selectingPlayerId, setSelectingPlayerId] =
    useState<PlayerId>("player1");
  const [playerOne, setPlayerOne] = useState<PlayerSetup | null>(null);
  const [gameSetup, setGameSetup] = useState<GameSetup | null>(null);
  const [roomConnection, setRoomConnection] =
    useState<RoomConnection | null>(null);
  const roomConnectionRef = useRef<RoomConnection | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [characterReadiness, setCharacterReadiness] =
    useState<CharacterReadinessState | null>(null);
  const [multiplayerCombatState, setMultiplayerCombatState] =
    useState<CombatState | null>(null);

  useEffect(() => {
    const unsubscribeFromLobby = subscribeToLobby((lobby) => {
      const currentConnection = roomConnectionRef.current;

      if (currentConnection?.lobby.roomCode !== lobby.roomCode) {
        return;
      }

      const updatedConnection = { ...currentConnection, lobby };
      roomConnectionRef.current = updatedConnection;
      setRoomConnection(updatedConnection);

      if (lobby.status === "ready") {
        setGameMode("twoPlayer");
        setSelectingPlayerId(updatedConnection.playerId);
        setScreen("character");
      }
    });
    const unsubscribeFromSessionEnded = subscribeToSessionEnded(() => {
      setSessionEnded(true);
    });
    const unsubscribeFromCharacterReadiness =
      subscribeToCharacterReadiness((readiness) => {
        setCharacterReadiness((currentReadiness) =>
          !currentReadiness ||
          currentReadiness.roomCode === readiness.roomCode
            ? readiness
            : currentReadiness,
        );
      });
    const unsubscribeFromGameStarted = subscribeToGameStarted((combatState) => {
      setMultiplayerCombatState(combatState);
      setScreen("battle");
    });

    return () => {
      unsubscribeFromLobby();
      unsubscribeFromSessionEnded();
      unsubscribeFromCharacterReadiness();
      unsubscribeFromGameStarted();
    };
  }, []);

  const startCharacterSelect = (mode: GameMode) => {
    setGameMode(mode);
    setPlayerOne(null);
    setGameSetup(null);
    setSelectingPlayerId("player1");
    setScreen("character");
  };

  const startDevelopmentEncounter = (
    encounterId: EncounterId,
    passives: Partial<Record<CharacterInstanceId, PassiveId[]>> = {},
    startInGhostForm = false,
  ) => {
    setGameMode("singlePlayer");
    setPlayerOne(null);
    setSelectingPlayerId("player1");
    setGameSetup(
      createDevelopmentSetup(
        encounterId,
        createRandomSeed(),
        passives,
        startInGhostForm,
      ),
    );
    setScreen("battle");
  };

  const confirmCharacter = async (character: CharacterDraft) => {
    if (gameMode === "twoPlayer" && roomConnection) {
      await submitMultiplayerCharacter(character);
      setScreen((currentScreen) =>
        currentScreen === "battle"
          ? currentScreen
          : "multiplayerCharacterReady",
      );
      return;
    }

    const player: PlayerSetup = {
      id: selectingPlayerId,
      controlledCharacterId:
        DEFAULT_PLAYER_CHARACTER_CONTROL[selectingPlayerId],
      character,
    };

    if (selectingPlayerId === "player1") {
      setPlayerOne(player);
      setSelectingPlayerId("player2");
      return;
    }

    if (!playerOne) {
      setSelectingPlayerId("player1");
      return;
    }

    if (!gameMode) {
      setScreen("start");
      return;
    }

    setGameSetup({
      mode: gameMode,
      initialLoadout: "run",
      randomSeed: createRandomSeed(),
      players: {
        player1: playerOne,
        player2: player,
      },
    });
    setScreen("battle");
  };

  const goBackFromCharacterSelect = () => {
    if (selectingPlayerId === "player2") {
      setPlayerOne(null);
      setSelectingPlayerId("player1");
      return;
    }

    setScreen("start");
  };

  const createGame = async () => {
    const connection = await createMultiplayerRoom();
    roomConnectionRef.current = connection;
    setRoomConnection(connection);
    setCharacterReadiness(null);
    setMultiplayerCombatState(null);
    setSessionEnded(false);
    setScreen("multiplayerLobby");
  };

  const joinGame = async (roomCode: string) => {
    const connection = await joinMultiplayerRoom(roomCode);
    roomConnectionRef.current = connection;
    setRoomConnection(connection);
    setCharacterReadiness(null);
    setMultiplayerCombatState(null);
    setSessionEnded(false);
    setGameMode("twoPlayer");
    setSelectingPlayerId(connection.playerId);
    setScreen("character");
  };

  const returnToStartScreen = () => {
    disconnectMultiplayerSession();
    roomConnectionRef.current = null;
    setRoomConnection(null);
    setMultiplayerCombatState(null);
    setCharacterReadiness(null);
    setSessionEnded(false);
    setGameSetup(null);
    setPlayerOne(null);
    setGameMode(null);
    setSelectingPlayerId("player1");
    setScreen("start");
  };

  const startScreen = (
    <StartScreen
      onSinglePlayer={() => startCharacterSelect("singlePlayer")}
      onDevelopmentStart={startDevelopmentEncounter}
      onCreateGame={createGame}
      onJoinGame={joinGame}
    />
  );

  if (screen === "start") {
    return startScreen;
  }

  if (screen === "multiplayerLobby" && roomConnection) {
    return (
      <MultiplayerLobbyScreen
        connection={roomConnection}
        sessionEnded={sessionEnded}
      />
    );
  }

  if (screen === "multiplayerCharacterReady" && roomConnection) {
    return (
      <MultiplayerCharacterReadyScreen
        connection={roomConnection}
        readiness={characterReadiness}
        sessionEnded={sessionEnded}
      />
    );
  }

  if (screen === "character") {
    return (
      <CharacterSelectScreen
        key={selectingPlayerId}
        gameMode={gameMode ?? "singlePlayer"}
        playerId={selectingPlayerId}
        onBack={
          gameMode === "singlePlayer" ? goBackFromCharacterSelect : undefined
        }
        onConfirm={confirmCharacter}
      />
    );
  }

  if (
    screen === "battle" &&
    multiplayerCombatState &&
    roomConnection
  ) {
    return (
      <BattleScreen
        key={roomConnection.lobby.roomCode}
        initialCombatState={multiplayerCombatState}
        localPlayerId={roomConnection.playerId}
        onReturnToStart={returnToStartScreen}
      />
    );
  }

  if (!gameSetup) {
    return startScreen;
  }

  return (
    <BattleScreen
      setup={gameSetup}
      onReturnToStart={returnToStartScreen}
    />
  );
}
