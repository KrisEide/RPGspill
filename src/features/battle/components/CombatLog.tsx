import { ITEM_DEFINITIONS } from "../../../data/items";
import { resolveAbility } from "../../../game/abilities/abilityProgression";
import { isCharacterInstanceId } from "../../../game/playerControl";
import type { CombatantId, CombatEvent } from "../../../game/types";

type Props = {
  events: CombatEvent[];
  getCombatantName: (combatantId: CombatantId) => string;
};

export default function CombatLog({ events, getCombatantName }: Props) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="combatLog" aria-live="polite">
      {events.map((event, index) => (
        <div
          key={
            event.type === "statusDamage"
              ? `${event.targetId}-${event.statusId}-${index}`
              : event.type === "spiritDamage"
                ? `${event.sourceId}-${event.spiritId}-${event.targetId}-${index}`
                : event.type === "itemUse"
                  ? `${event.actorId}-${event.itemId}-${index}`
                  : event.type === "skipTurn"
                    ? `${event.actorId}-stunned-${index}`
                    : `${event.actorId}-${event.abilityId}-${index}`
          }
        >
          {event.type === "skipTurn" ? (
            <>
              {getCombatantName(event.actorId)} was Stunned and lost the action.
            </>
          ) : event.type === "wake" ? (
            <>
              {getCombatantName(event.actorId)} woke{" "}
              {getCombatantName(event.targetId)}.
            </>
          ) : event.type === "wait" ? (
            <>{getCombatantName(event.actorId)} caught their breath.</>
          ) : event.type === "defend" ? (
            <>{getCombatantName(event.actorId)} is defending.</>
          ) : event.type === "charge" ? (
            <>{getCombatantName(event.actorId)} gathered Dreadflame.</>
          ) : event.type === "statusDamage" ? (
            <>
              {event.statusId === "bleed" ? "Bleed" : "Burn"} dealt{" "}
              {event.amount} damage to {getCombatantName(event.targetId)}.
            </>
          ) : event.type === "spiritDamage" ? (
            <>
              Embertail dealt {event.amount} Spirit Fire damage to{" "}
              {getCombatantName(event.targetId)}
              {event.absorbedByBarrier > 0
                ? `; Barrier absorbed ${event.absorbedByBarrier}`
                : ""}
              .
            </>
          ) : event.type === "multiTargetDamage" ? (
            <>
              {getCombatantName(event.actorId)} used{" "}
              {resolveAbility(event.abilityId, event.abilityRank)?.name} and hit{" "}
              {event.impacts.length}{" "}
              {isCharacterInstanceId(event.actorId) ? "enemies" : "heroes"}.
            </>
          ) : event.type === "support" ? (
            <>
              {getCombatantName(event.actorId)} used{" "}
              {resolveAbility(event.abilityId, event.abilityRank)?.name} on{" "}
              {getCombatantName(event.targetId)}
              {event.healingAmount > 0
                ? ` and restored ${event.healingAmount} HP`
                : ""}
              {event.barrierAmount > 0
                ? ` and granted ${event.barrierAmount} Barrier`
                : ""}
              .
            </>
          ) : event.type === "multiTargetSupport" ? (
            <>
              {getCombatantName(event.actorId)} used{" "}
              {resolveAbility(event.abilityId, event.abilityRank)?.name}:{" "}
              {event.impacts
                .map((impact) =>
                  impact.barrierAmount > 0
                    ? `${getCombatantName(impact.targetId)} gained ${impact.barrierAmount} Barrier`
                    : `${getCombatantName(impact.targetId)} received support`,
                )
                .join("; ")}
              .
            </>
          ) : event.type === "itemUse" ? (
            <>
              {getCombatantName(event.actorId)} used{" "}
              {ITEM_DEFINITIONS[event.itemId]?.name ?? "an item"}.
            </>
          ) : (
            <>
              {event.isCritical ? "Critical hit! " : ""}
              {getCombatantName(event.actorId)} dealt {event.amount} damage to{" "}
              {getCombatantName(event.targetId)}
              {event.absorbedByBarrier > 0
                ? `; Barrier absorbed ${event.absorbedByBarrier}`
                : ""}
              .
              {event.reflectedDamage
                ? ` Thorns dealt ${event.reflectedDamage.amount} damage to ${getCombatantName(event.reflectedDamage.targetId)}.`
                : ""}
              {event.statusChanges.some(
                (change) =>
                  change.type === "applied" &&
                  change.status.id === "stunned",
              )
                ? ` ${getCombatantName(event.targetId)} was Stunned.`
                : ""}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
