import assert from "node:assert/strict";
import test from "node:test";

import { CHARACTER_PRESETS } from "../src/data/presets";

test("Rowan starts as the faster PP and critical-focused hero", () => {
  const stats = CHARACTER_PRESETS.char1.stats;

  assert.equal(stats.maxHp, 95);
  assert.equal(stats.maxPp, 55);
  assert.equal(stats.attack, 10);
  assert.equal(stats.defense, 9);
  assert.equal(stats.resistance, 11);
  assert.equal(stats.agility, 12);
  assert.equal(stats.criticalChance, 0.05);
  assert.deepEqual(stats.elementalPower, {
    fire: 10,
    water: 10,
    earth: 10,
    wind: 10,
  });
});

test("Lyra starts as the durable physical hero", () => {
  const stats = CHARACTER_PRESETS.char2.stats;

  assert.equal(stats.maxHp, 110);
  assert.equal(stats.maxPp, 50);
  assert.equal(stats.attack, 12);
  assert.equal(stats.defense, 12);
  assert.equal(stats.resistance, 9);
  assert.equal(stats.agility, 10);
  assert.equal(stats.criticalChance, 0);
  assert.deepEqual(stats.elementalPower, {
    fire: 10,
    water: 10,
    earth: 10,
    wind: 10,
  });
});
