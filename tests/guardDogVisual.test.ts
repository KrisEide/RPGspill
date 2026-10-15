import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SPIRIT_DEFINITIONS } from "../src/data/spirits";
import { ABILITIES } from "../src/data/abilities";

test("Guard Dog deals 5 passive damage and keeps Bodyguard Quick", () => {
  assert.equal(
    SPIRIT_DEFINITIONS.guardDog.passive.nonDamagingActionSpiritAttack
      ?.basePower,
    5,
  );
  assert.equal(ABILITIES.bodyguard.useTiming, "quickAction");
});

test("Bodyguard adds a persistent white aura to its protected hero", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/styles/game.css", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /status\.id === "bodyguard"/);
  assert.match(battleScreen, /battleScene__playerUnit--bodyguard/);
  assert.match(battleScreen, /className="bodyguardAura"/);
  assert.match(styles, /\.bodyguardAura/);
  assert.match(styles, /@keyframes bodyguardAuraPulse/);
});
