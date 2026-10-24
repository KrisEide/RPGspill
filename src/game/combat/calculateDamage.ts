import type {
  ActiveStatus,
  CombatStats,
  DamageEffect,
  Element,
} from "../types";
import { STATUS_DEFINITIONS } from "../../data/statuses";
import {
  calculateStatDamageReduction,
  combineDamageReductions,
} from "./damageMitigation";

type CalculateDamageParams = {
  attacker: CombatStats;
  defender: CombatStats;
  defenderStatuses?: ActiveStatus[];
  element: Element | null;
  effect: DamageEffect;
  additionalDamageReductions?: number[];
};

type CalculateFixedDamageParams = {
  basePower: number;
  damageType: DamageEffect["damageType"];
  defender: CombatStats;
  defenderStatuses?: ActiveStatus[];
};

function getEffectiveDefensiveStat(
  defender: CombatStats,
  statuses: ActiveStatus[],
  stat: "defense" | "resistance",
) {
  const totalReduction = statuses.reduce(
    (sum, status) =>
      sum +
      (STATUS_DEFINITIONS[status.id].defensiveStatReduction?.[stat] ?? 0) *
        (status.magnitude ?? 1),
    0,
  );

  return Math.max(0, defender[stat] - totalReduction);
}

export function calculateFixedDamage({
  basePower,
  damageType,
  defender,
  defenderStatuses = [],
}: CalculateFixedDamageParams) {
  if (damageType === "true") {
    return Math.max(1, Math.round(basePower));
  }

  const defensiveStat =
    damageType === "physical"
      ? getEffectiveDefensiveStat(defender, defenderStatuses, "defense")
      : getEffectiveDefensiveStat(defender, defenderStatuses, "resistance");
  const damageReduction = calculateStatDamageReduction(defensiveStat);

  return Math.max(1, Math.round(basePower * (1 - damageReduction)));
}

export function calculateDamage({
  attacker,
  defender,
  defenderStatuses = [],
  element,
  effect,
  additionalDamageReductions = [],
}: CalculateDamageParams) {
  const attackPower = attacker.attack * effect.attackScaling;
  const elementalPower =
    element === null
      ? 0
      : attacker.elementalPower[element] * effect.elementalPowerScaling;
  const rawDamage = effect.basePower + attackPower + elementalPower;
  if (effect.damageType === "true") {
    return Math.max(1, Math.round(rawDamage));
  }

  const defensiveStat =
    effect.damageType === "physical"
      ? getEffectiveDefensiveStat(defender, defenderStatuses, "defense")
      : getEffectiveDefensiveStat(defender, defenderStatuses, "resistance");
  const damageReduction = combineDamageReductions([
    calculateStatDamageReduction(defensiveStat),
    ...additionalDamageReductions,
  ]);

  return Math.max(
    1,
    Math.round(rawDamage * (1 - damageReduction)),
  );
}
