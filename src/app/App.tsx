import { useState } from "react";
import StartScreen from "../features/start/StartScreen";
import CharacterSelectScreen from "../features/characterSelect/CharacterSelectScreen";
import BattleScreen from "../features/battle/BattleScreen";
import type {
  CharacterDraft,
  GameMode,
  GameSetup,
  PlayerId,
  PlayerSetup,
} from "../game/types";

type Screen = "start" | "character" | "battle";

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

  const startCharacterSelect = (mode: GameMode) => {
    setGameMode(mode);
    setPlayerOne(null);
    setGameSetup(null);
    setSelectingPlayerId("player1");
    setScreen("character");
  };

  const confirmCharacter = (character: CharacterDraft) => {
    const player: PlayerSetup = {
      id: selectingPlayerId,
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

  if (screen === "start") {
    return <StartScreen onStart={startCharacterSelect} />;
  }

  if (screen === "character") {
    return (
      <CharacterSelectScreen
        key={selectingPlayerId}
        gameMode={gameMode ?? "singlePlayer"}
        playerId={selectingPlayerId}
        onBack={goBackFromCharacterSelect}
        onConfirm={confirmCharacter}
      />
    );
  }

  if (!gameSetup) {
    return <StartScreen onStart={startCharacterSelect} />;
  }

  return <BattleScreen setup={gameSetup} />;
}
