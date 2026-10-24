import assert from "node:assert/strict";
import { test } from "node:test";
import { ABILITIES } from "../src/data/abilities";
import { CHARACTER_PRESETS } from "../src/data/presets";
import { createKnownSpirits } from "../src/data/spirits";
import { createEmptyRoundSelections } from "../src/game/combat/playerActions";
import { resolveRound } from "../src/game/combat/resolveRound";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 902,
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

test("Embertail active deals 6 + 30% Fire Power to all enemies and applies Burn", () => {
  const ability = ABILITIES.cinderburst;

  assert.equal(ability.target, "allEnemies");
  assert.deepEqual(ability.ranks[1].effects, [
    {
      type: "damage",
      damageType: "elemental",
      basePower: 6,
      attackScaling: 0,
      elementalPowerScaling: 0.3,
      statusOnHit: { statusId: "burn" },
    },
  ]);
});

test("Stoneback Rank 1 grants 9 actual Barrier at the starting 10 Earth Power", () => {
  const ability = ABILITIES.stoneback;

  assert.equal(ability.target, "allAllies");
  assert.deepEqual(ability.ranks[1].effects, [
    {
      type: "barrier",
      amount: 4,
      elementalPowerScaling: 0.5,
    },
  ]);
  const effect = ability.ranks[1].effects[0];
  assert.equal(effect.type, "barrier");
  if (effect.type === "barrier") {
    assert.equal(
      Math.round(
        effect.amount +
          CHARACTER_PRESETS.char1.stats.elementalPower.earth *
            (effect.elementalPowerScaling ?? 0),
      ),
      9,
    );
  }

  const rankTwoEffect = ability.ranks[2]?.effects[0];
  assert.equal(rankTwoEffect?.type, "barrier");
  if (rankTwoEffect?.type === "barrier") {
    assert.equal(rankTwoEffect.amount, 9);
    assert.equal(rankTwoEffect.elementalPowerScaling, 0.5);
    assert.equal(
      Math.round(
        rankTwoEffect.amount +
          CHARACTER_PRESETS.char1.stats.elementalPower.earth *
            (rankTwoEffect.elementalPowerScaling ?? 0),
      ),
      14,
    );
  }
});

test("Stoneback active gives both heroes the same 9 Barrier before its passive is used", () => {
  const state = createInitialCombatState(setup);
  state.enemyIntents = {};
  state.characters["character-1"].spirits = createKnownSpirits(["stoneback"]);
  const selections = createEmptyRoundSelections();
  selections["character-1"].action = {
    kind: "ability",
    actorId: "character-1",
    abilityId: "stoneback",
    targetId: null,
  };

  const result = resolveRound(state, selections);

  assert.equal(result.nextState.characters["character-1"].barrier, 9);
  assert.equal(result.nextState.characters["character-2"].barrier, 9);
  assert.equal(
    result.nextState.characters["character-1"].spirits.stoneback
      ?.passiveTriggeredThisEncounter,
    false,
  );
});

test("Swift Wing active deals 22 + 65% Wind Power while retaining priority", () => {
  const ability = ABILITIES.swiftWing;

  assert.equal(ability.resolutionPriority, 300);
  assert.deepEqual(ability.ranks[1].effects, [
    {
      type: "damage",
      damageType: "elemental",
      basePower: 22,
      attackScaling: 0,
      elementalPowerScaling: 0.65,
    },
  ]);
});

test("Warhound active deals 25 + 90% Attack Physical damage", () => {
  assert.deepEqual(ABILITIES.warhound.ranks[1].effects, [
    {
      type: "damage",
      damageType: "physical",
      basePower: 25,
      attackScaling: 0.9,
      elementalPowerScaling: 0,
    },
  ]);
});
