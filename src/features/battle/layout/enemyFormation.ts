import type { EnemyState } from "../../../game/types";

export type EnemyFormationPosition = {
  xPercent: number;
  yPercent: number;
  scale: number;
  zIndex: number;
};

const SINGLE_ENEMY_POSITION: EnemyFormationPosition = {
  xPercent: 66,
  yPercent: 42,
  scale: 1,
  zIndex: 9,
};

const BOSS_POSITION: EnemyFormationPosition = {
  xPercent: 68,
  yPercent: 41,
  scale: 1.2,
  zIndex: 10,
};

const TWO_ENEMY_POSITIONS: EnemyFormationPosition[] = [
  { xPercent: 73, yPercent: 31, scale: 0.86, zIndex: 8 },
  { xPercent: 62, yPercent: 49, scale: 1, zIndex: 10 },
];

const THREE_ENEMY_POSITIONS: EnemyFormationPosition[] = [
  { xPercent: 61, yPercent: 30, scale: 0.82, zIndex: 8 },
  { xPercent: 77, yPercent: 30, scale: 0.82, zIndex: 8 },
  { xPercent: 69, yPercent: 49, scale: 1, zIndex: 10 },
];

const FOUR_ENEMY_POSITIONS: EnemyFormationPosition[] = [
  { xPercent: 63, yPercent: 34, scale: 0.72, zIndex: 8 },
  { xPercent: 82, yPercent: 34, scale: 0.72, zIndex: 8 },
  { xPercent: 56, yPercent: 52, scale: 0.8, zIndex: 10 },
  { xPercent: 75, yPercent: 52, scale: 0.8, zIndex: 10 },
];

export function getEnemyFormationPositions(
  enemies: EnemyState[],
): EnemyFormationPosition[] {
  if (enemies.length === 1) {
    return [enemies[0].isBoss ? BOSS_POSITION : SINGLE_ENEMY_POSITION];
  }

  if (enemies.length === 2) {
    return TWO_ENEMY_POSITIONS;
  }

  if (enemies.length === 3) {
    return THREE_ENEMY_POSITIONS;
  }

  if (enemies.length === 4) {
    return FOUR_ENEMY_POSITIONS;
  }

  return enemies.map((_, index) => ({
    xPercent: 58 + (index % 3) * 11,
    yPercent: 30 + Math.floor(index / 3) * 17,
    scale: 0.78,
    zIndex: 8 + Math.floor(index / 3),
  }));
}
