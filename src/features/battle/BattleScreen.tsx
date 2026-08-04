import background from "../../assets/backgrounds/Bakgrunn1.png";
import CommandBar from "./components/CommandBar";
import type { PlayerDraft } from "../characterSelect/CharacterSelectScreen";
import playerSprite from "../../assets/sprites/characters/karakter1_2.png";

type Props = { player: PlayerDraft | null };

// - STATS

export default function BattleScreen({ player }: Props) {
  return (
    <div
      className="battleScene"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="battleScene__overlay" />
      <div className="absolute top-4 left-4 z-10 text-white bg-black/30 border border-white/20 px-3 py-2 rounded-lg">
        {player ? `Player: ${player.name}` : "Player: (none)"}
      </div>

      <div className="battle__content">{/* her kommer sprites/targets */}</div>
      <img className="battleScene__playerSprite" src={playerSprite} alt="" />
      <CommandBar portraitSrc={player?.portraitSrc} />
    </div>
  );
}
