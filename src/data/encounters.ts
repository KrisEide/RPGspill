import type {
  EncounterId,
  EnemyId,
  EnemyInstanceId,
} from "../game/types";

export type EncounterEnemy = {
  enemyId: EnemyId;
  instanceId: EnemyInstanceId;
};

export type EncounterDefinition = {
  id: EncounterId;
  number: number;
  title: string;
  enemies: EncounterEnemy[];
};

export const ENCOUNTER_DEFINITIONS: Record<
  EncounterId,
  EncounterDefinition
> = {
  forestAmbush: {
    id: "forestAmbush",
    number: 1,
    title: "Forest Ambush",
    enemies: [
      {
        enemyId: "level1Orc",
        instanceId: "enemy-1",
      },
    ],
  },
};
