import startBackground from "../../assets/backgrounds/menu/startscreen.png";
import type { RoomConnection } from "../../network/protocol";

type Props = {
  connection: RoomConnection;
  sessionEnded: boolean;
};

export default function MultiplayerLobbyScreen({
  connection,
  sessionEnded,
}: Props) {
  const isReady = connection.lobby.status === "ready";

  return (
    <div
      className="relative grid h-screen w-full place-items-center text-white"
      style={{
        backgroundImage: `url(${startBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <main className="relative z-10 w-full max-w-md px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-wide">
          Pact & Peril
        </h1>

        {sessionEnded ? (
          <div className="mt-8 rounded-xl border border-red-300/25 bg-black/35 px-6 py-7">
            <p className="text-lg font-semibold">
              Connection lost. The run has ended.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/20 bg-black/35 px-6 py-7 shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
              Room Code
            </p>
            <p className="mt-2 text-5xl font-black tracking-[0.24em] text-amber-300">
              {connection.lobby.roomCode}
            </p>

            {connection.lobby.difficulty === "hard" && (
              <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-red-300">
                Hard Mode · Enemies do 25% more damage
              </p>
            )}

            <div className="mx-auto my-6 h-px w-full bg-white/15" />

            <p className="text-lg font-semibold" aria-live="polite">
              {isReady ? "Both players connected." : "Waiting for player 2..."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
