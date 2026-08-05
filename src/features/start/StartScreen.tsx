import startBackground from "../../assets/backgrounds/menu/StartScreen.png";
import type { GameMode } from "../../game/types";

type Props = {
  onStart: (mode: GameMode) => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <div
      className="relative h-screen w-full text-white"
      style={{
        backgroundImage: `url(${startBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* mørk overlay så tekst blir lesbar */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 grid h-full place-items-center">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-wide">RPG Game</h1>
          <p className="mt-3 text-white/80">Turn-based prototype</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onStart("singlePlayer")}
              className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 active:scale-[0.98]"
            >
              Single Player
            </button>

            <button
              type="button"
              onClick={() => onStart("twoPlayer")}
              className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 active:scale-[0.98]"
            >
              2 Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
