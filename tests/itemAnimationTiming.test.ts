import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const itemVisuals = readFileSync(
  new URL("../src/features/battle/data/itemVisuals.ts", import.meta.url),
  "utf8",
);

test("bomb items leave time to read their impact before the next action", () => {
  assert.match(
    itemVisuals,
    /blastBomb:\s*\{[\s\S]*?durationMs:\s*2400[\s\S]*?impactDelayMs:\s*850[\s\S]*?eventDurationMs:\s*3200/,
  );
  assert.match(
    itemVisuals,
    /razorBomb:\s*\{[\s\S]*?durationMs:\s*2600[\s\S]*?impactDelayMs:\s*950[\s\S]*?eventDurationMs:\s*3500/,
  );

  assert.match(
    battleScreen,
    /currentItemBattlefieldEffect\?\.impactDelayMs/,
  );
  assert.match(
    battleScreen,
    /currentItemBattlefieldEffect\?\.eventDurationMs/,
  );
});
