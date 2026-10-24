import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import {
  createSpiritState,
  getSpiritPassive,
  upgradeKnownSpiritsToRankTwo,
} from "../src/data/spirits";
import { getPartyHealingReceivedBonus } from "../src/game/combat/healing";
import { applyCharacterHp } from "../src/game/ghost/ghostSystem";
import { createInitialCombatState } from "../src/game/state/initialState";
import type { GameSetup, SpiritId } from "../src/game/types";

const setup: GameSetup = {
  mode: "singlePlayer",
  initialLoadout: "run",
  randomSeed: 411,
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

test("every Spirit advances to Rank 2 without refreshing its active", () => {
  const spiritIds: SpiritId[] = [
    "bloodpact",
    "embertail",
    "stoneback",
    "swiftWing",
    "riverheart",
    "warhound",
    "guardDog",
    "ironquill",
    "phoenix",
  ];
  const known = Object.fromEntries(
    spiritIds.map((id) => [
      id,
      { ...createSpiritState(id), activeUsesRemaining: 0 },
    ]),
  );

  const upgraded = upgradeKnownSpiritsToRankTwo(known);

  for (const id of spiritIds) {
    assert.equal(upgraded[id]?.rank, 2);
    assert.equal(upgraded[id]?.activeUsesRemaining, 0);
  }
});

test("Rank 2 Spirit passives use the Act 2 values", () => {
  assert.deepEqual(getSpiritPassive(createSpiritState("bloodpact", 2)).roundStartBloodpact, {
    hpCost: 1,
    barrierAmount: 2,
    ppRestore: 1,
  });
  assert.deepEqual(getSpiritPassive(createSpiritState("embertail", 2)).firstDamageActionEachEncounter, {
    basePower: 12,
    damageType: "elemental",
    element: "fire",
    elementalPowerScaling: 0.35,
    statusOnHit: "burn",
  });
  assert.equal(
    getSpiritPassive(createSpiritState("stoneback", 2)).firstBarrierGainEachEncounter?.additionalBarrier,
    10,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("swiftWing", 2)).roundStartTurnPriority?.chance,
    0.35,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("riverheart", 2)).allHealingReceived?.flatIncrease,
    4,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("warhound", 2)).firstAutoAttackDamageMultiplier,
    1.6,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("guardDog", 2)).nonDamagingActionSpiritAttack?.basePower,
    8,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("guardDog", 2)).bodyguardCounterDamage,
    12,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("ironquill", 2)).steelDartAbilityAmplifier?.damageBonusPerDart,
    0.15,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("ironquill", 2)).freeSteelDartEachRound,
    true,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("phoenix", 2)).roundStartHealing?.amount,
    4,
  );
  assert.equal(
    getSpiritPassive(createSpiritState("phoenix", 2)).phoenixTonicReviveBonus?.amount,
    20,
  );
});

test("Rank 2 Spirit actives use the stronger values", () => {
  assert.deepEqual(ABILITIES.bloodpact.ranks[2]?.effects[0], {
    type: "bloodpact",
    hpCost: 10,
    barrierAmount: 45,
  });
  assert.equal(ABILITIES.cinderburst.ranks[2]?.effects[0].basePower, 14);
  assert.equal(ABILITIES.cinderburst.ranks[2]?.effects[0].elementalPowerScaling, 0.55);
  assert.equal(ABILITIES.stoneback.ranks[2]?.effects[0].amount, 9);
  assert.equal(ABILITIES.stoneback.ranks[2]?.effects[0].elementalPowerScaling, 0.5);
  assert.equal(ABILITIES.swiftWing.ranks[2]?.effects[0].basePower, 34);
  assert.equal(ABILITIES.swiftWing.ranks[2]?.effects[0].elementalPowerScaling, 1);
  assert.equal(ABILITIES.riverheart.ranks[2]?.effects[0].basePower, 28);
  assert.equal(ABILITIES.riverheart.ranks[2]?.effects[0].elementalPowerScaling, 0.65);
  assert.equal(ABILITIES.warhound.ranks[2]?.effects[0].basePower, 34);
  assert.equal(ABILITIES.warhound.ranks[2]?.effects[0].attackScaling, 1.3);
  assert.equal(
    ABILITIES.ironquill.ranks[2]?.effects.filter((effect) => effect.type === "damage").every(
      (effect) => effect.basePower === 8,
    ),
    true,
  );
});

test("Rank 2 Riverheart and Phoenix are resolved from the owner's Spirit rank", () => {
  const state = createInitialCombatState(setup);
  state.characters["character-1"].spirits = {
    riverheart: createSpiritState("riverheart", 2),
  };
  assert.equal(getPartyHealingReceivedBonus(state), 4);

  const phoenixOwner = {
    ...state.characters["character-1"],
    hp: 1,
    barrier: 0,
    spirits: { phoenix: createSpiritState("phoenix", 2) },
  };
  const reborn = applyCharacterHp(phoenixOwner, 0);
  assert.equal(reborn.form, "living");
  assert.equal(reborn.hp, 55);
  assert.equal(reborn.barrier, 20);
  assert.equal(reborn.spirits.phoenix?.activeUsesRemaining, 0);
});

test("the battle Spirit panel shows the passive for the current Spirit rank", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /const passive = getSpiritPassive\(spirit\)/);
  assert.match(battleScreen, /passiveDescription: passive\.description/);
});
