import { useState } from "react";
import startBackground from "../../assets/backgrounds/menu/startscreen.png";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import type { EncounterId } from "../../game/types";

type Props = {
  onSinglePlayer: () => void;
  onDevelopmentStart: (encounterId: EncounterId) => void;
  onCreateGame: () => Promise<void>;
  onJoinGame: (roomCode: string) => Promise<void>;
};

type Menu = "gameMode" | "twoPlayer";

const ROOM_CODE_LENGTH = 4;
const DEVELOPMENT_ENCOUNTERS = Object.values(ENCOUNTER_DEFINITIONS).sort(
  (first, second) => first.number - second.number,
);

function normalizeRoomCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

export default function StartScreen({
  onSinglePlayer,
  onDevelopmentStart,
  onCreateGame,
  onJoinGame,
}: Props) {
  const [menu, setMenu] = useState<Menu>("gameMode");
  const [roomCode, setRoomCode] = useState("");
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [developmentMenuOpen, setDevelopmentMenuOpen] = useState(false);
  const canJoin = roomCode.length === ROOM_CODE_LENGTH;

  const runMultiplayerRequest = async (request: () => Promise<void>) => {
    setRequestInProgress(true);
    setRequestError(null);

    try {
      await request();
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Could not connect.",
      );
    } finally {
      setRequestInProgress(false);
    }
  };

  const submitRoomCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canJoin && !requestInProgress) {
      void runMultiplayerRequest(() => onJoinGame(roomCode));
    }
  };

  const activateFlowerShortcut = (
    event: React.MouseEvent<SVGCircleElement>,
  ) => {
    if (event.shiftKey) {
      setDevelopmentMenuOpen(true);
      return;
    }

    onDevelopmentStart("forestAmbush");
  };

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

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1536 1024"
      >
        <circle
          cx="98"
          cy="778"
          r="29"
          fill="transparent"
          onClick={activateFlowerShortcut}
          pointerEvents="all"
          style={{ cursor: "pointer" }}
        />
      </svg>

      <div className="relative z-10 grid h-full place-items-center">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-wide">
            Pact & Peril
          </h1>
          <p className="mt-3 text-white/80">
            {" "}
            A two player Turn-based roguelike RPG
          </p>

          {menu === "gameMode" ? (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSinglePlayer}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 active:scale-[0.98]"
              >
                Single Player
              </button>

              <button
                type="button"
                onClick={() => setMenu("twoPlayer")}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 active:scale-[0.98]"
              >
                2 Player
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-8 w-full max-w-xs">
              <button
                type="button"
                disabled={requestInProgress}
                onClick={() => void runMultiplayerRequest(onCreateGame)}
                className="w-full px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 active:scale-[0.98]"
              >
                {requestInProgress ? "Connecting..." : "Create Game"}
              </button>

              <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                <span className="h-px flex-1 bg-white/20" />
                Or
                <span className="h-px flex-1 bg-white/20" />
              </div>

              <form onSubmit={submitRoomCode}>
                <label
                  htmlFor="room-code"
                  className="mb-2 block text-left text-sm text-white/75"
                >
                  Enter Code
                </label>
                <input
                  id="room-code"
                  value={roomCode}
                  disabled={requestInProgress}
                  onChange={(event) =>
                    setRoomCode(normalizeRoomCode(event.target.value))
                  }
                  autoComplete="off"
                  inputMode="text"
                  maxLength={ROOM_CODE_LENGTH}
                  placeholder="F7K2"
                  aria-describedby="room-code-hint"
                  className="w-full rounded-lg border border-white/20 bg-black/25 px-4 py-3 text-center text-xl font-bold uppercase tracking-[0.35em] outline-none placeholder:text-white/25 focus:border-white/55"
                />
                <span id="room-code-hint" className="sr-only">
                  Enter a four character room code
                </span>

                <button
                  type="submit"
                  disabled={!canJoin || requestInProgress}
                  className={`mt-3 w-full rounded-lg border px-6 py-3 ${
                    canJoin && !requestInProgress
                      ? "border-white/20 bg-white/10 hover:bg-white/15 active:scale-[0.98]"
                      : "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                  }`}
                >
                  {requestInProgress ? "Connecting..." : "Join Game"}
                </button>
              </form>

              {requestError && (
                <p className="mt-3 text-sm font-semibold text-red-300" role="alert">
                  {requestError}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setRoomCode("");
                  setMenu("gameMode");
                }}
                className="mt-5 px-5 py-2 text-sm text-white/70 hover:text-white"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>

      {developmentMenuOpen && (
        <div
          className="absolute inset-0 z-30 grid place-items-center bg-black/55 px-5"
          onClick={() => setDevelopmentMenuOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-amber-300/45 bg-[#07150d]/95 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/70">
              Development shortcut
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">
              Select Encounter
            </h2>
            <div className="mt-5 grid gap-2">
              {DEVELOPMENT_ENCOUNTERS.map((encounter) => {
                return (
                  <button
                    key={encounter.id}
                    type="button"
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left hover:border-amber-300/55 hover:bg-white/10 active:scale-[0.99]"
                    onClick={() => onDevelopmentStart(encounter.id)}
                  >
                    <span className="font-bold">{encounter.title}</span>
                    <span className="text-sm text-white/60">
                      Encounter {encounter.number}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-5 w-full px-4 py-2 text-sm text-white/65 hover:text-white"
              onClick={() => setDevelopmentMenuOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
