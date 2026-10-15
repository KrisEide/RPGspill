import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createInitialCombatState } from "../src/game/state/initialState";
import { previewRestRewardChoice } from "../src/game/rewards/rewardSystem";
import type { GameSetup } from "../src/game/types";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const partyStatus = readFileSync(
  new URL(
    "../src/features/battle/components/PartyStatusPanel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const gameCss = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("camp presents party resources above the rest screen", () => {
  assert.match(battleScreen, /!isRest\s*&&\s*\(\s*<PartyStatusPanel/);
  assert.match(
    battleScreen,
    /isRest[\s\S]*?<PartyStatusPanel[\s\S]*?variant="camp"/,
  );
  assert.match(gameCss, /\.partyStatus--camp\s*\{[\s\S]*?z-index:\s*110/);
});

test("a camp recovery can be previewed immediately without advancing the rest stage", () => {
  const setup: GameSetup = {
    mode: "singlePlayer",
    initialLoadout: "run",
    randomSeed: 17,
    startingEncounterId: "spiritCamp",
    players: {
      player1: {
        id: "player1",
        controlledCharacterId: "character-1",
        character: { name: "Rowan", presetId: "char1", portraitId: "c1p1" },
      },
      player2: {
        id: "player2",
        controlledCharacterId: "character-2",
        character: { name: "Lyra", presetId: "char2", portraitId: "c2p1" },
      },
    },
  };
  const state = createInitialCombatState(setup);
  state.characters["character-1"].hp = 20;
  state.characters["character-1"].pp = 10;

  const preview = previewRestRewardChoice(
    state,
    "character-1",
    "rest:recover",
  );

  assert.ok(preview);
  assert.equal(preview.characters["character-1"].hp, 70);
  assert.equal(preview.characters["character-1"].pp, 25);
  assert.equal(preview.restStage, "choice");
  assert.equal(preview.rewardOffers, state.rewardOffers);
  assert.equal(state.characters["character-1"].hp, 20);
  assert.equal(state.characters["character-1"].pp, 10);
});

test("camp resource gains begin on selection and remain visible before the next encounter", () => {
  assert.match(
    battleScreen,
    /REST_RESOURCE_GAIN_DURATION_MS\s*=\s*4500/,
  );
  assert.match(
    battleScreen,
    /REST_RECOVERY_PRESENTATION_DURATION_MS\s*=\s*6000/,
  );
  assert.match(battleScreen, /setRestPreviewCombatState\(previewState\)/);
  assert.match(
    battleScreen,
    /characters=\{restPreviewCombatState\?\.characters \?\? combatState\.characters\}/,
  );
  assert.match(partyStatus, /statusCard__resourceGain/);
  assert.match(partyStatus, /previousHpRef/);
  assert.match(partyStatus, /4500/);
  assert.match(gameCss, /\.partyStatus--camp[\s\S]*?transition:\s*width\s*3000ms/);
  assert.match(gameCss, /campResourceRecovery\s*4500ms/);
  assert.match(gameCss, /campResourceGain\s*4500ms/);
});
