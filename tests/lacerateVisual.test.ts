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

test("Lacerate uses a melee animation with a dark red impact", () => {
  assert.match(
    abilityVisuals,
    /import lacerateEffect from .*lacerate\.png/,
  );
  assert.match(
    abilityVisuals,
    /lacerate:[\s\S]*animation: "melee"[\s\S]*spriteSrc: lacerateEffect[\s\S]*variant: "lacerate"[\s\S]*startsOnImpact: true/,
  );
  assert.match(battleScreen, /impactVisuals\?\.impact === "bleed"/);
  assert.match(battleScreen, /battleScene__enemyUnit--bleedImpact/);
  assert.match(stylesheet, /targetEffect--lacerate/);
  assert.doesNotMatch(stylesheet, /enemyUnit--bleedImpact::after/);
});
