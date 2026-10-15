import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const abilityVisuals = readFileSync(
  new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
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

test("Searing Brand reuses the Cinder Curse flame with distinct presentation", () => {
  const visualStart = abilityVisuals.indexOf("  searingBrand: {");
  const visualEnd = abilityVisuals.indexOf("\n  rootseed:", visualStart);
  const visualDefinition = abilityVisuals.slice(visualStart, visualEnd);

  assert.notEqual(visualStart, -1);
  assert.notEqual(visualEnd, -1);
  assert.match(visualDefinition, /spriteSrc: cinderCurseEffect/);
  assert.match(visualDefinition, /width: 210/);
  assert.match(visualDefinition, /animationDurationMs: 4300/);
  assert.match(visualDefinition, /impactDelayMs: 2400/);
  assert.match(visualDefinition, /eventDurationMs: 5200/);
  assert.match(visualDefinition, /durationMs: 4100/);
  assert.match(visualDefinition, /variant: "searingBrand"/);

  const styleStart = stylesheet.indexOf(
    ".battleScene__targetEffect--searingBrand",
  );
  const styleEnd = stylesheet.indexOf("\n}", styleStart);
  const styleDefinition = stylesheet.slice(styleStart, styleEnd);

  assert.notEqual(styleStart, -1);
  assert.match(styleDefinition, /cinderCurseTargetEffect/);
  assert.match(styleDefinition, /sepia\(0\.28\)/);
  assert.match(styleDefinition, /saturate\(2\)/);
  assert.match(styleDefinition, /hue-rotate\(18deg\)/);
  assert.match(styleDefinition, /rgba\(255, 188, 48, 0\.95\)/);
  assert.match(styleDefinition, /rgba\(194, 36, 12, 0\.82\)/);
});

test("both heroes use their existing spell-cast sprite for Searing Brand", () => {
  assert.equal(
    (characterVisuals.match(/searingBrand: (rowan|lyra)CastSpellSprite/g) ?? [])
      .length,
    2,
  );
});
