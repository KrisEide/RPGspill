const MIN_DAMAGE_MULTIPLIER = 0.8;
const MAX_DAMAGE_MULTIPLIER = 1;

export function applyDamageVariance(baseDamage: number, randomValue: number) {
  const minimumDamage = Math.max(
    1,
    Math.ceil(baseDamage * MIN_DAMAGE_MULTIPLIER),
  );
  const maximumDamage = Math.max(
    minimumDamage,
    Math.round(baseDamage * MAX_DAMAGE_MULTIPLIER),
  );
  const clampedRandomValue = Math.min(
    0.999_999_999,
    Math.max(0, randomValue),
  );
  const possibleDamageValues = maximumDamage - minimumDamage + 1;

  return minimumDamage + Math.floor(clampedRandomValue * possibleDamageValues);
}
