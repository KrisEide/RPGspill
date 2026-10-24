import { ITEM_DEFINITIONS } from "../../../data/items";
import { PASSIVE_DEFINITIONS } from "../../../data/passives";
import { STATUS_DEFINITIONS } from "../../../data/statuses";
import { SPIRIT_DEFINITIONS } from "../../../data/spirits";
import { resolveAbility } from "../../../game/abilities/abilityProgression";
import { isCharacterInstanceId } from "../../../game/playerControl";
import type {
  CombatantId,
  CombatEvent,
  StatusAppliedEvent,
} from "../../../game/types";

type Props = {
  events: CombatEvent[];
  getCombatantName: (combatantId: CombatantId) => string;
};

function getEmpoweredDamageBonus(event: StatusAppliedEvent) {
  const empoweredChange = event.statusChanges.find(
    (change) =>
      change.type === "applied" && change.status.id === "empowered",
  );

  return empoweredChange?.type === "applied"
    ? Math.round((empoweredChange.status.magnitude ?? 0) * 100)
    : 0;
}

export default function CombatLog({ events, getCombatantName }: Props) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="combatLog" aria-live="polite">
      {events.map((event, index) => (
        <div
          key={
            event.type === "postCombatRecovery"
              ? `post-combat-recovery-${index}`
              : event.type === "statusDamage"
              ? `${event.targetId}-${event.statusId}-${index}`
              : event.type === "phoenixRebirth"
                ? `${event.targetId}-phoenix-rebirth-${index}`
              : event.type === "soulTransfer"
                ? `${event.ghostId}-${event.targetId}-soul-${index}`
              : event.type === "spiritDamage"
                ? `${event.sourceId}-${event.spiritId}-${event.targetId}-${index}`
                : event.type === "itemUse"
                  ? `${event.actorId}-${event.itemId}-${index}`
                  : event.type === "skipTurn"
                    ? `${event.actorId}-stunned-${index}`
                    : event.type === "tailwind"
                      ? `${event.actorId}-tailwind-${index}`
                    : `${event.actorId}-${event.abilityId}-${index}`
          }
        >
          {event.type === "postCombatRecovery" ? (
            <>The party recovered after the battle.</>
          ) : event.type === "phoenixRebirth" ? (
            <>
              Phoenix returned {getCombatantName(event.targetId)} with {event.remainingHp} HP and {event.remainingBarrier} Barrier.
            </>
          ) : event.type === "soulTransfer" ? (
            <>
              Soul Link shared the party's remaining HP: {getCombatantName(event.targetId)}
              {" "}returned with {event.targetRemainingHp} HP and {getCombatantName(event.ghostId)}
              {" "}was left with {event.ghostRemainingHp} Ghost HP. The link broke.
            </>
          ) : event.type === "bloodpact" ? (
            <>
              Bloodpact{event.active ? " active" : ""}: {getCombatantName(event.targetId)}
              {event.stage === "sacrifice"
                ? ` lost ${event.hpLoss} HP as Sacrifice${event.ppRestored > 0 ? ` and restored ${event.ppRestored} PP` : ""}.`
                : ` gained ${event.barrierAmount} Barrier as Protected.`}
              {event.stage === "sacrifice" && event.characterState.form === "ghost"
                ? " Entered Ghost Form. The pact is paused."
                : ""}
            </>
          ) : event.type === "barrierRemoved" ? (
            <>
              {getCombatantName(event.actorId)} used Shatter Ward and removed{" "}
              {event.impacts.reduce(
                (total, impact) => total + impact.barrierRemoved,
                0,
              )}{" "}
              Barrier from the heroes.
            </>
          ) : event.type === "skipTurn" ? (
            event.reason === "chargeTargetUnavailable" ? (
              <>
                {getCombatantName(event.actorId)} lost the {event.skippedAbilityId
                  ? (resolveAbility(event.skippedAbilityId, 1)?.name ?? "charged ability")
                  : "charged ability"} charge because its target was no longer available.
              </>
            ) : (
              <>
                {getCombatantName(event.actorId)} was Stunned and lost the action.
                {event.statusChanges.some(
                  (change) =>
                    change.type === "removed" &&
                    change.statusId === "abilityCharge",
                )
                  ? ` ${event.skippedAbilityId ? (resolveAbility(event.skippedAbilityId, 1)?.name ?? "The charged ability") : "The charged ability"} was interrupted.`
                  : ""}
              </>
            )
          ) : event.type === "wake" ? (
            <>
              {getCombatantName(event.actorId)} woke{" "}
              {getCombatantName(event.targetId)}.
            </>
          ) : event.type === "wait" ? (
            event.abilityId === "rockScrape" ? (
              <>
                {getCombatantName(event.actorId)} used Rock Scrape, restored{" "}
                {event.healingAmount ?? 0} HP, cleansed all debuffs, and lost{" "}
                {event.defenseReduced ?? 0} Defense permanently.
              </>
            ) : (
              <>
                {getCombatantName(event.actorId)} caught their breath and
                restored {event.healingAmount ?? 0} HP.
              </>
            )
          ) : event.type === "defend" ? (
            <>
              {getCombatantName(event.actorId)} is defending.
              {event.barrierAmount > 0
                ? ` Brace granted ${event.barrierAmount} Barrier.`
                : ""}
            </>
          ) : event.type === "manaWard" ? (
            <>
              Mana Ward granted {getCombatantName(event.targetId)}{" "}
              {event.barrierAmount} Barrier.
            </>
          ) : event.type === "tailwind" ? (
            <>
              Tailwind {event.active ? "is ready" : "was consumed"} for{" "}
              {getCombatantName(event.actorId)}.
            </>
          ) : event.type === "selfDamage" ? (
            <>
              {getCombatantName(event.actorId)} lost {event.amount} HP to{" "}
              {resolveAbility(event.abilityId, event.abilityRank)?.name}.
              {event.characterState.form === "ghost"
                ? ` ${getCombatantName(event.actorId)} entered Ghost Form.`
                : ""}
            </>
          ) : event.type === "charge" ? (
            event.abilityId === "prepareSweep" ? (
              <>{getCombatantName(event.actorId)} began preparing a sweeping Multi Attack.</>
            ) : event.abilityId === "gatherDreadflame" ? (
              <>{getCombatantName(event.actorId)} gathered Dreadflame.</>
            ) : (
              <>{getCombatantName(event.actorId)} began charging {resolveAbility(event.abilityId, event.abilityRank)?.name ?? "an ability"}.</>
            )
          ) : event.type === "statusDamage" ? (
            <>
              {STATUS_DEFINITIONS[event.statusId].name} dealt{" "}
              {event.amount} damage to {getCombatantName(event.targetId)}.
              {(event.sourceHealingAmount ?? 0) > 0
                ? ` ${getCombatantName(event.sourceId)} restored ${event.sourceHealingAmount} HP.`
                : ""}
            </>
          ) : event.type === "statusApplied" ? (
            event.abilityId === "greenSlimeBuff" ? (
              <>
                {getCombatantName(event.actorId)} increased its damage to +
                {getEmpoweredDamageBonus(event)}%.
              </>
            ) : event.abilityId === "goatChargeUp" ? (
              <>
                {getCombatantName(event.targetId)} was marked for the next
                Charge and lost 5 Defense.
              </>
            ) : (
              <>
                {getCombatantName(event.actorId)} placed{" "}
                {resolveAbility(event.abilityId, event.abilityRank)?.name ??
                  "a status"}{" "}
                on{" "}
                {getCombatantName(event.targetId)}.
              </>
            )
          ) : event.type === "spiritDamage" ? (
            <>
              {SPIRIT_DEFINITIONS[event.spiritId].name} dealt {event.amount}{" "}
              Spirit {event.damageType === "physical"
                ? "Physical "
                : event.element
                  ? `${event.element[0].toUpperCase()}${event.element.slice(1)} `
                  : "Magical "}
              damage to{" "}
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
              {event.impacts.some((impact) =>
                impact.statusChanges.some(
                  (change) =>
                    change.type === "applied" &&
                    change.status.id === "cracked",
                ),
              )
                ? " Hit enemies became Cracked."
                : ""}
              {event.impacts.some((impact) =>
                impact.statusChanges.some(
                  (change) =>
                    change.type === "removed" &&
                    change.statusId === "bodyguard",
                ),
              )
                ? ` Bodyguard protected ${event.impacts
                    .filter((impact) =>
                      impact.statusChanges.some(
                        (change) =>
                          change.type === "removed" &&
                          change.statusId === "bodyguard",
                      ),
                    )
                    .map((impact) => getCombatantName(impact.targetId))
                    .join(" and ")}.`
                : ""}
            </>
          ) : event.type === "support" ? (
            event.abilityId === "magicBag" && event.gainedItemId ? (
              <>
                {getCombatantName(event.actorId)} found{
                  " "
                }{(event.gainedItemIds ?? [event.gainedItemId])
                  .map((itemId) => ITEM_DEFINITIONS[itemId]?.name ?? "an item")
                  .join(" and ")} in the Magic Bag.
              </>
            ) : event.abilityId === "possession" ? (
              <>
                {getCombatantName(event.actorId)} used Possession. {getCombatantName(event.targetId)} gained an additional action.
              </>
            ) : (
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
            )
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
              {event.itemId === "fuseDart" &&
              event.visualPhase === "impact" ? (
                <>Fuse Dart detonated.</>
              ) : (
                <>
                  {getCombatantName(event.actorId)} used{" "}
                  {ITEM_DEFINITIONS[event.itemId]?.name ?? "an item"}.
                </>
              )}
            </>
          ) : event.type === "earthDemonSummoned" ? (
            <>{getCombatantName(event.actorId)} summoned an Earth Demon.</>
          ) : event.type === "enemySummoned" ? (
            <>{getCombatantName(event.actorId)} called two Rockwhistlers.</>
          ) : event.type === "earthDemonHit" ? (
            <>Earth Demon absorbed {event.amount} damage{event.destroyed ? " and was destroyed" : ""}.</>
          ) : event.type === "earthDemonAttack" ? (
            <>Earth Demon dealt {event.amount} damage to {getCombatantName(event.targetId)}.</>
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
                ? ` ${event.reflectedDamage.passiveIds.map((passiveId) => passiveId === "guardDog" ? "Guard Dog" : PASSIVE_DEFINITIONS[passiveId].name).join(" and ")} dealt ${event.reflectedDamage.amount} damage to ${getCombatantName(event.reflectedDamage.targetId)}.`
                : ""}
              {event.statusChanges.some(
                (change) =>
                  change.type === "applied" &&
                  change.status.id === "stunned",
              )
                ? ` ${getCombatantName(event.targetId)} was Stunned.`
                : ""}
              {event.statusChanges.some(
                (change) =>
                  change.type === "removed" &&
                  change.statusId === "bodyguard",
              )
                ? ` Bodyguard protected ${getCombatantName(event.targetId)} from the attack.`
                : ""}
              {(event.actorHealingAmount ?? 0) > 0
                ? ` ${getCombatantName(event.actorId)} restored ${event.actorHealingAmount} Ghost HP.`
                : ""}
              {(event.actorPpRecoveryAmount ?? 0) > 0
                ? ` ${getCombatantName(event.actorId)} restored ${event.actorPpRecoveryAmount} PP.`
                : ""}
              {(event.linkedSupportImpact?.healingAmount ?? 0) > 0
                ? ` ${getCombatantName(event.linkedSupportImpact!.targetId)} restored ${event.linkedSupportImpact!.healingAmount} HP.`
                : ""}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
