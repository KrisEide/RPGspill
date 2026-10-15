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

test("Cyclone uses its supplied effect for three distinct hit positions", () => {
  assert.match(abilityVisuals, /import cycloneEffect from .*cyclone\.png/);
  assert.match(abilityVisuals, /cyclone:[\s\S]*spriteSrc: cycloneEffect/);
  assert.match(battleScreen, /event\.multiHitIndex === 1/);
  assert.match(battleScreen, /event\.multiHitIndex === 2/);

  for (const variant of ["cycloneHit1", "cycloneHit2", "cycloneHit3"]) {
    assert.match(abilityVisuals, new RegExp(`\\| "${variant}"`));
    assert.match(stylesheet, new RegExp(`targetEffect--${variant}`));
  }

  assert.match(stylesheet, /cycloneHit1[\s\S]*bottom: 34px/);
  assert.match(stylesheet, /cycloneHit2[\s\S]*bottom: 78px/);
  assert.match(stylesheet, /cycloneHit3[\s\S]*bottom: 52px/);
  assert.match(stylesheet, /--cyclone-rotation: -8deg/);
  assert.match(stylesheet, /--cyclone-rotation: 10deg/);
  assert.match(stylesheet, /--cyclone-rotation: -15deg/);
});

test("Cyclone casts once while all three impacts remain visible", () => {
  assert.equal(
    (characterVisuals.match(/cyclone: (rowan|lyra)CastSpellSprite/g) ?? [])
      .length,
    2,
  );
  assert.match(
    battleScreen,
    /currentCombatEvent\.abilityId !== "cyclone" \|\|[\s\S]*currentCombatEvent\.multiHitIndex === 0/,
  );
  assert.match(battleScreen, /CYCLONE_FOLLOW_UP_EVENT_DURATION_MS/);
});

test("Cyclone slashes before each damage number appears", () => {
  const visualStart = abilityVisuals.indexOf("  cyclone: {");
  const visualEnd = abilityVisuals.indexOf("\n  darkBolt:", visualStart);
  const visualDefinition = abilityVisuals.slice(visualStart, visualEnd);

  assert.notEqual(visualStart, -1);
  assert.notEqual(visualEnd, -1);
  assert.doesNotMatch(visualDefinition, /startsOnImpact: true/);
  assert.match(visualDefinition, /impactDelayMs: 1450/);
  assert.match(visualDefinition, /durationMs: 500/);
  assert.match(
    battleScreen,
    /CYCLONE_FOLLOW_UP_IMPACT_DELAY_MS = 900/,
  );
  assert.match(
    battleScreen,
    /CYCLONE_FOLLOW_UP_EVENT_DURATION_MS = 1850/,
  );
  assert.match(stylesheet, /cycloneHit1[\s\S]*animation-delay: 900ms/);
  assert.match(stylesheet, /cycloneHit2[\s\S]*animation-delay: 250ms/);
  assert.match(
    stylesheet,
    /cycloneTargetEffect[\s\S]*clip-path: inset\(0 100% 0 0\)/,
  );
  assert.match(
    stylesheet,
    /cycloneTargetEffect[\s\S]*clip-path: inset\(0 0 0 0\)/,
  );
  assert.match(
    stylesheet,
    /cycloneTargetEffect[\s\S]*clip-path: inset\(0 0 0 100%\)/,
  );
  assert.doesNotMatch(stylesheet, /cycloneTargetEffect[\s\S]*translateX\(-88%\)/);
  assert.doesNotMatch(stylesheet, /cycloneTargetEffect[\s\S]*translateX\(-18%\)/);
});
