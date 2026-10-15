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
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Rootseed uses separate planting and drain effects", () => {
  assert.match(abilityVisuals, /import rootseedEffect from .*rootseed\.png/);
  assert.match(abilityVisuals, /import leafDrainEffect from .*leafdrain\.png/);
  assert.match(
    abilityVisuals,
    /rootseed:[\s\S]*targetEffect:[\s\S]*spriteSrc: rootseedEffect[\s\S]*width: 210[\s\S]*variant: "rootseed"/,
  );
  assert.match(
    abilityVisuals,
    /rootseed:[\s\S]*statusTickEffect:[\s\S]*spriteSrc: leafDrainEffect[\s\S]*variant: "leafDrain"/,
  );
  assert.match(
    battleScreen,
    /event\.statusId === "rootseed"[\s\S]*ABILITY_VISUALS\.rootseed\?\.statusTickEffect/,
  );
  assert.match(battleScreen, /ROOTSEED_TICK_EVENT_DURATION_MS = 3400/);
  assert.match(
    battleScreen,
    /supportImpact\.abilityId === "rootseed"[\s\S]*supportNumber--rootseed/,
  );
  assert.match(stylesheet, /\.battleScene__targetEffect--rootseed/);
  assert.match(stylesheet, /\.battleScene__targetEffect--leafDrain/);
  assert.match(
    stylesheet,
    /\.supportNumber--rootseed[\s\S]*animation-duration: 2200ms/,
  );
});
