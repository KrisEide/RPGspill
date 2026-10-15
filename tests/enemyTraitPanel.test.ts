import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const monsters = readFileSync(
  new URL("../src/data/monsters.ts", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Strength in Numbers uses a compact trait panel", () => {
  assert.match(
    monsters,
    /name: "Strength in Numbers",[\s\S]*description: "\+1 damage for each other living Orc Raider\."/,
  );
  assert.match(
    stylesheet,
    /\.enemyTraitPanel \{[\s\S]*width: min\(260px,[\s\S]*padding: 7px 10px 8px/,
  );
  assert.match(
    stylesheet,
    /\.enemyTraitPanel__name \{[\s\S]*font-size: 13px/,
  );
  assert.match(
    stylesheet,
    /\.enemyTraitPanel__description \{[\s\S]*font-size: 11px/,
  );
});
