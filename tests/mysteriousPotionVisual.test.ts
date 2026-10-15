import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const commandBar = readFileSync(
  new URL("../src/features/battle/components/CommandBar.tsx", import.meta.url),
  "utf8",
);
const battleScreen = readFileSync(
  new URL("../src/features/battle/BattleScreen.tsx", import.meta.url),
  "utf8",
);
const itemVisuals = readFileSync(
  new URL("../src/features/battle/data/itemVisuals.ts", import.meta.url),
  "utf8",
);
const gameCss = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Mysterious Potion uses its supplied art in inventory and the conditional Ghost command", () => {
  assert.match(itemVisuals, /mysteriousPotionIcon/);
  assert.match(itemVisuals, /mysteriousPotion:\s*mysteriousPotionIcon/);
  assert.match(commandBar, /title:\s*"Mysterious Potion"/);
  assert.match(commandBar, /mysteriousPotionQuantity\s*>\s*0/);
  assert.match(commandBar, /×\{c\.quantity\}/);
});

test("Mysterious Potion has a paced bottle and aura animation", () => {
  assert.match(battleScreen, /MYSTERIOUS_POTION_ACTIVATION_DURATION_MS\s*=\s*3400/);
  assert.match(battleScreen, /MYSTERIOUS_POTION_IMPACT_DELAY_MS\s*=\s*1150/);
  assert.match(battleScreen, /mysteriousPotionEffect/);
  assert.match(gameCss, /\.mysteriousPotionEffect/);
  assert.match(gameCss, /@keyframes mysteriousPotionFloat/);
  assert.match(gameCss, /@keyframes mysteriousPotionAura/);
});
