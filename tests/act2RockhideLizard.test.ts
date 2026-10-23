import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENCOUNTER_DEFINITIONS } from "../src/data/encounters";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 9081,
  startingEncounterId: "rockhideCavern",
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

test("Act 2 encounter 3 is a single durable Rockhide Lizard", () => {
  const encounter = ENCOUNTER_DEFINITIONS.rockhideCavern;
  const definition = ENEMY_DEFINITIONS.rockhideLizard;

  assert.equal(
    ENCOUNTER_DEFINITIONS.rockwhistlerRidge.nextEncounterId,
    "rockhideCavern",
  );
  assert.equal(encounter.number, 16);
  assert.deepEqual(encounter.enemies, [
    { enemyId: "rockhideLizard", instanceId: "enemy-1" },
  ]);
  assert.deepEqual(
    {
      hp: definition.stats.maxHp,
      attack: definition.stats.attack,
      defense: definition.stats.defense,
      resistance: definition.stats.resistance,
      agility: definition.stats.agility,
    },
    { hp: 240, attack: 20, defense: 24, resistance: 5, agility: 7 },
  );
  assert.equal(definition.isBoss, true);
  assert.equal(definition.passive, undefined);
});

test("the Rockhide Lizard cycles Bite, Slam, and a damage-free Scrape", () => {
  const expected = [
    "stonejawBite",
    "groundSlam",
    "rockScrape",
    "stonejawBite",
    "groundSlam",
    "rockScrape",
  ];

  for (const [index, abilityId] of expected.entries()) {
    const state = createInitialCombatState(setup);
    state.round = index + 1;
    state.enemyIntents = {};
    const prepared = prepareEnemyIntents(state);

    assert.equal(prepared.enemyIntents["enemy-1"]?.abilityId, abilityId);
  }
});

test("Ground Slam hits both heroes while Stonejaw Bite hits one", () => {
  const slamState = createInitialCombatState(setup);
  slamState.round = 2;
  const slam = resolveRound(
    prepareEnemyIntents({ ...slamState, enemyIntents: {} }),
    createEmptyRoundSelections(),
  );
  const slamEvent = slam.events.find(
    (event) =>
      event.type === "multiTargetDamage" && event.abilityId === "groundSlam",
  );

  assert.ok(slamEvent?.type === "multiTargetDamage");
  assert.deepEqual(
    slamEvent.impacts.map((impact) => impact.targetId).sort(),
    ["character-1", "character-2"],
  );

  const biteState = createInitialCombatState(setup);
  biteState.round = 1;
  const bite = resolveRound(
    prepareEnemyIntents({ ...biteState, enemyIntents: {} }),
    createEmptyRoundSelections(),
  );
  const biteEvents = bite.events.filter(
    (event) => event.type === "damage" && event.abilityId === "stonejawBite",
  );
  assert.equal(biteEvents.length, 1);
});

test("Rock Scrape permanently sheds 4 Defense down to a floor of 8", () => {
  const state = createInitialCombatState(setup);
  state.round = 3;
  state.enemies[0].hp = 150;
  state.enemies[0].statuses = [
    { id: "burn", sourceId: "character-1", appliedRound: 1, remainingRounds: 2 },
    { id: "bleed", sourceId: "character-2", appliedRound: 1, remainingRounds: 3 },
    { id: "rootseed", sourceId: "character-1", appliedRound: 1 },
    { id: "cinderCurse", sourceId: "character-2", appliedRound: 1 },
    { id: "weakened", sourceId: "character-1", appliedRound: 1 },
    { id: "empowered", sourceId: "enemy-1", appliedRound: 1, magnitude: 0.2 },
  ];
  state.enemyIntents = {};
  const first = resolveRound(
    prepareEnemyIntents(state),
    createEmptyRoundSelections(),
  );
  const scrapeEvent = first.events.find(
    (event) => event.type === "wait" && event.abilityId === "rockScrape",
  );

  assert.equal(first.nextState.enemies[0].stats.defense, 20);
  assert.equal(first.nextState.enemies[0].hp, 170);
  assert.deepEqual(
    first.nextState.enemies[0].statuses.map((status) => status.id),
    ["empowered"],
  );
  assert.ok(scrapeEvent?.type === "wait");
  assert.equal(scrapeEvent.defenseReduced, 4);
  assert.equal(scrapeEvent.remainingDefense, 20);
  assert.equal(scrapeEvent.healingAmount, 20);
  assert.equal(scrapeEvent.remainingHp, 170);
  assert.deepEqual(
    scrapeEvent.statusChanges.map((change) => change.statusId).sort(),
    ["bleed", "burn", "cinderCurse", "rootseed", "weakened"].sort(),
  );
  assert.equal(
    first.events.some(
      (event) =>
        (event.type === "damage" || event.type === "multiTargetDamage") &&
        event.abilityId === "rockScrape",
    ),
    false,
  );

  const floorState = createInitialCombatState(setup);
  floorState.round = 3;
  floorState.enemies[0].stats.defense = 8;
  floorState.enemyIntents = {};
  const floor = resolveRound(
    prepareEnemyIntents(floorState),
    createEmptyRoundSelections(),
  );
  assert.equal(floor.nextState.enemies[0].stats.defense, 8);
});

