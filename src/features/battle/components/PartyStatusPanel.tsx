import { useEffect, useRef, useState } from "react";
import type {
  CharacterInstanceId,
  CharacterState,
} from "../../../game/types";
import { CHARACTER_ORDER } from "../../../game/playerControl";
import { getCharacterPortraitSource } from "../../characterSelect/data/characterOptions";
import { ABILITIES } from "../../../data/abilities";
import { STATUS_DEFINITIONS } from "../../../data/statuses";
import {
  getCharacterMaxHp,
  getCharacterMaxPp,
} from "../../../game/ghost/ghostSystem";

type Props = {
  characters: Record<CharacterInstanceId, CharacterState>;
  activeCharacterId: CharacterInstanceId | null;
  variant?: "battle" | "camp";
  showResourceChanges?: boolean;
  lastLivingHeroName?: string | null;
};

type CharacterStatusCardProps = {
  character: CharacterState;
  isActive: boolean;
  showResourceChanges: boolean;
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
  showResourceChanges,
}: CharacterStatusCardProps) {
  const previousHpRef = useRef(character.hp);
  const previousPpRef = useRef(character.pp);
  const [resourceGain, setResourceGain] = useState({ hp: 0, pp: 0 });
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
  const poisonStatus = character.statuses.find(
    (status) => status.id === "poison",
  );
  const bleedStatus = character.statuses.find(
    (status) => status.id === "bleed",
  );
  const goatChargeMark = character.statuses.find(
    (status) =>
      status.id === "cracked" && status.readiedAbilityId === "goatCharge",
  );
  const poisonDamage =
    poisonStatus?.tickBasePower ??
    STATUS_DEFINITIONS.poison.endOfRoundDamage?.basePower ??
    0;
  const bleedDamage =
    bleedStatus?.tickBasePower ??
    STATUS_DEFINITIONS.bleed.endOfRoundDamage?.basePower ??
    0;
  const abilityCharge = character.statuses.find(
    (status) => status.id === "abilityCharge",
  );
  const hasBodyguard = character.statuses.some(
    (status) => status.id === "bodyguard",
  );
  const ironquillStacks =
    character.form === "living"
      ? (character.spirits.ironquill?.steelDartAbilityBonusStacks ?? 0)
      : 0;
  const tailwindIsActive = Boolean(
    character.form === "living" &&
      character.passiveCombatState.tailwindActive,
  );
  const chargedAbility = abilityCharge?.readiedAbilityId
    ? ABILITIES[abilityCharge.readiedAbilityId]
    : null;

  useEffect(() => {
    const hpGain = Math.max(0, character.hp - previousHpRef.current);
    const ppGain = Math.max(0, character.pp - previousPpRef.current);
    previousHpRef.current = character.hp;
    previousPpRef.current = character.pp;

    if (!showResourceChanges || (hpGain === 0 && ppGain === 0)) {
      return;
    }

    setResourceGain({ hp: hpGain, pp: ppGain });
    const timer = window.setTimeout(() => {
      setResourceGain({ hp: 0, pp: 0 });
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [character.hp, character.pp, showResourceChanges]);

  const isRecovering = resourceGain.hp > 0 || resourceGain.pp > 0;

  return (
    <article
      className={`statusCard ${isActive ? "statusCard--active" : ""} statusCard--${character.form} ${isRecovering ? "statusCard--recovering" : ""}`}
    >
      <div className="statusCard__portraitFrame">
        <img
          className="statusCard__portrait"
          src={getCharacterPortraitSource(character)}
          alt={`${character.name} portrait`}
        />
      </div>

      <div className="statusCard__content">
        <div className="statusCard__heading">
          <h2 className="statusCard__name">{character.name}</h2>
          <div className="statusCard__headingMeta">
            {chargedAbility && (
              <span
                className="statusCard__turnPriority"
                aria-label={`Charging ${chargedAbility.name}`}
                title={`${chargedAbility.name}: The charged ability will be used next turn.`}
              >
                {chargedAbility.element === "water" ? "💧" : "🪨"}
              </span>
            )}
            {isStunned && (
              <span
                className="statusCard__stunned"
                aria-label="Stunned: the next action will be lost"
                title="Stunned: The next action will be lost."
              >
                💫
              </span>
            )}
            {hasBodyguard && (
              <span
                className="statusCard__turnPriority"
                aria-label="Bodyguard: the next damaging enemy attack is negated"
                title="Bodyguard: The next enemy attack that would damage this hero deals 0 damage instead."
              >
                🐕🛡️
              </span>
            )}
            {ironquillStacks > 0 && (
              <span
                className="statusCard__turnPriority"
                aria-label={`Ironquill: next damaging ability deals ${ironquillStacks * 10}% more damage`}
                title={`Ironquill: Your next damaging ability deals ${ironquillStacks * 10}% more damage.`}
              >
                📍+{ironquillStacks * 10}%
              </span>
            )}
            {tailwindIsActive && (
              <span
                className="statusCard__turnPriority statusCard__tailwind"
                aria-label="Tailwind: the next Wind ability deals 25% more damage"
                title="Tailwind: Your next Wind ability deals 25% more damage."
              >
                🌬️ +25%
              </span>
            )}
            {poisonStatus && (
              <span
                className="statusCard__poison"
                aria-label={`Poison: ${poisonDamage} damage at the end of each round`}
                title={`Poison: Take ${poisonDamage} damage at the end of each round. Lasts until combat ends.`}
              >
                ☠️ {poisonDamage}
              </span>
            )}
            {bleedStatus && (
              <span
                className="statusCard__bleed"
                aria-label={`Bleed: ${bleedDamage} damage at the end of each round, ${bleedStatus.remainingRounds ?? 1} rounds remaining`}
                title={`Bleed: ${bleedDamage} damage at the end of each round · ${bleedStatus.remainingRounds ?? 1} rounds remaining`}
              >
                🩸 {bleedDamage}
              </span>
            )}
            {goatChargeMark && (
              <span
                className="statusCard__turnPriority"
                aria-label="Cracked: marked for the next goat Charge"
                title="Cracked: Marked for the next goat Charge. Defense and Resistance are reduced by 5 until it hits."
              >
                🪨−5
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
            {resourceGain.hp > 0 && (
              <span className="statusCard__resourceGain statusCard__resourceGain--hp">
                +{resourceGain.hp}
              </span>
            )}
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
            {resourceGain.pp > 0 && (
              <span className="statusCard__resourceGain statusCard__resourceGain--pp">
                +{resourceGain.pp}
              </span>
            )}
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
  variant = "battle",
  showResourceChanges = false,
  lastLivingHeroName = null,
}: Props) {
  return (
    <aside
      className={`partyStatus partyStatus--${variant} ${showResourceChanges ? "partyStatus--showResourceChanges" : ""}`}
      aria-label="Party status"
    >
      {CHARACTER_ORDER.map((characterId) => (
        <CharacterStatusCard
          key={characterId}
          character={characters[characterId]}
          isActive={characterId === activeCharacterId}
          showResourceChanges={showResourceChanges}
        />
      ))}
      {lastLivingHeroName && (
        <div className="lastLivingWarning" role="status">
          <strong>Last living hero</strong>
          <span>If {lastLivingHeroName} falls, the battle is lost.</span>
        </div>
      )}
    </aside>
  );
}
