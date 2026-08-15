import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { refreshSpiritActiveUses } from "../../data/spirits";
import type {
  CombatState,
  CombatStats,
  EncounterId,
  EnemyId,
  EnemyInstanceId,
  EnemyState,
} from "../types";

function copyCombatStats(stats: CombatStats): CombatStats {
  return {
    ...stats,
    elementalPower: { ...stats.elementalPower },
  };
}

function createEnemyState(
  enemyId: EnemyId,
  instanceId: EnemyInstanceId,
): EnemyState {
  const definition = ENEMY_DEFINITIONS[enemyId];
  const stats = copyCombatStats(definition.stats);

  return {
    instanceId,
    enemyId: definition.id,
    name: definition.name,
    level: definition.level,
    isBoss: definition.isBoss,
    hp: stats.maxHp,
    pp: stats.maxPp,
    barrier: 0,
    stats,
    abilityRanks: { ...definition.abilityRanks },
    statuses: [],
  };
}

export function createEncounterEnemies(encounterId: EncounterId) {
  return ENCOUNTER_DEFINITIONS[encounterId].enemies.map(
    ({ enemyId, instanceId }) => createEnemyState(enemyId, instanceId),
  );
}

export function startEncounter(
  currentState: CombatState,
  encounterId: EncounterId,
): CombatState {
  return {
    ...currentState,
    encounterId,
    round: 1,
    phase: "selectingActions",
    characters: {
      "character-1": {
        ...currentState.characters["character-1"],
        level: currentState.characters["character-1"].level + 1,
        spirits: refreshSpiritActiveUses(
          currentState.characters["character-1"].spirits,
        ),
        statuses: [],
        barrier: 0,
      },
      "character-2": {
        ...currentState.characters["character-2"],
        level: currentState.characters["character-2"].level + 1,
        spirits: refreshSpiritActiveUses(
          currentState.characters["character-2"].spirits,
        ),
        statuses: [],
        barrier: 0,
      },
    },
    enemies: createEncounterEnemies(encounterId),
    rewardOffers: null,
  };
}
