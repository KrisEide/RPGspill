import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ENCOUNTER_DEFINITIONS,
  getEncounterDisplayLabel,
} from "../src/data/encounters";

test("Act 2 restarts the player-facing scenario count", () => {
  assert.equal(
    getEncounterDisplayLabel(ENCOUNTER_DEFINITIONS.orcBrothers),
    "Encounter 13",
  );
  assert.equal(
    getEncounterDisplayLabel(ENCOUNTER_DEFINITIONS.mountainPass),
    "Act 2 · Scenario 1",
  );
  assert.equal(
    getEncounterDisplayLabel(ENCOUNTER_DEFINITIONS.rockwhistlerRidge),
    "Act 2 · Scenario 2",
  );
  assert.equal(
    getEncounterDisplayLabel(ENCOUNTER_DEFINITIONS.rockhideCavern),
    "Act 2 · Scenario 3",
  );
});

test("battle and development screens use the player-facing encounter label", () => {
  const battleScreen = readFileSync(
    new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
    "utf8",
  );
  const startScreen = readFileSync(
    new URL("../src/features/start/StartScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(battleScreen, /getEncounterDisplayLabel\(encounter\)/);
  assert.match(startScreen, /getEncounterDisplayLabel\(encounter\)/);
});
