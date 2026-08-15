export const BARRIER_MAX_HP_RATIO = 0.5;

export function getMaximumBarrier(maxHp: number) {
  return Math.floor(maxHp * BARRIER_MAX_HP_RATIO);
}

export function addBarrier(
  currentBarrier: number,
  amount: number,
  maxHp: number,
) {
  return Math.min(
    getMaximumBarrier(maxHp),
    currentBarrier + amount,
  );
}

export function absorbDirectDamage(
  currentBarrier: number,
  damage: number,
) {
  const absorbedByBarrier = Math.min(currentBarrier, damage);

  return {
    absorbedByBarrier,
    hpDamage: damage - absorbedByBarrier,
    remainingBarrier: currentBarrier - absorbedByBarrier,
  };
}
