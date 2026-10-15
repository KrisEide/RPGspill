import assert from "node:assert/strict";
import test from "node:test";

import { WIND_ABILITY_DEFINITIONS } from "../src/data/abilities/wind";

test("Wind Slash has a high rank-based critical hit chance without showing percentages", () => {
  const rank1 = WIND_ABILITY_DEFINITIONS.windSlash.ranks[1];
  const rank2 = WIND_ABILITY_DEFINITIONS.windSlash.ranks[2];

  assert.equal(rank1.effects[0].criticalHit?.chance, 0.25);
  assert.equal(rank2.effects[0].criticalHit?.chance, 0.35);

  for (const rank of [rank1, rank2]) {
    assert.match(rank.shortDescription, /high critical hit chance/i);
    assert.match(rank.description, /high critical hit chance/i);
    assert.doesNotMatch(rank.shortDescription, /\d+\s*%/);
    assert.doesNotMatch(rank.description, /\d+\s*%/);
  }
});
