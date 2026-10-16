import { useState } from "react";
import startBackground from "../../assets/backgrounds/menu/startscreen.png";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { PASSIVE_REWARD_POOL } from "../../data/passives";
import type {
  CharacterInstanceId,
  EncounterId,
  PassiveCategory,
  PassiveId,
} from "../../game/types";

type Props = {
  onSinglePlayer: () => void;
  onDevelopmentStart: (
    encounterId: EncounterId,
    passives?: Partial<Record<CharacterInstanceId, PassiveId[]>>,
    startInGhostForm?: boolean,
  ) => void;
  onCreateGame: () => Promise<void>;
  onJoinGame: (roomCode: string) => Promise<void>;
};

type Menu = "gameMode" | "twoPlayer";

const ROOM_CODE_LENGTH = 4;
const DEVELOPMENT_ENCOUNTERS = Object.values(ENCOUNTER_DEFINITIONS).sort(
  (first, second) => first.number - second.number,
);
const PASSIVE_CATEGORY_ORDER: PassiveCategory[] = [
  "bleed",
  "burn",
  "barrier",
  "healing",
  "wind",
  "physical",
  "coop",
  "items",
];
const PASSIVE_CATEGORY_LABELS: Record<PassiveCategory, string> = {
  bleed: "Bleed",
  burn: "Burn",
  barrier: "Barrier",
  healing: "Healing",
  wind: "Wind",
  physical: "Physical",
  coop: "Co-op",
  items: "Items",
};
const DEVELOPMENT_CHARACTERS = [
  { id: "character-1", name: "Rowan" },
  { id: "character-2", name: "Lyra" },
] as const;

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
  const [developmentStartInGhostForm, setDevelopmentStartInGhostForm] =
    useState(false);
  const [developmentPassives, setDevelopmentPassives] = useState<
    Record<CharacterInstanceId, PassiveId[]>
  >({
    "character-1": [],
    "character-2": [],
  });
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

    onDevelopmentStart("slimeTrail");
  };

  const toggleDevelopmentPassive = (
    characterId: CharacterInstanceId,
    passiveId: PassiveId,
  ) => {
    setDevelopmentPassives((current) => {
      const selected = current[characterId];
      const nextSelected = selected.includes(passiveId)
        ? selected.filter((candidate) => candidate !== passiveId)
        : [...selected, passiveId];

      return { ...current, [characterId]: nextSelected };
    });
  };

  const clearDevelopmentPassives = () => {
    setDevelopmentPassives({
      "character-1": [],
      "character-2": [],
    });
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

      <p className="absolute left-5 top-5 z-20 text-xl font-semibold text-white/90 drop-shadow-md sm:left-8 sm:top-8 sm:text-2xl">
        Laget av Kristoffer Eide
      </p>

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
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-amber-300/45 bg-[#07150d]/95 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/70">
              Development shortcut
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mt-2 text-2xl font-extrabold">
                  Combat Test Setup
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Passives are disabled unless selected below.
                </p>
              </div>
              <button
                type="button"
                className="mt-2 shrink-0 rounded-md border border-white/15 px-3 py-2 text-xs font-bold text-white/65 hover:border-white/35 hover:text-white"
                onClick={clearDevelopmentPassives}
              >
                Clear passives
              </button>
            </div>

            <div className="mt-5 min-h-0 overflow-y-auto pr-2">
              <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center border-b border-white/15 px-3 pb-2 text-center text-xs font-extrabold uppercase tracking-wider text-white/65">
                <span className="text-left">Passive</span>
                {DEVELOPMENT_CHARACTERS.map((character) => (
                  <span key={character.id}>{character.name}</span>
                ))}
              </div>

              {PASSIVE_CATEGORY_ORDER.map((category) => (
                <section key={category} className="mt-3">
                  <h3 className="px-3 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300/75">
                    {PASSIVE_CATEGORY_LABELS[category]}
                  </h3>
                  <div className="mt-1 overflow-hidden rounded-lg border border-white/10">
                    {PASSIVE_REWARD_POOL.filter(
                      (passive) => passive.category === category,
                    ).map((passive) => (
                      <div
                        key={passive.id}
                        className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center border-b border-white/10 bg-white/[0.035] px-3 py-2 last:border-b-0 hover:bg-white/[0.07]"
                        title={passive.description}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2 font-bold">
                            <span aria-hidden="true">{passive.icon}</span>
                            <span>{passive.name}</span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-white/50">
                            {passive.description}
                          </p>
                        </div>
                        {DEVELOPMENT_CHARACTERS.map((character) => (
                          <label
                            key={character.id}
                            className="grid cursor-pointer place-items-center"
                          >
                            <input
                              type="checkbox"
                              className="h-5 w-5 cursor-pointer accent-amber-400"
                              checked={developmentPassives[
                                character.id
                              ].includes(passive.id)}
                              onChange={() =>
                                toggleDevelopmentPassive(
                                  character.id,
                                  passive.id,
                                )
                              }
                              aria-label={`${passive.name} for ${character.name}`}
                            />
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <h3 className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300/75">
                Starting form
              </h3>
              <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3 hover:border-amber-300/40 hover:bg-white/[0.08]">
                <input
                  type="checkbox"
                  className="h-5 w-5 cursor-pointer accent-amber-400"
                  checked={developmentStartInGhostForm}
                  onChange={(event) =>
                    setDevelopmentStartInGhostForm(event.target.checked)
                  }
                />
                <span>
                  <span className="block font-bold">
                    Start both in Ghost Form
                  </span>
                  <span className="mt-0.5 block text-xs text-white/55">
                    Rowan and Lyra begin with 30 Ghost HP and 20 Ghost PP.
                  </span>
                </span>
              </label>

              <h3 className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300/75">
                Start at encounter
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DEVELOPMENT_ENCOUNTERS.map((encounter) => (
                  <button
                    key={encounter.id}
                    type="button"
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left hover:border-amber-300/55 hover:bg-white/10 active:scale-[0.99]"
                    onClick={() =>
                      onDevelopmentStart(
                        encounter.id,
                        {
                          "character-1": [
                            ...developmentPassives["character-1"],
                          ],
                          "character-2": [
                            ...developmentPassives["character-2"],
                          ],
                        },
                        developmentStartInGhostForm,
                      )
                    }
                  >
                    <span className="font-bold">{encounter.title}</span>
                    <span className="ml-3 text-sm text-white/60">
                      {encounter.number}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full shrink-0 px-4 py-2 text-sm text-white/65 hover:text-white"
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
