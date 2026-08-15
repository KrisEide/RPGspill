import type { EncounterId, EnemyId, EnemyInstanceId } from "../game/types";

export type EncounterEnemy = {
  enemyId: EnemyId;
  instanceId: EnemyInstanceId;
};

export type EncounterDefinition = {
  id: EncounterId;
  number: number;
  title: string;
  enemies: EncounterEnemy[];
  nextEncounterId: EncounterId | null;
};

export const ENCOUNTER_DEFINITIONS: Record<EncounterId, EncounterDefinition> = {
  forestAmbush: {
    id: "forestAmbush",
    number: 1,
    title: "Forest Ambush",
    nextEncounterId: "orcReinforcements",
    enemies: [
      {
        enemyId: "level1Orc",
        instanceId: "enemy-1",
      },
    ],
  },
  orcReinforcements: {
    id: "orcReinforcements",
    number: 2,
    title: "Orc Reinforcements",
    nextEncounterId: "darkMage",
    enemies: [
      {
        enemyId: "level1Orc",
        instanceId: "enemy-1",
      },
      {
        enemyId: "level1Orc",
        instanceId: "enemy-2",
      },
    ],
  },
  raiderWarband: {
    id: "raiderWarband",
    number: 4,
    title: "Raider Warband",
    nextEncounterId: "dreadflameRitual",
    enemies: [
      { enemyId: "orcRaider", instanceId: "enemy-1" },
      { enemyId: "orcRaider", instanceId: "enemy-2" },
      { enemyId: "orcRaider", instanceId: "enemy-3" },
      { enemyId: "orcRaider", instanceId: "enemy-4" },
    ],
  },
  darkMage: {
    id: "darkMage",
    number: 3,
    title: "The Cursed Crossing",
    nextEncounterId: "raiderWarband",
    enemies: [
      { enemyId: "orcMage", instanceId: "enemy-1" },
      { enemyId: "level1Orc", instanceId: "enemy-2" },
    ],
  },
  dreadflameRitual: {
    id: "dreadflameRitual",
    number: 5,
    title: "A Dark Presence",
    nextEncounterId: null,
    enemies: [
      { enemyId: "orcWizard", instanceId: "enemy-1" },
      { enemyId: "level1Orc", instanceId: "enemy-2" },
    ],
  },
};
