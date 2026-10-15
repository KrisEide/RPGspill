import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ABILITIES } from "../src/data/abilities";

test("Crashing Wave applies a meaningful Weak effect at both ranks", () => {
  const rankOne = ABILITIES.crashingWave.ranks[1];
  const rankTwo = ABILITIES.crashingWave.ranks[2];

  assert.match(rankOne.description, /30%/);
  assert.match(rankTwo!.description, /40%/);
  assert.equal(
    rankOne.effects[0]?.type === "damage"
      ? rankOne.effects[0].statusOnHit?.magnitude
      : null,
    0.3,
  );
  assert.equal(
    rankTwo?.effects[0]?.type === "damage"
      ? rankTwo.effects[0].statusOnHit?.magnitude
      : null,
    0.4,
  );
});

test("Weak is visible on the affected enemy until its next attack", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /status\.id === "weakened"/);
  assert.match(battleScreen, /Weak · next attack deals/);
  assert.match(battleScreen, /⚔−\{weakenedDamageReduction\}%/);
  assert.match(styles, /\.enemyStatus__effect--weakened/);
});
