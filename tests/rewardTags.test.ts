import assert from "node:assert/strict";
import test from "node:test";

import { ABILITY_REWARD_POOL } from "../src/data/abilityRewards";
import { GHOST_REWARD_POOL } from "../src/data/ghostRewards";
import { ITEM_DEFINITIONS } from "../src/data/items";
import { PASSIVE_REWARD_POOL } from "../src/data/passives";
import {
  FOREST_REST_CHOICES,
  SPIRIT_CAMP_CHOICES,
} from "../src/data/restChoices";
import { SPIRIT_DEFINITIONS } from "../src/data/spirits";
import { STAT_UPGRADE_POOL } from "../src/data/upgrades";

type PossiblyTagged = {
  tags?: readonly string[];
};

function assertFullyTagged(name: string, entries: readonly PossiblyTagged[]) {
  for (const [index, entry] of entries.entries()) {
    assert.ok(entry.tags, `${name}[${index}] is missing tags`);
    assert.ok(entry.tags.length > 0, `${name}[${index}] has no tags`);
    assert.equal(
      new Set(entry.tags).size,
      entry.tags.length,
      `${name}[${index}] contains duplicate tags`,
    );
  }
}

test("every current reward source has build tags", () => {
  assertFullyTagged("abilities", ABILITY_REWARD_POOL);
  assertFullyTagged("passives", PASSIVE_REWARD_POOL);
  assertFullyTagged("stats", STAT_UPGRADE_POOL);
  assertFullyTagged("spirits", Object.values(SPIRIT_DEFINITIONS));
  assertFullyTagged("items", Object.values(ITEM_DEFINITIONS));
  assertFullyTagged("ghost rewards", GHOST_REWARD_POOL);
  assertFullyTagged("forest rest", Object.values(FOREST_REST_CHOICES));
  assertFullyTagged("spirit camp", Object.values(SPIRIT_CAMP_CHOICES));
});

test("tags connect existing rewards that share mechanics", () => {
  const windSlash = ABILITY_REWARD_POOL.find(
    ({ abilityId }) => abilityId === "windSlash",
  );
  const lacerate = ABILITY_REWARD_POOL.find(
    ({ abilityId }) => abilityId === "lacerate",
  );
  const razorBomb = ITEM_DEFINITIONS.razorBomb;
  const bloodScent = PASSIVE_REWARD_POOL.find(
    ({ id }) => id === "bloodScent",
  );

  assert.ok(windSlash?.tags?.includes("wind"));
  assert.ok(windSlash?.tags?.includes("crit"));
  assert.ok(lacerate?.tags?.includes("bleed"));
  assert.ok(razorBomb.tags?.includes("bleed"));
  assert.ok(bloodScent?.tags?.includes("bleed"));
});
