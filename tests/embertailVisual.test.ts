import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Embertail passive damage has its own lingering fire presentation", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const damageNumber = readFileSync(
    new URL(
      "../src/features/battle/components/DamageNumber.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /EMBERTAIL_PASSIVE_EVENT_DURATION_MS/);
  assert.match(battleScreen, /className="embertailPassiveEffect"/);
  assert.match(battleScreen, /variant=\{.*"embertail"/s);
  assert.match(damageNumber, /damageNumber--\$\{variant\}/);
  assert.match(styles, /\.embertailPassiveEffect/);
  assert.match(styles, /\.damageNumber--embertail/);
});
