import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { refreshSpiritActiveUses } from "../../data/spirits";
import { createRestOffers } from "../../data/restChoices";
import { prepareRoundTurnPriorities } from "../combat/spiritTurnPriority";
import { prepareEnemyIntents } from "../combat/enemyIntents";
import { prepareBloodpactSelection } from "../combat/bloodpact";
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
    ...(enemyId === "orcMage"
      ? { orcMageDarkBoltsSinceShatter: 0 }
      : {}),
    statuses: definition.startsSleeping
      ? [
          {
            id: "sleeping",
            sourceId: instanceId,
            appliedRound: 1,
          },
        ]
      : [],
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
  const encounter = ENCOUNTER_DEFINITIONS[encounterId];
  const isRest = encounter.kind === "rest";
  const restOffers = isRest ? createRestOffers(encounterId) : [];
  const levelIncrease =
    ENCOUNTER_DEFINITIONS[currentState.encounterId].kind === "combat"
      ? 1
      : 0;
  const nextState: CombatState = {
    ...currentState,
    encounterId,
    round: 1,
    phase: isRest ? "rest" : "selectingActions",
    characters: {
      "character-1": {
        ...currentState.characters["character-1"],
        level: currentState.characters["character-1"].level + levelIncrease,
        spirits: refreshSpiritActiveUses(
          currentState.characters["character-1"].spirits,
        ),
        itemDamageBonus: null,
        abilityDamageBonus: null,
        passiveCombatState: {
          firstHealUsed: false,
          tailwindActive: false,
          galeFocusLastUsedRound: null,
        },
        statuses: [],
        barrier: 0,
      },
      "character-2": {
        ...currentState.characters["character-2"],
        level: currentState.characters["character-2"].level + levelIncrease,
        spirits: refreshSpiritActiveUses(
          currentState.characters["character-2"].spirits,
        ),
        itemDamageBonus: null,
        abilityDamageBonus: null,
        passiveCombatState: {
          firstHealUsed: false,
          tailwindActive: false,
          galeFocusLastUsedRound: null,
        },
        statuses: [],
        barrier: 0,
      },
    },
    enemies: createEncounterEnemies(encounterId),
    enemyIntents: {},
    restStage: isRest ? "choice" : null,
    rewardOffers: isRest
      ? {
          "character-1":
            currentState.characters["character-1"].form ===
            "permanentlyDead"
              ? []
              : restOffers,
          "character-2":
            currentState.characters["character-2"].form ===
            "permanentlyDead"
              ? []
              : createRestOffers(encounterId),
        }
      : null,
    itemRewards: null,
    earthDemon: null,
  };

  return isRest
    ? nextState
    : prepareBloodpactSelection(prepareEnemyIntents(prepareRoundTurnPriorities(nextState)));
}
