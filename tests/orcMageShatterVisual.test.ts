import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const abilityVisuals = readFileSync(
  new URL("../src/features/battle/data/abilityVisuals.ts", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Shatter Ward breaks only barriers that actually existed", () => {
  assert.match(
    battleScreen,
    /appliedCombatEvent\?\.type === "barrierRemoved"[\s\S]*impact\.targetId === characterId[\s\S]*impact\.barrierRemoved > 0/,
  );
  assert.match(battleScreen, /className="shatterWardBreak"/);
  assert.match(battleScreen, /shatterWardBreak__crack/);
  assert.match(
    battleScreen,
    /shatterWardBreak__amount[\s\S]*barrierRemoved[\s\S]*Barrier/,
  );
});

test("Shatter Ward has a held cast, readable break, and pause", () => {
  assert.match(
    abilityVisuals,
    /shatterWard:[\s\S]*impactDelayMs: 3200[\s\S]*eventDurationMs: 5600/,
  );
  assert.match(styles, /\.shatterWardBreak/);
  assert.match(styles, /@keyframes shatterWardBarrierShell/);
  assert.match(styles, /@keyframes shatterWardCrack/);
  assert.match(styles, /@keyframes shatterWardBarrierAmount/);
});
