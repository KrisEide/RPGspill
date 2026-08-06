import { useState } from "react";

import startBackground from "../../assets/backgrounds/menu/StartScreen.png";
import {
  CHARACTER_OPTIONS,
  getPortraitSource,
} from "./data/characterOptions";
import type {
  CharacterDraft,
  CharacterPresetId,
  GameMode,
  PlayerId,
  PortraitId,
} from "../../game/types";

type Props = {
  gameMode: GameMode;
  playerId: PlayerId;
  onBack?: () => void;
  onConfirm: (character: CharacterDraft) => void | Promise<void>;
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

  const [step, setStep] = useState<Step>("character");
  const [selectedCharId, setSelectedCharId] =
    useState<CharacterPresetId | null>(null);
  const [selectedPortraitId, setSelectedPortraitId] =
    useState<PortraitId | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeChar =
    CHARACTER_OPTIONS.find((character) => character.id === selectedCharId) ??
    null;
  const activePortraitIds = activeChar?.portraitIds ?? [];
  const selectedPortrait =
    activePortraitIds.find((portraitId) => portraitId === selectedPortraitId) ??
    activePortraitIds[0];

  const canContinue =
    name.trim().length > 0 && !!activeChar && !!selectedPortrait;

  const confirmSelection = async () => {
    if (!activeChar || !selectedPortrait || !canContinue || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onConfirm({
        name: name.trim(),
        portraitId: selectedPortrait,
        presetId: activeChar.id,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Character selection could not be submitted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {CHARACTER_OPTIONS.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => {
                    setSelectedCharId(character.id);
                    setSelectedPortraitId(character.portraitIds[0]);
                    setStep("portrait");
                  }}
                  className="p-2 rounded-xl bg-white/10 border border-white/25 hover:bg-white/15"
                  aria-label={character.id}
                >
                  <img
                    src={getPortraitSource(character.selectPortraitId)}
                    alt=""
                    className="w-28 h-28 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              ))}
            </div>

            {onBack && (
              <div className="mt-12 flex justify-start">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15"
                >
                  Back
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Select Portrait */}
        {step === "portrait" && activeChar && (
          <>
            <h2 className="text-4xl font-extrabold text-center">
              {playerLabel}: Select Portrait
            </h2>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {activePortraitIds.map((portraitId) => {
                const active = portraitId === selectedPortrait;
                return (
                  <button
                    key={portraitId}
                    type="button"
                    onClick={() => setSelectedPortraitId(portraitId)}
                    className={`p-1 rounded-lg border ${
                      active ? "border-white" : "border-white/20"
                    } bg-white/5 hover:bg-white/10`}
                    aria-label="Portrait"
                  >
                    <img
                      src={getPortraitSource(portraitId)}
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
                disabled={!canContinue || isSubmitting}
                onClick={() => void confirmSelection()}
                className={`px-6 py-3 rounded-lg border ${
                  canContinue && !isSubmitting
                    ? "bg-white/10 border-white/30 hover:bg-white/15"
                    : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Ready..." : "Continue"}
              </button>
            </div>

            {submitError && (
              <p className="mt-4 text-center text-sm font-semibold text-red-300" role="alert">
                {submitError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
