import type {
  CombatStats,
  DamageEffect,
  Element,
} from "../types";

type CalculateDamageParams = {
  attacker: CombatStats;
  defender: CombatStats;
  element: Element | null;
  effect: DamageEffect;
};

export function calculateDamage({
  attacker,
  defender,
  element,
  effect,
}: CalculateDamageParams) {
  const attackPower = attacker.attack * effect.attackScaling;
  const elementalPower =
    element === null
      ? 0
      : attacker.elementalPower[element] * effect.elementalPowerScaling;
  const defense =
    effect.damageType === "physical" ? defender.defense * 0.5 : 0;

  return Math.max(
    1,
    Math.round(effect.basePower + attackPower + elementalPower - defense),
  );
}
