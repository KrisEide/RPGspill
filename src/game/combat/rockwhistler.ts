import type { CombatState } from "../types";
import { isEnemyTargetable } from "./targeting";

export function shouldAutoResolveRockwhistlerAmbush(state: CombatState) {
  if (state.encounterId !== "rockwhistlerRidge" || state.phase !== "selectingActions") {
    return false;
  }
  const livingEnemies = state.enemies.filter((enemy) => enemy.hp > 0);
  return livingEnemies.length > 0 &&
    livingEnemies.every((enemy) => !isEnemyTargetable(enemy)) &&
    livingEnemies.every(
      (enemy) => state.enemyIntents[enemy.instanceId]?.abilityId === "rockwhistlerAmbush",
    );
}
