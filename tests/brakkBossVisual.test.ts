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
const reducer = readFileSync(
  new URL("../src/game/state/gameReducer.ts", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Catch Breath holds Brakk's tired pose and cleanses at the glow peak", () => {
  assert.match(enemyVisuals, /catchBreath:[\s\S]*variant: "rest"/);
  assert.match(
    abilityVisuals,
    /catchBreath:[\s\S]*impactDelayMs: 2500[\s\S]*eventDurationMs: 5200/,
  );
  assert.match(styles, /sequence-rest[\s\S]*enemyRestCleanse/);
  assert.match(styles, /@keyframes enemyRestCleanse/);
  assert.match(reducer, /event\.type === "wait"[\s\S]*applyStatusChanges/);
});

test("boss sprites are preloaded and never reuse a previous pose with new geometry", () => {
  assert.match(battleScreen, /battleScene__enemySprite--preload/);
  assert.match(
    battleScreen,
    /key=\{`enemy-action-frame-\$\{frameIndex\}-\$\{frame\.spriteSrc\}`\}/,
  );
  assert.match(styles, /sequence-bossAction[\s\S]*bossActionFrame/);
});
