import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const enemyVisuals = readFileSync(
  new URL("../src/features/battle/data/enemyVisuals.ts", import.meta.url),
  "utf8",
);
const abilityVisuals = readFileSync(
  new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Prepare Sweep keeps the Grunt idle while its charge builds", () => {
  assert.match(abilityVisuals, /prepareSweep/);
  assert.doesNotMatch(
    enemyVisuals,
    /prepareSweep:[\s\S]*level1OrcAutoAttackSprite/,
  );
  assert.match(styles, /ability-prepareSweep/);
  assert.match(styles, /enemyGruntCharge/);
  assert.match(styles, /gruntChargeIdlePose/);
  assert.match(battleScreen, /Preparing Sweep/);
});

test("a charged Grunt shows both targets without extra ability text", () => {
  assert.doesNotMatch(battleScreen, /Multi Attack Ready/);
  assert.doesNotMatch(battleScreen, /enemyStatus__chargedAbility/);
  assert.doesNotMatch(styles, /enemyStatus__chargedAbility/);
  assert.match(battleScreen, /enemyIntentTargets\.map/);
});
