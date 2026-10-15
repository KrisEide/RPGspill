import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const abilityVisuals = readFileSync(
  new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
  "utf8",
);
const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const characterVisuals = readFileSync(
  new URL("../src/features/battle/data/characterVisuals.ts", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Twin Flames uses the supplied flame sprite and existing cast sprites", () => {
  assert.match(abilityVisuals, /import twinFlamesEffect from .*twinflames\.png/);
  assert.match(abilityVisuals, /twinFlames:[\s\S]*spriteSrc: twinFlamesEffect/);
  assert.equal(
    (characterVisuals.match(/twinFlames: (rowan|lyra)CastSpellSprite/g) ?? [])
      .length,
    2,
  );
});

test("Twin Flames selects a distinct target-effect color from its partner element", () => {
  for (const variant of [
    "twinFlames",
    "twinFlamesWater",
    "twinFlamesEarth",
    "twinFlamesWind",
    "twinFlamesGhost",
  ]) {
    assert.match(abilityVisuals, new RegExp(`\\| "${variant}"`));
    assert.match(stylesheet, new RegExp(`targetEffect--${variant}`));
  }

  assert.match(battleScreen, /twinFlamesElement === "water"/);
  assert.match(battleScreen, /twinFlamesElement === "earth"/);
  assert.match(battleScreen, /twinFlamesElement === "wind"/);
  assert.match(stylesheet, /twinFlamesWater[\s\S]*hue-rotate\(185deg\)/);
  assert.match(stylesheet, /twinFlamesEarth[\s\S]*sepia\(1\)/);
  assert.match(stylesheet, /twinFlamesWind[\s\S]*grayscale\(1\)/);
  assert.match(stylesheet, /twinFlamesGhost[\s\S]*hue-rotate\(205deg\)/);
});

test("Twin Flames follow-up hits do not replay the caster animation", () => {
  assert.match(
    battleScreen,
    /currentCombatEvent\.twinFlamesFollowUp !== true/,
  );
  assert.match(battleScreen, /TWIN_FLAMES_FOLLOW_UP_EVENT_DURATION_MS/);
});

test("the hidden Ghost combo gets a long distinct recovery sequence", () => {
  assert.match(battleScreen, /TWIN_FLAMES_GHOST_EVENT_DURATION_MS\s*=\s*7200/);
  assert.match(battleScreen, /twinFlamesGhostPartnerId/);
  assert.match(battleScreen, /\+\{supportImpact\.healingAmount\} GHOST HP/);
  assert.match(stylesheet, /twinFlamesGhostRecovery/);
  assert.match(stylesheet, /twinFlamesGhostPulse/);
});
