import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { refreshSpiritActiveUses } from "../../data/spirits";
import { createRestOffers } from "../../data/restChoices";
import { prepareRoundTurnPriorities } from "../combat/spiritTurnPriority";
import { prepareEnemyIntents } from "../combat/enemyIntents";
import type {
  CombatState,
  CombatStats,
  CharacterState,
  EncounterId,
  EnemyId,
  EnemyInstanceId,
  EnemyState,
  RunDifficulty,
} from "../types";

const ENEMY_ATTACK_MULTIPLIERS: Record<RunDifficulty, number> = {
  normal: 1.1,
  hard: 1.25,
};

function copyCombatStats(stats: CombatStats): CombatStats {
  return {
    ...stats,
    elementalPower: { ...stats.elementalPower },
  };
}

export function createEnemyState(
  enemyId: EnemyId,
  instanceId: EnemyInstanceId,
  difficulty: RunDifficulty,
): EnemyState {
  const definition = ENEMY_DEFINITIONS[enemyId];
  const stats = copyCombatStats(definition.stats);
  stats.attack = Math.round(
    stats.attack * ENEMY_ATTACK_MULTIPLIERS[difficulty],
  );

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

export function createEncounterEnemies(
  encounterId: EncounterId,
  difficulty: RunDifficulty = "normal",
) {
  return ENCOUNTER_DEFINITIONS[encounterId].enemies.map(
    ({ enemyId, instanceId }) =>
      createEnemyState(enemyId, instanceId, difficulty),
  );
}

function prepareCharacterForEncounter(
  character: CharacterState,
  levelIncrease: number,
  fullPartyRestore: boolean,
): CharacterState {
  const restoredCharacter =
    fullPartyRestore && character.form !== "permanentlyDead"
      ? {
          ...character,
          form: "living" as const,
          hp: character.stats.maxHp,
          pp: character.stats.maxPp,
          savedLivingPp: null,
          ghostReformReady: false,
          soulLinkActive: false,
        }
      : character;

  return {
    ...restoredCharacter,
    level: restoredCharacter.level + levelIncrease,
    spirits: refreshSpiritActiveUses(restoredCharacter.spirits),
    magicBagLastUsedRound: null,
    itemDamageBonus: null,
    abilityDamageBonus: null,
    passiveCombatState: {
      firstHealUsed: false,
      tailwindActive: false,
      galeFocusLastUsedRound: null,
    },
    statuses: [],
    barrier: 0,
  };
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
      "character-1": prepareCharacterForEncounter(
        currentState.characters["character-1"],
        levelIncrease,
        encounter.fullPartyRestore ?? false,
      ),
      "character-2": prepareCharacterForEncounter(
        currentState.characters["character-2"],
        levelIncrease,
        encounter.fullPartyRestore ?? false,
      ),
    },
    enemies: createEncounterEnemies(encounterId, currentState.difficulty),
    enemyIntents: {},
    restStage: isRest ? "choice" : null,
    actTransitionStage: null,
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
    : prepareEnemyIntents(prepareRoundTurnPriorities(nextState));
}
