import type { CharacterState, PlayerId } from "../../../game/types";

type Props = {
  characters: Record<PlayerId, CharacterState>;
  activePlayerId: PlayerId | null;
};

type CharacterStatusCardProps = {
  character: CharacterState;
  isActive: boolean;
};

const PLAYER_ORDER: PlayerId[] = ["player1", "player2"];

function getResourcePercent(current: number, maximum: number) {
  if (maximum <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (current / maximum) * 100));
}

function CharacterStatusCard({
  character,
  isActive,
}: CharacterStatusCardProps) {
  const hpPercent = getResourcePercent(character.hp, character.stats.maxHp);
  const ppPercent = getResourcePercent(character.pp, character.stats.maxPp);

  return (
    <article
      className={`statusCard ${isActive ? "statusCard--active" : ""}`}
    >
      <div className="statusCard__portraitFrame">
        <img
          className="statusCard__portrait"
          src={character.portraitSrc}
          alt={`${character.name} portrait`}
        />
      </div>

      <div className="statusCard__content">
        <div className="statusCard__heading">
          <h2 className="statusCard__name">{character.name}</h2>
          <span className="statusCard__level">Lv. {character.level}</span>
        </div>

        <div className="statusCard__resource">
          <div className="statusCard__resourceLabel">
            <span className="statusCard__resourceIcon statusCard__resourceIcon--hp">
              ♥
            </span>
            <span>
              HP {character.hp} / {character.stats.maxHp}
            </span>
          </div>
          <div
            className="statusCard__bar"
            role="progressbar"
            aria-label={`${character.name} HP`}
            aria-valuemin={0}
            aria-valuemax={character.stats.maxHp}
            aria-valuenow={character.hp}
          >
            <div
              className="statusCard__barFill statusCard__barFill--hp"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div className="statusCard__resource">
          <div className="statusCard__resourceLabel">
            <span className="statusCard__resourceIcon statusCard__resourceIcon--pp">
              ✦
            </span>
            <span>
              PP {character.pp} / {character.stats.maxPp}
            </span>
          </div>
          <div
            className="statusCard__bar"
            role="progressbar"
            aria-label={`${character.name} PP`}
            aria-valuemin={0}
            aria-valuemax={character.stats.maxPp}
            aria-valuenow={character.pp}
          >
            <div
              className="statusCard__barFill statusCard__barFill--pp"
              style={{ width: `${ppPercent}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PartyStatusPanel({
  characters,
  activePlayerId,
}: Props) {
  return (
    <aside className="partyStatus" aria-label="Party status">
      {PLAYER_ORDER.map((playerId) => (
        <CharacterStatusCard
          key={playerId}
          character={characters[playerId]}
          isActive={playerId === activePlayerId}
        />
      ))}
    </aside>
  );
}
