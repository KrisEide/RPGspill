import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENCOUNTER_DEFINITIONS } from "../src/data/encounters";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";
import { createKnownSpirits } from "../src/data/spirits";
import { STATUS_DEFINITIONS } from "../src/data/statuses";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { calculateDamage } from "../src/game/combat/calculateDamage";
import { prepareEnemyIntents } from "../src/game/combat/enemyIntents";
import { resolveRound } from "../src/game/combat/resolveRound";
import { resolveAbility } from "../src/game/abilities/abilityProgression";
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
    { hp: 130, attack: 15, defense: 9, resistance: 13, agility: 15 },
  );
  assert.deepEqual(
    {
      hp: ENEMY_DEFINITIONS.goat2.stats.maxHp,
      attack: ENEMY_DEFINITIONS.goat2.stats.attack,
      defense: ENEMY_DEFINITIONS.goat2.stats.defense,
      resistance: ENEMY_DEFINITIONS.goat2.stats.resistance,
      agility: ENEMY_DEFINITIONS.goat2.stats.agility,
    },
    { hp: 150, attack: 18, defense: 14, resistance: 9, agility: 9 },
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

test("the goats offset Stomp, Charge Up, and Charge across a three-round cycle", () => {
  const expected = [
    { "enemy-1": "goatStomp", "enemy-2": "goatCharge" },
    { "enemy-1": "goatChargeUp", "enemy-2": "goatStomp" },
    { "enemy-1": "goatCharge", "enemy-2": "goatChargeUp" },
    { "enemy-1": "goatStomp", "enemy-2": "goatCharge" },
    { "enemy-1": "goatChargeUp", "enemy-2": "goatStomp" },
    { "enemy-1": "goatCharge", "enemy-2": "goatChargeUp" },
  ] as const;

  for (const [index, intents] of expected.entries()) {
    const state = createInitialCombatState(setup);
    state.round = index + 1;
    state.enemyIntents = {};
    const prepared = prepareEnemyIntents(state);

    assert.deepEqual(
      Object.fromEntries(
        Object.entries(prepared.enemyIntents).map(([actorId, intent]) => [
          actorId,
          intent.abilityId,
        ]),
      ),
      intents,
    );
  }
});

test("Stomp damages both heroes without applying Charge or Defense statuses", () => {
  const state = createInitialCombatState(setup);
  state.round = 1;
  const prepared = prepareEnemyIntents({ ...state, enemyIntents: {} });
  const result = resolveRound(prepared, createEmptyRoundSelections());

  const stomp = result.events.find(
    (event) =>
      event.type === "multiTargetDamage" && event.abilityId === "goatStomp",
  );
  const charge = result.events.find(
    (event) => event.type === "damage" && event.abilityId === "goatCharge",
  );
  assert.ok(stomp?.type === "multiTargetDamage");
  assert.equal(stomp.impacts.length, 2);
  assert.ok(charge?.type === "damage");
  assert.equal(
    Object.values(result.nextState.characters).some((character) =>
      character.statuses.some(
        (status) =>
          status.id === "goatMarked" || status.id === "goatDefenseBreak",
      ),
    ),
    false,
  );
  assert.ok(stomp.impacts.every((impact) => impact.amount < charge.amount));
});

test("Charge Up marks one hero, removes 5 Defense, and readies the next Charge", () => {
  const state = createInitialCombatState(setup);
  state.round = 2;
  state.enemies = state.enemies.slice(0, 1);
  state.characters["character-2"].hp = 0;
  const prepared = prepareEnemyIntents({ ...state, enemyIntents: {} });
  assert.equal(prepared.enemyIntents["enemy-1"]?.abilityId, "goatChargeUp");

  const result = resolveRound(prepared, createEmptyRoundSelections());
  const target = result.nextState.characters["character-1"];
  assert.equal(
    target.statuses.find((status) => status.id === "goatDefenseBreak")
      ?.magnitude,
    1,
  );
  assert.ok(
    target.statuses.some(
      (status) =>
        status.id === "goatMarked" &&
        status.readiedAbilityId === "goatCharge" &&
        status.sourceId === "enemy-1",
    ),
  );
  assert.ok(
    result.events.some(
      (event) =>
        event.type === "statusApplied" &&
        event.abilityId === "goatChargeUp" &&
        event.targetId === "character-1",
    ),
  );
  assert.equal(result.nextState.enemyIntents["enemy-1"]?.abilityId, "goatCharge");
  assert.equal(result.nextState.enemyIntents["enemy-1"]?.targetId, "character-1");

  const charged = resolveRound(
    result.nextState,
    createEmptyRoundSelections(),
  );
  assert.equal(
    charged.nextState.characters["character-1"].statuses.some(
      (status) =>
        status.id === "goatMarked" &&
        status.readiedAbilityId === "goatCharge" &&
        status.sourceId === "enemy-1",
    ),
    false,
  );
  assert.ok(
    (charged.nextState.characters["character-1"].statuses.find(
      (status) => status.id === "goatDefenseBreak",
    )?.magnitude ?? 0) >= 1,
  );
  assert.ok(
    charged.nextState.characters["character-1"].hp < target.hp,
  );
});

test("Charge Up stacks minus 5 Defense to minus 20 while Defense floors at zero", () => {
  assert.equal(STATUS_DEFINITIONS.goatMarked.name, "Charge Target");
  assert.equal(STATUS_DEFINITIONS.goatMarked.defensiveStatReduction, undefined);
  assert.equal(STATUS_DEFINITIONS.goatDefenseBreak.name, "Shaken Defense");
  assert.equal(STATUS_DEFINITIONS.goatDefenseBreak.stackingRule, "increaseMagnitude");
  assert.equal(STATUS_DEFINITIONS.goatDefenseBreak.maxMagnitude, 4);
  assert.deepEqual(STATUS_DEFINITIONS.goatDefenseBreak.defensiveStatReduction, {
    defense: 5,
    resistance: 0,
  });

  const state = createInitialCombatState(setup);
  state.enemies = state.enemies.slice(0, 1);
  state.characters["character-2"].hp = 0;
  let stackedState = state;
  for (let application = 0; application < 5; application += 1) {
    stackedState.enemyIntents = {
      "enemy-1": {
        abilityId: "goatChargeUp",
        targetId: "enemy-1",
        targetIds: ["enemy-1"],
      },
    };
    stackedState = resolveRound(
      stackedState,
      createEmptyRoundSelections(),
    ).nextState;
  }
  assert.equal(
    stackedState.characters["character-1"].statuses.find(
      (status) => status.id === "goatDefenseBreak",
    )?.magnitude,
    4,
  );

  const charge = resolveAbility("goatCharge", 1);
  const damageEffect = charge?.effects.find((effect) => effect.type === "damage");
  assert.ok(damageEffect?.type === "damage");
  assert.equal(damageEffect.basePower, 11);
  const defender = state.characters["character-1"].stats;
  const attacker = state.enemies[0].stats;
  const atMaxBreak = calculateDamage({
    attacker,
    defender,
    defenderStatuses: [{
      id: "goatDefenseBreak",
      sourceId: "enemy-1",
      appliedRound: 1,
      magnitude: 4,
    }],
    element: null,
    effect: damageEffect,
  });
  const atZeroDefense = calculateDamage({
    attacker,
    defender: { ...defender, defense: 0 },
    element: null,
    effect: damageEffect,
  });
  assert.equal(atMaxBreak, atZeroDefense);

  const abilityVisuals = readFileSync(
    new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
    "utf8",
  );
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const statusPanel = readFileSync(
    new URL("../src/features/battle/components/PartyStatusPanel.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(
    abilityVisuals,
    /goatChargeUp:[\s\S]*?impactDelayMs: 2400[\s\S]*?eventDurationMs: 5600/,
  );
  assert.match(battleScreen, /goatChargeUpTargetEffect/);
  assert.match(battleScreen, /−5 DEFENSE/);
  assert.match(battleScreen, /DEFENSE/);
  assert.match(statusPanel, /🎯 CHARGE TARGET/);
  assert.match(statusPanel, /DEF −/);
  assert.match(styles, /battleScene__enemyUnit--ability-goatChargeUp::after/);
  assert.match(styles, /goatChargeUpAura/);
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
