import startBackground from "../../assets/backgrounds/menu/startscreen.png";
import type {
  CharacterReadinessState,
  RoomConnection,
} from "../../network/protocol";

type Props = {
  connection: RoomConnection;
  readiness: CharacterReadinessState | null;
  sessionEnded: boolean;
};

export default function MultiplayerCharacterReadyScreen({
  connection,
  readiness,
  sessionEnded,
}: Props) {
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

        <div className="mt-8 rounded-xl border border-white/20 bg-black/35 px-6 py-7 shadow-2xl backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
            Room {connection.lobby.roomCode}
          </p>
          <p className="mt-5 text-xl font-bold" aria-live="polite">
            {sessionEnded
              ? "Connection lost. The run has ended."
              : readiness?.allPlayersReady
                ? "Both characters are ready."
                : "Waiting for the other player..."}
          </p>
        </div>
      </main>
    </div>
  );
}
