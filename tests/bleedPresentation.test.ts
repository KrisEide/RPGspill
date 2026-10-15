import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

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
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("Bleed application uses the supplied effect for heroes and enemies", () => {
  assert.match(battleScreen, /import bleedEffect from .*Effect\/bleed\.png/);
  assert.match(battleScreen, /eventAppliesStatusToTarget/);
  assert.match(battleScreen, /status\.id === statusId/);
  assert.match(battleScreen, /eventAppliesStatusToTarget\([\s\S]*characterId,[\s\S]*"bleed"/);
  assert.match(battleScreen, /eventAppliesStatusToTarget\([\s\S]*enemy\.instanceId,[\s\S]*"bleed"/);
  assert.match(battleScreen, /className="battleScene__bleedApplicationEffect"/);
  assert.match(styles, /\.battleScene__bleedApplicationEffect/);
  assert.match(styles, /bleedApplicationReveal\s+1500ms/);
});

test("party status shows Bleed tick damage like Poison", () => {
  assert.match(partyStatus, /const bleedStatus = character\.statuses\.find/);
  assert.match(partyStatus, /STATUS_DEFINITIONS\.bleed\.endOfRoundDamage/);
  assert.match(partyStatus, /statusCard__bleed/);
  assert.match(partyStatus, /Bleed:.*damage at the end of each round/);
  assert.match(styles, /\.statusCard__bleed/);
});

test("enemy Bleed status reports tick damage and remaining rounds", () => {
  assert.match(battleScreen, /const bleedDamage =/);
  assert.match(battleScreen, /Bleed · \$\{bleedDamage\} damage/);
  assert.match(battleScreen, /🩸\{bleedDamage\}/);
});
