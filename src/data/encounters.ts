import type { EncounterId, EnemyId, EnemyInstanceId } from "../game/types";

export type EncounterEnemy = {
  enemyId: EnemyId;
  instanceId: EnemyInstanceId;
};

export type EncounterDefinition = {
  id: EncounterId;
  kind: "combat" | "rest";
  number: number;
  title: string;
  enemies: EncounterEnemy[];
  nextEncounterId: EncounterId | null;
};

export const ENCOUNTER_DEFINITIONS: Record<EncounterId, EncounterDefinition> = {
  forestAmbush: {
    id: "forestAmbush",
    kind: "combat",
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
    kind: "combat",
    number: 2,
    title: "Orc Reinforcements",
    nextEncounterId: "raiderPatrol",
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
  raiderPatrol: {
    id: "raiderPatrol",
    kind: "combat",
    number: 3,
    title: "Raider Patrol",
    nextEncounterId: "darkMage",
    enemies: [
      { enemyId: "orcRaider", instanceId: "enemy-1" },
      { enemyId: "orcRaider", instanceId: "enemy-2" },
      { enemyId: "level1Orc", instanceId: "enemy-3" },
    ],
  },
  raiderWarband: {
    id: "raiderWarband",
    kind: "combat",
    number: 5,
    title: "Raider Warband",
    nextEncounterId: "guardPatrol",
    enemies: [
      { enemyId: "orcRaider", instanceId: "enemy-1" },
      { enemyId: "orcRaider", instanceId: "enemy-2" },
      { enemyId: "orcRaider", instanceId: "enemy-3" },
      { enemyId: "orcRaider", instanceId: "enemy-4" },
    ],
  },
  darkMage: {
    id: "darkMage",
    kind: "combat",
    number: 4,
    title: "The Cursed Crossing",
    nextEncounterId: "raiderWarband",
    enemies: [
      { enemyId: "orcMage", instanceId: "enemy-1" },
      { enemyId: "level1Orc", instanceId: "enemy-2" },
    ],
  },
  dreadflameRitual: {
    id: "dreadflameRitual",
    kind: "combat",
    number: 7,
    title: "A Dark Presence",
    nextEncounterId: "mightAndMending",
    enemies: [
      { enemyId: "orcWizard", instanceId: "enemy-1" },
      { enemyId: "level1Orc", instanceId: "enemy-2" },
    ],
  },
  guardPatrol: {
    id: "guardPatrol",
    kind: "combat",
    number: 6,
    title: "The Shield Line",
    nextEncounterId: "dreadflameRitual",
    enemies: [
      { enemyId: "orcGuard", instanceId: "enemy-1" },
      { enemyId: "level1Orc", instanceId: "enemy-2" },
      { enemyId: "level1Orc", instanceId: "enemy-3" },
    ],
  },
  mightAndMending: {
    id: "mightAndMending",
    kind: "combat",
    number: 8,
    title: "Might and Mending",
    nextEncounterId: "forestRest",
    enemies: [
      { enemyId: "orcHealer", instanceId: "enemy-1" },
      { enemyId: "orcMauler", instanceId: "enemy-2" },
    ],
  },
  forestRest: {
    id: "forestRest",
    kind: "rest",
    number: 9,
    title: "Forest Rest",
    nextEncounterId: "orcBrothers",
    enemies: [],
  },
  orcBrothers: {
    id: "orcBrothers",
    kind: "combat",
    number: 10,
    title: "The Orc Brothers",
    nextEncounterId: null,
    enemies: [
      { enemyId: "brakkBoss", instanceId: "enemy-1" },
      { enemyId: "gorakBoss", instanceId: "enemy-2" },
    ],
  },
};
