import type {
  CharacterInstanceId,
  CharacterState,
} from "../../../game/types";
import { CHARACTER_ORDER } from "../../../game/playerControl";
import { getPortraitSource } from "../../characterSelect/data/characterOptions";

type Props = {
  characters: Record<CharacterInstanceId, CharacterState>;
  activeCharacterId: CharacterInstanceId | null;
};

type CharacterStatusCardProps = {
  character: CharacterState;
  isActive: boolean;
};

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
          src={getPortraitSource(character.portraitId)}
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
  activeCharacterId,
}: Props) {
  return (
    <aside className="partyStatus" aria-label="Party status">
      {CHARACTER_ORDER.map((characterId) => (
        <CharacterStatusCard
          key={characterId}
          character={characters[characterId]}
          isActive={characterId === activeCharacterId}
        />
      ))}
    </aside>
  );
}
