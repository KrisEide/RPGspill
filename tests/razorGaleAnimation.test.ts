import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

function getRazorGaleKeyframes() {
  const start = stylesheet.indexOf("@keyframes razorGaleBattlefieldEffect");
  const end = stylesheet.indexOf("@keyframes blastBombBattlefieldEffect", start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return stylesheet.slice(start, end);
}

test("Razor Gale stays upright and uses repeated tornado-like movement", () => {
  const keyframes = getRazorGaleKeyframes();

  assert.doesNotMatch(keyframes, /rotate\(/);
  assert.ok(
    (keyframes.match(/translate3d\(/g) ?? []).length >= 6,
    "expected repeated directional movement",
  );
  assert.match(keyframes, /scale3d\(/);
});
