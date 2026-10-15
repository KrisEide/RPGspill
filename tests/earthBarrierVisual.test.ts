import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const characterVisuals = readFileSync(
  new URL("../src/features/battle/data/characterVisuals.ts", import.meta.url),
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

test("Stoneguard and Fortify use each hero's barrier ability sprite", () => {
  assert.match(characterVisuals, /rowan_barrierability\.png/);
  assert.match(characterVisuals, /lyra_barrierability\.png/);
  assert.equal(
    (characterVisuals.match(/stoneguard: rowanBarrierAbilitySprite/g) ?? [])
      .length,
    1,
  );
  assert.equal(
    (characterVisuals.match(/fortify: rowanBarrierAbilitySprite/g) ?? [])
      .length,
    1,
  );
  assert.equal(
    (characterVisuals.match(/stoneguard: lyraBarrierAbilitySprite/g) ?? [])
      .length,
    1,
  );
  assert.equal(
    (characterVisuals.match(/fortify: lyraBarrierAbilitySprite/g) ?? [])
      .length,
    1,
  );
});

test("Barrier ability sprites keep each hero's size and battlefield position", () => {
  assert.match(characterVisuals, /ROWAN_BARRIER_ABILITY_SPRITE_ADJUSTMENT/);
  assert.match(characterVisuals, /LYRA_BARRIER_ABILITY_SPRITE_ADJUSTMENT/);
  assert.doesNotMatch(characterVisuals, /const BARRIER_ABILITY_SPRITE_ADJUSTMENT/);
  assert.match(battleScreen, /const isBarrierAbilityCast/);
  assert.match(battleScreen, /battleScene__playerUnit--stationaryCast/);
  assert.match(
    stylesheet,
    /\.battleScene__playerUnit--stationaryCast\s*\{[^}]*animation:\s*none/s,
  );
});

test("Earth Barrier recipients receive a paced glow", () => {
  assert.match(battleScreen, /const hasEarthBarrierImpact/);
  assert.match(battleScreen, /className="barrierAbilityGlow"/);
  assert.match(stylesheet, /\.barrierAbilityGlow\s*\{/);
  assert.match(stylesheet, /@keyframes barrierAbilityGlow/);
  assert.match(stylesheet, /animation:\s*barrierAbilityGlow 2200ms/);
});
