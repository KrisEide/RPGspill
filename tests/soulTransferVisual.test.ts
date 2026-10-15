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
const commandBar = readFileSync(
  new URL("../src/features/battle/components/CommandBar.tsx", import.meta.url),
  "utf8",
);

test("Soul Transfer gets a paced battlefield sequence", () => {
  assert.match(battleScreen, /SOUL_TRANSFER_IMPACT_DELAY_MS\s*=\s*1600/);
  assert.match(battleScreen, /SOUL_TRANSFER_EVENT_DURATION_MS\s*=\s*5600/);
  assert.match(battleScreen, /shares their remaining life/);
  assert.match(battleScreen, /Soul Link Broken/);
  assert.match(battleScreen, /soulTransferBeam/);
  assert.match(styles, /soulTransferBeam/);
  assert.match(styles, /soulTransferGhostPulse/);
  assert.match(styles, /soulTransferLivingPulse/);
  assert.match(styles, /drop-shadow\(0 0 46px/);
  assert.match(styles, /drop-shadow\(0 0 40px/);
});

test("Ghost command bar shows whether Soul Link is active or broken", () => {
  assert.match(commandBar, /soulink\.png/);
  assert.match(commandBar, /soulinkbroken\.png/);
  assert.match(commandBar, /Soul Link/);
  assert.match(commandBar, /Active/);
  assert.match(commandBar, /Broken/);
  assert.match(commandBar, /cmdbar__soulLinkStatus/);
  assert.match(commandBar, /Soullink aktive/);
  assert.doesNotMatch(commandBar, /cmdbar__soulLinkLabel/);
  assert.doesNotMatch(commandBar, /cmdbar__soulLinkState/);
  assert.match(styles, /cmdbar__soulLinkStatus/);
  assert.match(styles, /\.cmdbar__soulLinkStatus \{[\s\S]*position: absolute/);
  assert.match(styles, /object-fit: contain/);
  assert.match(commandBar, /\{ghostMode && !panelContent && \(/);
});
