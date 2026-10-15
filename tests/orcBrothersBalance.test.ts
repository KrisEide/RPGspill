import assert from "node:assert/strict";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { ENEMY_DEFINITIONS } from "../src/data/monsters";

function getDamageBasePower(abilityId: keyof typeof ABILITIES) {
  const effect = ABILITIES[abilityId].ranks[1].effects.find(
    (candidate) => candidate.type === "damage",
  );

  assert.ok(effect && effect.type === "damage");
  return effect.basePower;
}

test("the Orc Brothers use the tuned boss health totals", () => {
  assert.equal(ENEMY_DEFINITIONS.brakkBoss.stats.maxHp, 180);
  assert.equal(ENEMY_DEFINITIONS.gorakBoss.stats.maxHp, 140);
});

test("the Orc Brothers retain their mechanics with lower attack damage", () => {
  assert.equal(getDamageBasePower("gorakAutoAttack"), 12);
  assert.equal(getDamageBasePower("shieldCharge"), 16);
  assert.equal(getDamageBasePower("bloodCleave"), 14);
  assert.equal(getDamageBasePower("smash"), 24);

  const shieldCharge = ABILITIES.shieldCharge.ranks[1].effects[0];
  const bloodCleave = ABILITIES.bloodCleave.ranks[1].effects[0];

  assert.ok(shieldCharge.type === "damage");
  assert.deepEqual(shieldCharge.statusOnHpDamage, { statusId: "stunned" });
  assert.ok(bloodCleave.type === "damage");
  assert.deepEqual(bloodCleave.statusOnHpDamage, { statusId: "bleed" });
});
