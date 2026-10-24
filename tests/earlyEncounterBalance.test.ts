import assert from "node:assert/strict";
import test from "node:test";

import { ABILITIES } from "../src/data/abilities";
import { CHARACTER_PRESETS } from "../src/data/presets";
import { calculateDamage } from "../src/game/combat/calculateDamage";
import { applyDamageVariance } from "../src/game/combat/damageVariance";
import { createEnemyState } from "../src/game/state/encounterState";

test("Green Slime's Strong Attack uses its increased AOE damage", () => {
  const ability = ABILITIES.greenSlimeStrongAttack;
  const effect = ability.ranks[1].effects[0];
  assert.ok(effect.type === "damage");
  assert.equal(effect.basePower, 9);

  const slime = createEnemyState("greenSlime", "enemy-1", "normal");
  const damageRange = [CHARACTER_PRESETS.char1, CHARACTER_PRESETS.char2].map(
    (character) => {
      const damage = calculateDamage({
        attacker: slime.stats,
        defender: character.stats,
        element: ability.element,
        effect,
      });
      return [
        applyDamageVariance(damage, 0),
        applyDamageVariance(damage, 0.999_999),
      ];
    },
  );

  assert.deepEqual(damageRange, [
    [7, 8],
    [6, 7],
  ]);
});
