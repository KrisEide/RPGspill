import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Barrier and HP damage numbers separate vertically when both occur", () => {
  const component = readFileSync(
    new URL("../src/features/battle/components/DamageNumber.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /damageNumberGroup--split/);
  assert.match(styles, /damageNumberGroup--split[\s\S]*barrierNumber/);
  assert.match(styles, /damageNumberGroup--split[\s\S]*damageNumber/);
});
