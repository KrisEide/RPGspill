import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENCOUNTER_DEFINITIONS } from "../src/data/encounters";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { resolveRound } from "../src/game/combat/resolveRound";
import { isEnemyTargetable } from "../src/game/combat/targeting";
import { shouldAutoResolveRockwhistlerAmbush } from "../src/game/combat/rockwhistler";
import { createEncounterEnemies } from "../src/game/state/encounterState";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 1402,
  startingEncounterId: "rockwhistlerRidge",
  players: {
    player1: { id: "player1", controlledCharacterId: "character-1", character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" } },
    player2: { id: "player2", controlledCharacterId: "character-2", character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" } },
  },
};

test("Act 2 encounter 2 contains five passive 90 HP Rockwhistlers", () => {
  const encounter = ENCOUNTER_DEFINITIONS.rockwhistlerRidge;
  const enemies = createEncounterEnemies("rockwhistlerRidge");

  assert.equal(ENCOUNTER_DEFINITIONS.mountainPass.nextEncounterId, encounter.id);
  assert.equal(encounter.number, 15);
  assert.deepEqual(
    encounter.enemies.map(({ enemyId }) => enemyId),
    Array.from({ length: 5 }, () => "rockwhistler"),
  );
  assert.equal(ENEMY_DEFINITIONS.rockwhistler.stats.maxHp, 90);
  assert.deepEqual(ENEMY_DEFINITIONS.rockwhistler.abilityRanks, {
    rockwhistlerAttack: 1,
    rockwhistlerPackAttack: 1,
    rockwhistlerBurrow: 1,
    rockwhistlerAmbush: 1,
    rockwhistlerCall: 1,
  });
  assert.equal(enemies.every((enemy) => enemy.hp === 90), true);
});

test("the pack focuses together, burrows in pairs, then ambushes", () => {
  const state = createInitialCombatState(setup);
  const first = prepareEnemyIntents({ ...state, enemyIntents: {} });
  const focusTargets = Object.values(first.enemyIntents).map((intent) => intent?.targetId);
  assert.equal(new Set(focusTargets).size, 1);
  assert.equal(Object.values(first.enemyIntents).every((intent) => intent?.abilityId === "rockwhistlerPackAttack"), true);

  const roundTwo = prepareEnemyIntents({ ...first, round: 2, enemyIntents: {} });
  assert.equal(Object.values(roundTwo.enemyIntents).filter((intent) => intent?.abilityId === "rockwhistlerBurrow").length, 2);
  assert.equal(Object.values(roundTwo.enemyIntents).filter((intent) => intent?.abilityId === "rockwhistlerAttack").length, 3);

  const buried = resolveRound(roundTwo, createEmptyRoundSelections()).nextState;
  assert.equal(buried.enemies.filter((enemy) => !isEnemyTargetable(enemy) && enemy.hp > 0).length, 2);
  assert.equal(Object.values(buried.enemyIntents).filter((intent) => intent?.abilityId === "rockwhistlerAmbush").length, 2);
});

test("Call adds two full-health Rockwhistlers once after two deaths", () => {
  const state = createInitialCombatState(setup);
  state.round = 3;
  state.enemies[0].hp = 0;
  state.enemies[1].hp = 0;
  const prepared = prepareEnemyIntents({ ...state, enemyIntents: {} });
  assert.equal(Object.values(prepared.enemyIntents).filter((intent) => intent?.abilityId === "rockwhistlerCall").length, 1);
  const result = resolveRound(prepared, createEmptyRoundSelections());
  assert.equal(result.nextState.enemies.length, 7);
  assert.equal(result.nextState.enemies.slice(-2).every((enemy) => enemy.hp === 90), true);
  assert.equal(result.events.filter((event) => event.type === "enemySummoned").length, 1);
});

test("an all-burrowed pack automatically advances into its ambush round", () => {
  const state = createInitialCombatState(setup);
  state.round = 2;
  state.enemies = state.enemies.slice(0, 2);
  const burrowRound = prepareEnemyIntents({ ...state, enemyIntents: {} });
  const ambushRound = resolveRound(burrowRound, createEmptyRoundSelections()).nextState;

  assert.equal(ambushRound.round, 3);
  assert.equal(ambushRound.enemies.every((enemy) => !isEnemyTargetable(enemy)), true);
  assert.equal(shouldAutoResolveRockwhistlerAmbush(ambushRound), true);

  const emerged = resolveRound(ambushRound, createEmptyRoundSelections()).nextState;
  assert.equal(emerged.enemies.every(isEnemyTargetable), true);
  assert.equal(emerged.round, 4);
});

test("a Rockwhistler returns immediately after Ambush and can be hit by later AOE", () => {
  const state = createInitialCombatState(setup);
  state.round = 2;
  state.enemies = state.enemies.slice(0, 2);
  state.characters["character-1"].abilityRanks.razorGale = 1;
  const burrowRound = prepareEnemyIntents({ ...state, enemyIntents: {} });
  const ambushRound = resolveRound(burrowRound, createEmptyRoundSelections()).nextState;
  const selections = createEmptyRoundSelections();
  selections["character-1"].action = {
    kind: "ability",
    actorId: "character-1",
    abilityId: "razorGale",
    targetId: null,
  };

  const result = resolveRound(ambushRound, selections);
  const gale = result.events.find(
    (event) => event.type === "multiTargetDamage" && event.abilityId === "razorGale",
  );
  assert.ok(gale?.type === "multiTargetDamage");
  assert.equal(gale.impacts.length, 2);
});

test("focus rounds alternate to the other living hero", () => {
  const first = prepareEnemyIntents(createInitialCombatState(setup));
  const firstTarget = Object.values(first.enemyIntents)[0]?.targetId;
  const fourth = prepareEnemyIntents({ ...first, round: 4, enemyIntents: {} });
  const fourthTargets = Object.values(fourth.enemyIntents)
    .filter((intent) => intent?.abilityId === "rockwhistlerPackAttack")
    .map((intent) => intent?.targetId);
  assert.equal(new Set(fourthTargets).size, 1);
  assert.notEqual(fourthTargets[0], firstTarget);
});

test("Defend is especially effective against the focused Pack Attack", () => {
  const createDefendedState = (abilityId: "rockwhistlerAttack" | "rockwhistlerPackAttack") => {
    const state = createInitialCombatState(setup);
    state.enemies = state.enemies.slice(0, 1);
    state.enemyIntents = {
      "enemy-1": { abilityId, targetId: "character-1", targetIds: ["character-1"] },
    };
    const selections = createEmptyRoundSelections();
    selections["character-1"].action = {
      kind: "ability", actorId: "character-1", abilityId: "defend", targetId: "character-1",
    };
    return resolveRound(state, selections);
  };

  const normalHit = createDefendedState("rockwhistlerAttack").events.find(
    (event) => event.type === "damage",
  );
  const focusedHit = createDefendedState("rockwhistlerPackAttack").events.find(
    (event) => event.type === "damage",
  );
  assert.ok(normalHit?.type === "damage" && focusedHit?.type === "damage");
  assert.ok(focusedHit.amount < normalHit.amount);
});

test("Rockwhistler Ridge keeps five small enemies grounded with their HP bars close above them", () => {
  const encounterVisuals = readFileSync(
    new URL(
      "../src/features/battle/data/encounterVisuals.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const enemyVisuals = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );

  assert.match(encounterVisuals, /act2background2\.png/);
  assert.match(
    encounterVisuals,
    /rockwhistlerRidge:[\s\S]*enemyFormation: \[[\s\S]*yPercent: 40[\s\S]*yPercent: 38[\s\S]*yPercent: 40[\s\S]*yPercent: 57[\s\S]*yPercent: 57/,
  );
  assert.match(enemyVisuals, /rockwhistler_idle\.png/);
  for (const asset of ["rockwhistler_attack.png", "rockwhistler_burrow.png", "rockwhistler_call.png"]) {
    assert.match(enemyVisuals, new RegExp(asset.replace(".", "\\.")));
  }
  assert.match(
    enemyVisuals,
    /rockwhistlerSpriteAdjustment[\s\S]*displayScale: 0\.14[\s\S]*rockwhistler:[\s\S]*idleSpriteSrc: rockwhistlerIdleSprite[\s\S]*statusTop: "160px"[\s\S]*idleSpriteAdjustment: rockwhistlerSpriteAdjustment/,
  );
});

test("every Rockwhistler pose receives the same softened background-matching filter", () => {
  const enemyVisuals = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    enemyVisuals,
    /rockwhistler:[\s\S]*baseFilter: "brightness\(0\.96\) contrast\(1\.08\) saturate\(0\.92\)"/,
  );
  assert.match(
    battleScreen,
    /"--enemy-base-filter": visuals\.baseFilter \?\? "none"/,
  );

  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );
  assert.match(
    styles,
    /battleScene__enemyUnit--rockwhistler[\s\S]*battleScene__enemySprite[\s\S]*filter: var\(--enemy-base-filter\)/,
  );
});

test("Rockwhistler attacks swap to a fixed forward pose with paced Burrow, Ambush, and Call visuals", () => {
  const abilityVisuals = readFileSync(
    new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
    "utf8",
  );
  const enemyVisuals = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(abilityVisuals, /rockwhistler_burrowattack\.png/);
  assert.match(abilityVisuals, /rockwhistlerBurrow:[\s\S]*animationDurationMs: 3800[\s\S]*eventDurationMs: 4400/);
  assert.match(abilityVisuals, /rockwhistlerAmbush:[\s\S]*targetEffect:[\s\S]*variant: "rockwhistlerAmbush"/);
  assert.match(abilityVisuals, /rockwhistlerCall:[\s\S]*animationDurationMs: 4200[\s\S]*eventDurationMs: 4800/);
  assert.doesNotMatch(enemyVisuals, /rockwhistlerAmbush:[\s\S]*rockwhistlerBurrowAttackSprite/);
  assert.match(battleScreen, /abilityId === "rockwhistlerAmbush"[\s\S]*currentEventApplied/);
  assert.match(enemyVisuals, /rockwhistlerAttackSpriteAdjustment[\s\S]*targetAnchor: \{ x: 185, y: 330 \}/);
  assert.match(enemyVisuals, /rockwhistlerAttack:[\s\S]*adjustment: rockwhistlerAttackSpriteAdjustment/);
  assert.doesNotMatch(styles, /rockwhistlerAttackAdvance/);
  assert.match(styles, /battleScene__targetEffect--rockwhistlerAmbush/);
  assert.match(styles, /battleScene__targetEffect--rockwhistlerAmbush[\s\S]*brightness\(0\.96\) contrast\(1\.08\) saturate\(0\.92\)/);
});
