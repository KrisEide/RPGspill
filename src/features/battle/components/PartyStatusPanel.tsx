import type {
  CharacterInstanceId,
  CharacterState,
} from "../../../game/types";
import { CHARACTER_ORDER } from "../../../game/playerControl";
import { getPortraitSource } from "../../characterSelect/data/characterOptions";
import {
  getCharacterMaxHp,
  getCharacterMaxPp,
} from "../../../game/ghost/ghostSystem";

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
  const maxHp = getCharacterMaxHp(character);
  const maxPp = getCharacterMaxPp(character);
  const hpPercent = getResourcePercent(character.hp, maxHp);
  const ppPercent = getResourcePercent(character.pp, maxPp);
  const swiftWingIsActive = Boolean(
    character.form === "living" &&
      character.spirits.swiftWing?.roundPriorityActive,
  );
  const isStunned = character.statuses.some(
    (status) => status.id === "stunned",
  );

  return (
    <article
      className={`statusCard ${isActive ? "statusCard--active" : ""} statusCard--${character.form}`}
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
          <div className="statusCard__headingMeta">
            {isStunned && (
              <span
                className="statusCard__stunned"
                aria-label="Stunned: the next action will be lost"
                title="Stunned: The next action will be lost."
              >
                💫
              </span>
            )}
            {swiftWingIsActive && (
              <span
                className="statusCard__turnPriority"
                aria-label="Swift Wing is active: acts first this round"
                title="Swift Wing: Acts first this round."
              >
                🪽
              </span>
            )}
            <span className="statusCard__level">
              {character.form === "ghost"
                ? "Ghost"
                : character.form === "permanentlyDead"
                  ? "Fallen"
                  : `Lv. ${character.level}`}
            </span>
          </div>
        </div>

        <div className="statusCard__resource">
          <div className="statusCard__resourceLabel">
            <span className="statusCard__resourceIcon statusCard__resourceIcon--hp">
              ♥
            </span>
            <span>
              HP {character.hp} / {maxHp}
            </span>
            {character.barrier > 0 && (
              <span
                className="statusCard__barrier"
                aria-label={`${character.barrier} Barrier`}
                title="Barrier absorbs direct damage before HP."
              >
                🛡 {character.barrier}
              </span>
            )}
          </div>
          <div
            className="statusCard__bar"
            role="progressbar"
            aria-label={`${character.name} HP`}
            aria-valuemin={0}
            aria-valuemax={maxHp}
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
              PP {character.pp} / {maxPp}
            </span>
          </div>
          <div
            className="statusCard__bar"
            role="progressbar"
            aria-label={`${character.name} PP`}
            aria-valuemin={0}
            aria-valuemax={maxPp}
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
