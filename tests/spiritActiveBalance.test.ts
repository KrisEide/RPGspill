import assert from "node:assert/strict";
import { test } from "node:test";
import { ABILITIES } from "../src/data/abilities";

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

test("Stoneback active grants 12 + 40% Earth Power Barrier to both heroes", () => {
  const ability = ABILITIES.stoneback;

  assert.equal(ability.target, "allAllies");
  assert.deepEqual(ability.ranks[1].effects, [
    {
      type: "barrier",
      amount: 12,
      elementalPowerScaling: 0.4,
    },
  ]);
});

test("Swift Wing active deals 20 + 60% Wind Power while retaining priority", () => {
  const ability = ABILITIES.swiftWing;

  assert.equal(ability.resolutionPriority, 300);
  assert.deepEqual(ability.ranks[1].effects, [
    {
      type: "damage",
      damageType: "elemental",
      basePower: 20,
      attackScaling: 0,
      elementalPowerScaling: 0.6,
    },
  ]);
});

test("Warhound active deals 22 + 80% Attack Physical damage", () => {
  assert.deepEqual(ABILITIES.warhound.ranks[1].effects, [
    {
      type: "damage",
      damageType: "physical",
      basePower: 22,
      attackScaling: 0.8,
      elementalPowerScaling: 0,
    },
  ]);
});

