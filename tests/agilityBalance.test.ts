import assert from "node:assert/strict";
import { test } from "node:test";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { EnemyId, GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 91,
  startingEncounterId: "slimeTrail",
  players: {
    player1: {
      id: "player1",
      controlledCharacterId: "character-1",
      character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" },
    },
    player2: {
      id: "player2",
      controlledCharacterId: "character-2",
      character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" },
    },
  },
};

function firstActor(enemyId: EnemyId, heroAgility: number) {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].stats.agility = heroAgility;
  state.enemies = state.enemies.slice(0, 1);
  state.enemies[0].stats = structuredClone(ENEMY_DEFINITIONS[enemyId].stats);
  state.enemyIntents = {
    "enemy-1": {
      abilityId: "autoAttack",
      targetId: "character-1",
      targetIds: ["character-1"],
    },
  };

  let selections = createEmptyRoundSelections();
  selections = selectPlayerAction(state, selections, {
    playerId: "player1",
    abilityId: "autoAttack",
    targetId: "enemy-1",
  })!;

  return resolveRound(state, selections).events.find(
    (event) => event.type === "damage",
  )?.actorId;
}

test("each enemy's Agility places it on the approved turn-order boundary", () => {
  const expectedAgility: Record<EnemyId, number> = {
    smallSlime: 7,
    greenSlime: 8,
    blueSlime: 8,
    level1Orc: 12,
    orcRaider: 8,
    orcMage: 14,
    orcWizard: 9,
    orcHealer: 11,
    orcMauler: 6,
    orcGuard: 15,
    brakkBoss: 12,
    gorakBoss: 17,
  };

  for (const [enemyId, agility] of Object.entries(expectedAgility) as Array<
    [EnemyId, number]
  >) {
    assert.equal(
      firstActor(enemyId, agility - 1),
      "enemy-1",
      `${enemyId} should act before a hero with ${agility - 1} Agility`,
    );
    assert.equal(
      firstActor(enemyId, agility + 1),
      "character-1",
      `${enemyId} should act after a hero with ${agility + 1} Agility`,
    );
  }
});

