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
const characterVisuals = readFileSync(
  new URL("../src/features/battle/data/characterVisuals.ts", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Backwind reuses the Wind Slash sprite with a reversed flight", () => {
  assert.match(
    abilityVisuals,
    /backwind:[\s\S]*spriteSrc: windSlashEffect[\s\S]*variant: "backwind"/,
  );
  assert.equal(
    (characterVisuals.match(/backwind: \{[\s\S]*?xRatio:/g) ?? []).length,
    2,
  );
  assert.match(stylesheet, /projectile--backwind[\s\S]*backwindFlight/);
  assert.match(stylesheet, /@keyframes backwindFlight[\s\S]*scaleY\(-1\)/);
});

test("a coordinated Backwind uses a larger and brighter projectile", () => {
  assert.match(battleScreen, /abilityEvent\.backwindBonus/);
  assert.match(battleScreen, /"backwindEmpowered"/);
  assert.match(battleScreen, /abilityProjectile\.width \* 1\.3/);
  assert.match(
    stylesheet,
    /projectile--backwindEmpowered[\s\S]*drop-shadow[\s\S]*drop-shadow/,
  );
});

test("a coordinated Backwind travels more slowly before applying damage", () => {
  assert.match(
    battleScreen,
    /BACKWIND_EMPOWERED_DURATION_MULTIPLIER = 1\.35/,
  );
  assert.match(
    battleScreen,
    /abilityTiming\.impactDelayMs \*[\s\S]*BACKWIND_EMPOWERED_DURATION_MULTIPLIER/,
  );
  assert.match(
    battleScreen,
    /isBackwindEmpowered[\s\S]*BACKWIND_EMPOWERED_DURATION_MULTIPLIER/,
  );
});
