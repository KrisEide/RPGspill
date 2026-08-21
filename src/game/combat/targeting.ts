import type { EnemyState } from "../types";

export function isEnemySleeping(enemy: EnemyState) {
  return enemy.statuses.some((status) => status.id === "sleeping");
}

export function isEnemyTargetable(enemy: EnemyState) {
  return enemy.hp > 0 && !isEnemySleeping(enemy);
}
