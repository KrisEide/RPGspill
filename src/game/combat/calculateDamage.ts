import type {
  CombatStats,
  DamageEffect,
  Element,
} from "../types";
import {
  calculateStatDamageReduction,
  combineDamageReductions,
} from "./damageMitigation";

type CalculateDamageParams = {
  attacker: CombatStats;
  defender: CombatStats;
  element: Element | null;
  effect: DamageEffect;
  additionalDamageReductions?: number[];
};

type CalculateFixedDamageParams = {
  basePower: number;
  damageType: DamageEffect["damageType"];
  defender: CombatStats;
};

export function calculateFixedDamage({
  basePower,
  damageType,
  defender,
}: CalculateFixedDamageParams) {
  const defensiveStat =
    damageType === "physical" ? defender.defense : defender.resistance;
  const damageReduction = calculateStatDamageReduction(defensiveStat);

  return Math.max(1, Math.round(basePower * (1 - damageReduction)));
}

export function calculateDamage({
  attacker,
  defender,
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
  const defensiveStat =
    effect.damageType === "physical"
      ? defender.defense
      : defender.resistance;
  const damageReduction = combineDamageReductions([
    calculateStatDamageReduction(defensiveStat),
    ...additionalDamageReductions,
  ]);

  return Math.max(
    1,
    Math.round(rawDamage * (1 - damageReduction)),
  );
}
