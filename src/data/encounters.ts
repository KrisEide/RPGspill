import type { EncounterId, EnemyId, EnemyInstanceId } from "../game/types";

export type EncounterEnemy = {
  enemyId: EnemyId;
  instanceId: EnemyInstanceId;
};

export type EncounterDefinition = {
  id: EncounterId;
  kind: "combat" | "rest";
  rewardType?: "openingAbilities" | "spirits";
  skipRewardsBeforeRest?: boolean;
  number: number;
  title: string;
  enemies: EncounterEnemy[];
  nextEncounterId: EncounterId | null;
  fullPartyRestore?: boolean;
};

export const ENCOUNTER_DEFINITIONS: Record<EncounterId, EncounterDefinition> = {
  slimeTrail: {
    id: "slimeTrail",
    kind: "combat",
    rewardType: "openingAbilities",
    number: 1,
    title: "Slime Trail",
    nextEncounterId: "growingThreat",
    enemies: [
      { enemyId: "smallSlime", instanceId: "enemy-1" },
      { enemyId: "smallSlime", instanceId: "enemy-2" },
    ],
  },
  growingThreat: {
    id: "growingThreat",
    kind: "combat",
    rewardType: "openingAbilities",
    number: 2,
    title: "Growing Threat",
    nextEncounterId: "poisonedTrail",
    enemies: [
      { enemyId: "smallSlime", instanceId: "enemy-1" },
      { enemyId: "greenSlime", instanceId: "enemy-2" },
    ],
  },
  poisonedTrail: {
    id: "poisonedTrail",
    kind: "combat",
    number: 3,
    title: "Poisoned Trail",
    nextEncounterId: "forestAmbush",
    enemies: [
      { enemyId: "greenSlime", instanceId: "enemy-1" },
      { enemyId: "blueSlime", instanceId: "enemy-2" },
    ],
  },
  forestAmbush: {
    id: "forestAmbush",
    kind: "combat",
    rewardType: "spirits",
    number: 4,
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
    number: 5,
    title: "Orc Reinforcements",
    nextEncounterId: "spiritCamp",
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
  spiritCamp: {
    id: "spiritCamp",
    kind: "rest",
    number: 6,
    title: "Forest Camp",
    nextEncounterId: "raiderPatrol",
    enemies: [],
  },
  raiderPatrol: {
    id: "raiderPatrol",
    kind: "combat",
    number: 6,
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
    number: 8,
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
    number: 7,
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
    number: 10,
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
    number: 9,
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
    number: 11,
    title: "Might and Mending",
    skipRewardsBeforeRest: true,
    nextEncounterId: "forestRest",
    enemies: [
      { enemyId: "orcHealer", instanceId: "enemy-1" },
      { enemyId: "orcMauler", instanceId: "enemy-2" },
    ],
  },
  forestRest: {
    id: "forestRest",
    kind: "rest",
    number: 12,
    title: "Forest Rest",
    nextEncounterId: "orcBrothers",
    enemies: [],
  },
  orcBrothers: {
    id: "orcBrothers",
    kind: "combat",
    number: 13,
    title: "The Orc Brothers",
    nextEncounterId: "mountainPass",
    enemies: [
      { enemyId: "brakkBoss", instanceId: "enemy-1" },
      { enemyId: "gorakBoss", instanceId: "enemy-2" },
    ],
  },
  mountainPass: {
    id: "mountainPass",
    kind: "combat",
    number: 14,
    title: "The Mountain Pass",
    nextEncounterId: "rockwhistlerRidge",
    fullPartyRestore: true,
    enemies: [
      { enemyId: "goat1", instanceId: "enemy-1" },
      { enemyId: "goat2", instanceId: "enemy-2" },
    ],
  },
  rockwhistlerRidge: {
    id: "rockwhistlerRidge",
    kind: "combat",
    number: 15,
    title: "Rockwhistler Ridge",
    nextEncounterId: null,
    enemies: [
      { enemyId: "rockwhistler", instanceId: "enemy-1" },
      { enemyId: "rockwhistler", instanceId: "enemy-2" },
      { enemyId: "rockwhistler", instanceId: "enemy-3" },
      { enemyId: "rockwhistler", instanceId: "enemy-4" },
      { enemyId: "rockwhistler", instanceId: "enemy-5" },
    ],
  },
};
