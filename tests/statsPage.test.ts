import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const statsPage = readFileSync(
  new URL("../src/features/battle/components/StatsPage.tsx", import.meta.url),
  "utf8",
);
const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);
const tabHook = readFileSync(
  new URL("../src/features/battle/hooks/useTabHeld.ts", import.meta.url),
  "utf8",
);

test("the Tab stats page shows combat and elemental stats", () => {
  for (const label of [
    "HP",
    "PP",
    "Barrier",
    "Attack",
    "Defense",
    "Resistance",
    "Agility",
    "Critical Chance",
    "Fire Power",
    "Water Power",
    "Earth Power",
    "Wind Power",
  ]) {
    assert.match(statsPage, new RegExp(`>${label}<`), label);
  }

  assert.match(statsPage, /getCharacterMaxHp\(character\)/);
  assert.match(statsPage, /getCharacterMaxPp\(character\)/);
  assert.match(statsPage, /getCharacterPortraitSource\(character\)/);
  assert.match(styles, /\.statsPage/);
  assert.match(styles, /\.statsPage__characters--1/);
  assert.match(statsPage, /Release Tab to close/);
  assert.match(tabHook, /event\.key === "Tab"/);
  assert.match(tabHook, /event\.preventDefault\(\)/);
});

test("BattleScreen limits multiplayer stats to the local character", () => {
  assert.match(battleScreen, /useTabHeld\(\)/);
  assert.doesNotMatch(battleScreen, /useShiftHeld/);
  assert.match(
    battleScreen,
    /isMultiplayer[\s\S]*localCharacter \? \[localCharacter\] : \[\]/,
  );
  assert.match(battleScreen, /<StatsPage characters=\{statsPageCharacters\}/);
  assert.match(
    battleScreen,
    /statsPageIsVisible =[\s\S]*gameState\.phase === "selectingActions"/,
  );
});
