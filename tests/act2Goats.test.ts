import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENCOUNTER_DEFINITIONS } from "../src/data/encounters";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { createKnownSpirits } from "../src/data/spirits";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { resolveRound } from "../src/game/combat/resolveRound";
import { startEncounter } from "../src/game/state/encounterState";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 1402,
  startingEncounterId: "mountainPass",
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

test("Act 2 begins after the Orc Brothers with the two goats", () => {
  assert.equal(ENCOUNTER_DEFINITIONS.orcBrothers.nextEncounterId, "mountainPass");
  assert.deepEqual(
    ENCOUNTER_DEFINITIONS.mountainPass.enemies.map((enemy) => enemy.enemyId),
    ["goat1", "goat2"],
  );
  assert.equal(ENCOUNTER_DEFINITIONS.mountainPass.fullPartyRestore, true);
});

test("the goats use the agreed distinct stats", () => {
  assert.deepEqual(
    {
      hp: ENEMY_DEFINITIONS.goat1.stats.maxHp,
      attack: ENEMY_DEFINITIONS.goat1.stats.attack,
      defense: ENEMY_DEFINITIONS.goat1.stats.defense,
      resistance: ENEMY_DEFINITIONS.goat1.stats.resistance,
      agility: ENEMY_DEFINITIONS.goat1.stats.agility,
    },
    { hp: 145, attack: 15, defense: 9, resistance: 13, agility: 15 },
  );
  assert.deepEqual(
    {
      hp: ENEMY_DEFINITIONS.goat2.stats.maxHp,
      attack: ENEMY_DEFINITIONS.goat2.stats.attack,
      defense: ENEMY_DEFINITIONS.goat2.stats.defense,
      resistance: ENEMY_DEFINITIONS.goat2.stats.resistance,
      agility: ENEMY_DEFINITIONS.goat2.stats.agility,
    },
    { hp: 165, attack: 18, defense: 14, resistance: 9, agility: 9 },
  );
});

test("the goats sit farther back with slightly smaller, softer sprites", () => {
  const encounterVisuals = readFileSync(
    new URL("../src/features/battle/data/encounterVisuals.ts", import.meta.url),
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

  assert.match(
    encounterVisuals,
    /mountainPass:[\s\S]*xPercent: 61, yPercent: 36, scale: 0\.77[\s\S]*xPercent: 82, yPercent: 36, scale: 0\.81/,
  );
  assert.match(
    enemyVisuals,
    /baseFilter\?: string;[\s\S]*goat1:[\s\S]*baseFilter: "brightness\(0\.9\) contrast\(0\.9\) saturate\(0\.92\)"[\s\S]*goat2:[\s\S]*baseFilter: "brightness\(0\.9\) contrast\(0\.9\) saturate\(0\.92\)"/,
  );
  assert.match(battleScreen, /battleScene__enemyUnit--\$\{enemy\.enemyId\}/);
  assert.match(battleScreen, /--enemy-base-filter/);
  assert.match(
    styles,
    /battleScene__enemyUnit--goat1[\s\S]*battleScene__enemyUnit--goat2[\s\S]*\.battleScene__enemySpriteStage[\s\S]*filter: var\(--enemy-base-filter\) !important/,
  );
});

test("only one goat attacks each round in the staggered pattern", () => {
  const expected = [
    ["enemy-1", "goatStomp"],
    ["enemy-2", "goatCharge"],
    ["enemy-1", "goatCharge"],
    ["enemy-2", "goatStomp"],
  ] as const;

  for (const [index, [actorId, abilityId]] of expected.entries()) {
    const state = createInitialCombatState(setup);
    state.round = index + 1;
    state.enemyIntents = {};
    const prepared = prepareEnemyIntents(state);

    assert.deepEqual(Object.keys(prepared.enemyIntents), [actorId]);
    assert.equal(prepared.enemyIntents[actorId]?.abilityId, abilityId);
  }
});

test("Stomp damages both heroes and Cracks only heroes whose HP it damages", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].stats.defense = 0;
  state.characters["character-2"].stats.defense = 0;
  state.characters["character-1"].barrier = 20;
  state.round = 1;
  const prepared = prepareEnemyIntents({ ...state, enemyIntents: {} });
  const result = resolveRound(prepared, createEmptyRoundSelections());

  assert.equal(
    result.nextState.characters["character-1"].hp,
    state.characters["character-1"].hp,
  );
  assert.equal(
    result.nextState.characters["character-1"].statuses.some(
      (status) => status.id === "cracked",
    ),
    false,
  );
  const stompDamage =
    state.characters["character-2"].hp -
    result.nextState.characters["character-2"].hp;
  assert.ok(stompDamage >= 13 && stompDamage <= 17);
  assert.equal(
    result.nextState.characters["character-2"].statuses.some(
      (status) => status.id === "cracked",
    ),
    true,
  );
});

test("the Act 2 checkpoint reforms a Ghost and fully restores both heroes", () => {
  const bossSetup = { ...setup, startingEncounterId: "orcBrothers" as const };
  const state = createInitialCombatState(bossSetup);
  state.characters["character-1"] = {
    ...state.characters["character-1"],
    form: "ghost",
    hp: 47,
    pp: 3,
    savedLivingPp: 11,
    ghostReformReady: true,
    soulLinkActive: true,
    barrier: 18,
    statuses: [{ id: "bleed", sourceId: "enemy-1", appliedRound: 2 }],
  };
  state.characters["character-2"].hp = 4;
  state.characters["character-2"].pp = 1;
  state.characters["character-2"].barrier = 9;
  state.characters["character-1"].spirits = createKnownSpirits(["phoenix"]);
  state.characters["character-1"].spirits.phoenix!.activeUsesRemaining = 0;

  const actTwo = startEncounter(state, "mountainPass");

  for (const character of Object.values(actTwo.characters)) {
    assert.equal(character.form, "living");
    assert.equal(character.hp, character.stats.maxHp);
    assert.equal(character.pp, character.stats.maxPp);
    assert.equal(character.barrier, 0);
    assert.deepEqual(character.statuses, []);
  }
  assert.equal(actTwo.characters["character-1"].savedLivingPp, null);
  assert.equal(actTwo.characters["character-1"].ghostReformReady, false);
  assert.equal(actTwo.characters["character-1"].soulLinkActive, false);
  assert.equal(
    actTwo.characters["character-1"].spirits.phoenix?.activeUsesRemaining,
    0,
  );
});

test("Act 2 uses the supplied background and all six goat sprites", () => {
  const encounters = readFileSync(
    new URL("../src/features/battle/data/encounterVisuals.ts", import.meta.url),
    "utf8",
  );
  const enemies = readFileSync(
    new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
    "utf8",
  );

  assert.match(encounters, /act2backgrounds\/act2background1\.png/);
  for (const asset of [
    "goat1_idle.png",
    "goat1_stomp.png",
    "goat1_charge.png",
    "goat2_idle.png",
    "goat2_stomp.png",
    "goat2_charge.png",
  ]) {
    assert.match(enemies, new RegExp(asset.replace(".", "\\.")));
  }
});
