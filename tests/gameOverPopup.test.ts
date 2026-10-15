import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const app = readFileSync(
  new URL("../src/app/App.tsx", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("defeat shows a simple Game Over dialog that returns to the start screen", () => {
  assert.match(battleScreen, /gameState\.phase === "defeat"[\s\S]*GAME OVER/);
  assert.match(battleScreen, />\s*PLAY AGAIN\s*</);
  assert.match(battleScreen, /onClick=\{props\.onReturnToStart\}/);
  assert.match(app, /const returnToStartScreen = \(\) =>/);
  assert.match(app, /onReturnToStart=\{returnToStartScreen\}/);
  assert.match(stylesheet, /\.gameOverOverlay/);
  assert.match(stylesheet, /\.gameOverDialog/);
});