test("the cavern and all three supplied Rockhide sprites are wired in", () => {
  const encounters = readFileSync(
    new URL("../src/features/battle/data/encounterVisuals.ts", import.meta.url),
    "utf8",
  );
  const enemies = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );

  assert.match(encounters, /act2backgrounds\/act2background3\.png/);
  assert.match(encounters, /rockhideCavern:[\s\S]*enemyFormation/);
  for (const asset of [
    "rockhidelizard_idl.png",
    "rockhidelizard_attack.png",
    "rockhidelizard_stomp.png",
  ]) {
    assert.match(enemies, new RegExp(asset.replace(".", "\\.")));
  }
  assert.match(
    enemies,
    /rockhideLizard:[\s\S]*?hitboxAdjustment:[\s\S]*?left: "50%"[\s\S]*?top: "215px"[\s\S]*?width: "560px"[\s\S]*?height: "270px"/,
  );
});

test("Ground Slam stays stationary and shows the earthquake effect on both heroes", () => {
  const enemies = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );
  const abilities = readFileSync(
    new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(
    enemies,
    /groundSlam:[\s\S]*?variant: "stationaryAction"[\s\S]*?rockhideLizardStompSprite/,
  );
  assert.match(
    enemies,
    /rockhideLizardStompAdjustment[\s\S]*?targetAnchor: \{ x: 275, y: 375 \}[\s\S]*?displayScale: 0\.39/,
  );
  assert.match(
    abilities,
    /groundSlam:[\s\S]*?impactDelayMs: 700[\s\S]*?damageNumberDurationMs: 3200[\s\S]*?targetEffect:[\s\S]*?spriteSrc: earthSpellEffect[\s\S]*?variant: "earthquakeImpact"/,
  );
  assert.match(
    styles,
    /sequence-stationaryAction[\s\S]*?animation-name: enemyStationaryAction/,
  );
  assert.match(styles, /targetEffect--earthquakeImpact/);
});

test("Rock Scrape uses a restrained recovery effect instead of flashing the lizard", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const abilities = readFileSync(
    new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(
    abilities,
    /rockScrape:[\s\S]*?targetEffect:[\s\S]*?spriteSrc: healEffect[\s\S]*?variant: "rockScrapeRecovery"/,
  );
  assert.match(
    battleScreen,
    /event\.type === "wait"[\s\S]*?event\.abilityId === "rockScrape"[\s\S]*?event\.targetId === targetId/,
  );
  assert.match(styles, /targetEffect--rockScrapeRecovery/);
  assert.doesNotMatch(styles, /rockScrapeBodyGlow/);
  assert.match(battleScreen, /−\{rockScrapeImpact\.defenseReduced\} Defense/);
  assert.doesNotMatch(battleScreen, /Defense \{rockScrapeImpact\.remainingDefense[\s\S]*?→/);
});

test("Stonejaw Bite swaps directly to a forward-positioned attack sprite", () => {
  const enemies = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    enemies,
    /rockhideLizardAttackAdjustment[\s\S]*?targetAnchor: \{ x: 110, y: 340 \}/,
  );
  assert.match(
    enemies,
    /stonejawBite:[\s\S]*?variant: "bossAction"[\s\S]*?adjustment: rockhideLizardAttackAdjustment/,
  );
});
