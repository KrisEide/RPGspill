import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);
const partyStatusPanel = readFileSync(
  new URL(
    "../src/features/battle/components/PartyStatusPanel.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Ghost Form reveal stays concise and keeps Soul Link a surprise", () => {
  assert.match(battleScreen, /"enters".*Ghost Form/s);
  assert.match(battleScreen, /Reach 100 Ghost HP to Reform/);
  assert.doesNotMatch(battleScreen, /Soul Link can save the last living hero once/);
  assert.doesNotMatch(battleScreen, /combined HP/);
  assert.match(battleScreen, /aria-label="Close Ghost Form information"/);
  assert.match(battleScreen, /dispatch\(\{ type: "advanceCombatEvent" \}\)/);
  assert.match(
    battleScreen,
    /ghostTransitionCharacterIds\.length > 0[\s\S]*?\? null[\s\S]*?: window\.setTimeout/,
  );
  assert.match(styles, /ghostTransitionLivingFade/);
  assert.match(styles, /ghostTransitionReveal/);
  assert.match(styles, /ghostTransitionNotice__close/);
  assert.match(styles, /\.ghostTransitionNotice \{[\s\S]*pointer-events: auto/);
});

test("the UI warns about and explains losing the last living hero", () => {
  assert.match(partyStatusPanel, /Last living hero/);
  assert.match(battleScreen, /No living heroes remain/);
  assert.match(battleScreen, /The battle is lost/);
});

test("the last living hero warning stays attached to party status", () => {
  assert.match(
    battleScreen,
    /<PartyStatusPanel[\s\S]*lastLivingHeroName=\{lastLivingHeroName\}/,
  );
  assert.match(partyStatusPanel, /lastLivingHeroName/);
  assert.match(partyStatusPanel, /className="lastLivingWarning"/);
  assert.doesNotMatch(
    battleScreen,
    /<div className="lastLivingWarning" role="status">/,
  );
  assert.match(
    styles,
    /\.lastLivingWarning \{[\s\S]*grid-column:\s*1\s*\/\s*-1/,
  );
  assert.doesNotMatch(
    styles,
    /\.lastLivingWarning \{[^}]*position:\s*absolute/,
  );
});
