import { hasPassive } from "../../../data/passives";
import { PASSIVE_VALUES } from "../../../game/passives/passiveSystem";
import type { KnownPassives } from "../../../game/types";

export type DefendPassiveBonus = {
  name: string;
  effect: string;
};

export function getDefendPassiveBonuses(
  passives: KnownPassives,
): DefendPassiveBonus[] {
  const bonuses: DefendPassiveBonus[] = [];

  if (hasPassive(passives, "leaveItToMe")) {
    bonuses.push({
      name: "Leave It to Me",
      effect: `Ally's next damaging ability deals +${Math.round(PASSIVE_VALUES.leaveItToMeDamageBonus * 100)}% damage`,
    });
  }

  if (hasPassive(passives, "brace")) {
    bonuses.push({
      name: "Brace",
      effect: `+${PASSIVE_VALUES.braceBarrier} Barrier`,
    });
  }

  if (hasPassive(passives, "counterguard")) {
    bonuses.push({
      name: "Counterguard",
      effect: `Attackers take ${PASSIVE_VALUES.counterguardDamage} Physical damage`,
    });
  }

  return bonuses;
}
