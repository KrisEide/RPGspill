import { useState } from "react";
import StartScreen from "../features/start/StartScreen";
import CharacterSelectScreen from "../features/characterSelect/CharacterSelectScreen";
import BattleScreen from "../features/battle/BattleScreen";
import type { PlayerDraft } from "../features/characterSelect/CharacterSelectScreen";

type Screen = "start" | "character" | "battle";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [player, setPlayer] = useState<PlayerDraft | null>(null);

  if (screen === "start") {
    return <StartScreen onStart={() => setScreen("character")} />;
  }

  if (screen === "character") {
    return (
      <CharacterSelectScreen
        onBack={() => setScreen("start")}
        onConfirm={(p) => {
          setPlayer(p);
          setScreen("battle");
        }}
      />
    );
  }

  return <BattleScreen player={player} />;
}
