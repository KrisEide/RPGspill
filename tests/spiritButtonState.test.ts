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
const styles = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("an exhausted Spirit only greys its main icon and keeps the panel available", () => {
  assert.match(battleScreen, /spiritUsed=/);
  assert.match(commandBar, /cmdbar__slot--spirit-used/);
  assert.doesNotMatch(
    commandBar,
    /\(c\.id === "spirit" && spiritUsed\)[\s\S]{0,120}disabled=/,
  );
  assert.match(
    styles,
    /cmdbar__slot--spirit-used[\s\S]*cmdbar__icon--spirit[\s\S]*grayscale\(1\)/,
  );
});
