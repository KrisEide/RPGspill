import assert from "node:assert/strict";
import test from "node:test";

import { PASSIVE_DEFINITIONS } from "../src/data/passives";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type {
  AbilityId,
  AbilityRank,
  CombatState,
  EnemyInstanceId,
  GameSetup,
} from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 9284,
  startingEncounterId: "slimeTrail",
  players: {
    player1: {
      id: "player1",
      controlledCharacterId: "character-1",
      character: {
        name: "Rowan",
        presetId: "char1",
        portraitId: "c1p1",
      },
    },
    player2: {
      id: "player2",
      controlledCharacterId: "character-2",
      character: {
        name: "Lyra",
        presetId: "char2",
        portraitId: "c2p1",
      },
    },
  },
};

function createState(
  abilityId: AbilityId,
  rank: AbilityRank = 1,
  enemyCount = 1,
) {
  const state = createInitialCombatState(setup);
  const enemyTemplate = state.enemies[0];
  state.enemyIntents = {};
  state.characters["character-1"].passives.galeFocus = true;
  state.characters["character-1"].abilityRanks[abilityId] = rank;
  state.characters["character-1"].stats.criticalChance = -1;
  state.enemies = Array.from({ length: enemyCount }, (_, index) => ({
    ...enemyTemplate,
    instanceId: `enemy-${index + 1}` as EnemyInstanceId,
    hp: 500,
    stats: { ...enemyTemplate.stats, maxHp: 500 },
    statuses: [],
  }));
  return state;
}

function useAbility(state: CombatState, abilityId: AbilityId) {
  const selections = selectPlayerAction(
    state,
    createEmptyRoundSelections(),
    {
      playerId: "player1",
      abilityId,
      targetId: abilityId === "razorGale" ? null : "enemy-1",
    },
  );
  assert.ok(selections);
  return resolveRound(state, selections);
}

test("Gale Focus is a tagged Wind critical passive", () => {
  const passive = PASSIVE_DEFINITIONS.galeFocus;

  assert.equal(passive.category, "wind");
  assert.ok(passive.tags.includes("wind"));
  assert.ok(passive.tags.includes("crit"));
  assert.match(passive.description, /first damage wave/i);
  assert.match(passive.description, /each round/i);
});

test("Gale Focus guarantees the first Wind damage wave each round", () => {
  const state = createState("windSlash");
  const result = useAbility(state, "windSlash");
  const damage = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "windSlash",
  );

  assert.ok(damage && damage.type === "damage");
  assert.equal(damage.isCritical, true);
  assert.equal(
    result.nextState.characters["character-1"].passiveCombatState
      .galeFocusLastUsedRound,
    1,
  );
});

test("Gale Focus cannot trigger twice in the same round and resets next round", () => {
  const spentState = createState("windSlash");
  spentState.characters[
    "character-1"
  ].passiveCombatState.galeFocusLastUsedRound = 1;
  const spentResult = useAbility(spentState, "windSlash");
  const spentDamage = spentResult.events.find(
    (event) => event.type === "damage" && event.abilityId === "windSlash",
  );
  assert.ok(spentDamage && spentDamage.type === "damage");
  assert.equal(spentDamage.isCritical, false);

  const nextRoundState = createState("windSlash");
  nextRoundState.round = 2;
  nextRoundState.characters[
    "character-1"
  ].passiveCombatState.galeFocusLastUsedRound = 1;
  const nextRoundResult = useAbility(nextRoundState, "windSlash");
  const nextRoundDamage = nextRoundResult.events.find(
    (event) => event.type === "damage" && event.abilityId === "windSlash",
  );
  assert.ok(nextRoundDamage && nextRoundDamage.type === "damage");
  assert.equal(nextRoundDamage.isCritical, true);
});

test("Gale Focus only guarantees Cyclone's first hit", () => {
  const result = useAbility(createState("cyclone"), "cyclone");
  const hits = result.events.filter(
    (event) => event.type === "damage" && event.abilityId === "cyclone",
  );

  assert.deepEqual(
    hits.map((hit) => hit.isCritical),
    [true, false, false],
  );
});

test("Gale Focus guarantees every target in only Razor Gale's first wave", () => {
  const result = useAbility(createState("razorGale", 2, 2), "razorGale");
  const waves = result.events.filter(
    (event) =>
      event.type === "multiTargetDamage" && event.abilityId === "razorGale",
  );

  assert.equal(waves.length, 2);
  assert.ok(waves[0].impacts.every((impact) => impact.isCritical));
  assert.ok(waves[1].impacts.every((impact) => !impact.isCritical));
});

test("Gale Focus critical hits can ready Tailwind", () => {
  const state = createState("windSlash");
  state.characters["character-1"].passives.tailwind = true;
  const result = useAbility(state, "windSlash");

  assert.equal(
    result.nextState.characters["character-1"].passiveCombatState
      .tailwindActive,
    true,
  );
});
