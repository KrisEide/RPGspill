import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import {
  createEmptyRoundSelections,
  selectPlayerAction,
} from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { CombatState, GameSetup } from "../src/game/types";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 1061,
  startingEncounterId: "slimeTrail",
  players: {
    player1: { id: "player1", controlledCharacterId: "character-1", character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" } },
    player2: { id: "player2", controlledCharacterId: "character-2", character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" } },
  },
};

function summonDemon() {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].abilityRanks.earthDemon = 1;
  state.characters["character-1"].stats.elementalPower.earth = 10;
  const selections = selectPlayerAction(state, createEmptyRoundSelections(), {
    playerId: "player1",
    abilityId: "earthDemon",
    targetId: "character-1",
  });
  assert.ok(selections);
  return resolveRound(state, selections);
}

test("Earth Demon defines its summon ranks and reward", () => {
  assert.equal(ABILITIES.earthDemon.ranks[1].ppCost, 20);
  assert.ok(ABILITIES.earthDemon.ranks[1].description.includes("single-target"));
  assert.ok(ABILITY_REWARD_POOL.some(({ abilityId }) => abilityId === "earthDemon"));
});

test("Earth Demon is summoned with scaled HP and attacks at round end", () => {
  const result = summonDemon();
  assert.equal(result.nextState.earthDemon?.maxHp, 40);
  assert.equal(result.nextState.earthDemon?.hp, 40);
  assert.equal(result.nextState.characters["character-1"].pp, 35);
  assert.ok(result.events.some((event) => event.type === "earthDemonSummoned"));
  assert.ok(result.events.some((event) => event.type === "earthDemonAttack"));
});

test("Earth Demon absorbs an entire lethal single-target hit without overflow", () => {
  const summoned = summonDemon().nextState;
  const state: CombatState = {
    ...summoned,
    phase: "selectingActions",
    earthDemon: summoned.earthDemon ? { ...summoned.earthDemon, hp: 5 } : null,
    enemyIntents: {
      "enemy-1": { abilityId: "autoAttack", targetId: "character-1", targetIds: ["character-1"] },
    },
  };
  state.enemies[0].stats.attack = 100;
  const heroHp = state.characters["character-1"].hp;
  const result = resolveRound(state, createEmptyRoundSelections());

  assert.equal(result.nextState.earthDemon, null);
  assert.equal(result.nextState.characters["character-1"].hp, heroHp);
  assert.ok(result.events.some((event) => event.type === "earthDemonHit" && event.destroyed));
});

test("multi-target attacks bypass Earth Demon", () => {
  const summoned = summonDemon().nextState;
  const state: CombatState = {
    ...summoned,
    phase: "selectingActions",
    enemyIntents: {
      "enemy-1": { abilityId: "orcGruntMultiAttack", targetId: null, targetIds: ["character-1", "character-2"] },
    },
  };
  const demonHp = state.earthDemon?.hp;
  const result = resolveRound(state, createEmptyRoundSelections());

  assert.equal(result.nextState.earthDemon?.hp, demonHp);
  assert.ok(!result.events.some((event) => event.type === "earthDemonHit"));
});

test("multi-target attacks still bypass Earth Demon with only one living hero", () => {
  const summoned = summonDemon().nextState;
  const state: CombatState = {
    ...summoned,
    phase: "selectingActions",
    enemyIntents: {
      "enemy-1": { abilityId: "orcGruntMultiAttack", targetId: null, targetIds: ["character-1"] },
    },
  };
  state.characters["character-2"].hp = 0;
  const demonHp = state.earthDemon?.hp;
  const result = resolveRound(state, createEmptyRoundSelections());

  assert.equal(result.nextState.earthDemon?.hp, demonHp);
  assert.ok(!result.events.some((event) => event.type === "earthDemonHit"));
});

test("development loadout includes Earth Demon for both heroes", () => {
  const developmentState = createInitialCombatState({
    ...setup,
    initialLoadout: "development",
  });

  assert.equal(developmentState.characters["character-1"].abilityRanks.earthDemon, 1);
  assert.equal(developmentState.characters["character-2"].abilityRanks.earthDemon, 1);
});

test("Earth Demon uses a compact left-side presentation", () => {
  assert.doesNotMatch(battleScreen, /<strong>Earth Demon<\/strong>/);
  assert.match(
    stylesheet,
    /\.earthDemon\s*\{[^}]*left:\s*160px;[^}]*bottom:\s*calc\(var\(--hud-height\) \+ 120px\);[^}]*width:\s*290px;[^}]*height:\s*290px;/s,
  );
  assert.match(
    stylesheet,
    /\.earthDemon__status\s*\{[^}]*width:\s*86px;/s,
  );
});

test("intercepted attacks animate toward Earth Demon and show their damage", () => {
  assert.match(battleScreen, /const earthDemonElementRef = useRef/);
  assert.match(
    battleScreen,
    /currentCombatEvent\?\.type === "earthDemonHit"\s*\? ABILITY_VISUALS\[currentCombatEvent\.abilityId\]/,
  );
  assert.match(
    battleScreen,
    /currentCombatEvent\?\.type === "earthDemonHit"\s*&&\s*gameState\.pendingRound\?\.currentEventApplied/,
  );
  assert.match(
    battleScreen,
    /displayedImpactEvent\?\.type === "earthDemonHit"[\s\S]*?<DamageNumber[\s\S]*?amount=\{displayedImpactEvent\.amount\}/,
  );
  assert.match(
    battleScreen,
    /currentCombatEvent\?\.type === "earthDemonHit"[\s\S]*?currentCombatEvent\.actorId === enemy\.instanceId/,
  );
  assert.doesNotMatch(
    stylesheet,
    /@keyframes earthDemonHit\s*\{[^}]*translateX/s,
  );
});
