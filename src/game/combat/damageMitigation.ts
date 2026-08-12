const MAX_STAT_DAMAGE_REDUCTION = 0.65;
const MAX_TOTAL_DAMAGE_REDUCTION = 0.85;
const DEFENSIVE_STAT_SOFTENING = 10;

export function calculateStatDamageReduction(defensiveStat: number) {
  const normalizedStat = Math.max(0, defensiveStat);

  return (
    (MAX_STAT_DAMAGE_REDUCTION * normalizedStat) /
    (normalizedStat + DEFENSIVE_STAT_SOFTENING)
  );
}

export function combineDamageReductions(reductions: number[]) {
  const combinedReduction =
    1 -
    reductions.reduce((remainingDamage, reduction) => {
      const normalizedReduction = Math.min(1, Math.max(0, reduction));
      return remainingDamage * (1 - normalizedReduction);
    }, 1);

  return Math.min(MAX_TOTAL_DAMAGE_REDUCTION, combinedReduction);
}
