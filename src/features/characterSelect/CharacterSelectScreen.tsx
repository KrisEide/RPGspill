import { useMemo, useState } from "react";

import portrait1 from "../../assets/portraits/Character1_1.png";
import portrait2 from "../../assets/portraits/Character1_2.png";
import portrait3 from "../../assets/portraits/Character1_3.png";

// import portrait4 from "../../assets/portraits/Character2_1.png";
// import portrait5 from "../../assets/portraits/Character2_2.png";
// import portrait6 from "../../assets/portraits/Character2_3.png";

import portrait7 from "../../assets/portraits/Character3_1.png";
import portrait8 from "../../assets/portraits/Character3_2.png";
import portrait9 from "../../assets/portraits/Character3_3.png";

import startBackground from "../../assets/backgrounds/menu/StartScreen.png";
import type {
  CharacterDraft,
  GameMode,
  PlayerId,
} from "../../game/types";

type Props = {
  gameMode: GameMode;
  playerId: PlayerId;
  onBack: () => void; // tilbake til StartScreen
  onConfirm: (character: CharacterDraft) => void;
};

type Step = "character" | "portrait";

export default function CharacterSelectScreen({
  gameMode,
  playerId,
  onBack,
  onConfirm,
}: Props) {
  const number = playerId === "player1" ? "1" : "2";
  const playerLabel =
    gameMode === "singlePlayer" ? `Character ${number}` : `Player ${number}`;

  const characters = useMemo(
    () => [
      {
        id: "char1" as const,
        selectImg: portrait1, // Standar bildet i "Character Select"
        portraits: [
          { id: "c1p1", src: portrait1 },
          { id: "c1p2", src: portrait2 },
          { id: "c1p3", src: portrait3 },
        ],
      },
      {
        id: "char2" as const,
        selectImg: portrait7, // Standar bildet i "Character Select"
        portraits: [
          { id: "c2p1", src: portrait7 },
          { id: "c2p2", src: portrait8 },
          { id: "c2p3", src: portrait9 },
        ],
      },
    ],
    [],
  );

  const [step, setStep] = useState<Step>("character");

  const [selectedCharId, setSelectedCharId] = useState<
    (typeof characters)[number]["id"] | null
  >(null);
  const [selectedPortraitId, setSelectedPortraitId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");

  const activeChar = characters.find((c) => c.id === selectedCharId) ?? null;
  const activePortraits = activeChar?.portraits ?? [];
  const selectedPortrait =
    activePortraits.find((p) => p.id === selectedPortraitId) ??
    activePortraits[0];

  const canContinue =
    name.trim().length > 0 && !!activeChar && !!selectedPortrait;

  return (
    <div
      className="h-screen w-full text-white grid place-items-center"
      style={{
        backgroundImage: `url(${startBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative w-full max-w-xl px-6">
        {/* STEP 1: Character Select */}
        {step === "character" && (
          <>
            <h2 className="text-4xl font-extrabold text-center">
              {playerLabel}: Character Select
            </h2>

            <div className="mt-10 flex justify-center gap-8">
              {characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCharId(c.id);
                    setSelectedPortraitId(c.portraits[0].id);
                    setStep("portrait");
                  }}
                  className="p-2 rounded-xl bg-white/10 border border-white/25 hover:bg-white/15"
                  aria-label={c.id}
                >
                  <img
                    src={c.selectImg}
                    alt=""
                    className="w-28 h-28 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              ))}
            </div>

            <div className="mt-12 flex justify-start">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15"
              >
                Back
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Select Portrait */}
        {step === "portrait" && activeChar && (
          <>
            <h2 className="text-4xl font-extrabold text-center">
              {playerLabel}: Select Portrait
            </h2>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {activePortraits.map((p) => {
                const active = p.id === selectedPortrait?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPortraitId(p.id)}
                    className={`p-1 rounded-lg border ${
                      active ? "border-white" : "border-white/20"
                    } bg-white/5 hover:bg-white/10`}
                    aria-label="Portrait"
                  >
                    <img
                      src={p.src}
                      alt=""
                      className="w-28 h-28 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </button>
                );
              })}
            </div>
            {/* Name-input: vises alltid */}
            <div className="mt-8">
              <label className="block text-sm text-white/70 mb-2">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 outline-none focus:border-white/50"
                placeholder="Skriv navn..."
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("character")}
                className="px-5 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!canContinue}
                onClick={() =>
                  onConfirm({
                    name: name.trim(),
                    portraitSrc: selectedPortrait.src,
                    characterId: activeChar.id,
                  })
                }
                className={`px-6 py-3 rounded-lg border ${
                  canContinue
                    ? "bg-white/10 border-white/30 hover:bg-white/15"
                    : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
