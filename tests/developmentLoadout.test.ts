import assert from "node:assert/strict";
import { test } from "node:test";
import { createDevelopmentSetup } from "../src/game/development/createDevelopmentSetup";
import { createInitialCombatState } from "../src/game/state/initialState";

test("the development loadout starts combat without Bloodpact selection", () => {
  const state = createInitialCombatState(
    createDevelopmentSetup("slimeTrail", 123),
  );

  assert.equal(state.phase, "selectingActions");
  assert.equal(
    state.characters["character-1"].spirits.bloodpact,
    undefined,
  );
  assert.equal(
    state.characters["character-2"].spirits.bloodpact,
    undefined,
  );
});

