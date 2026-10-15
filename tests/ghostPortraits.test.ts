import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const portraitOptions = readFileSync(
  new URL("../src/features/characterSelect/data/characterOptions.ts", import.meta.url),
  "utf8",
);
const partyStatusPanel = readFileSync(
  new URL("../src/features/battle/components/PartyStatusPanel.tsx", import.meta.url),
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

test("Ghost Form uses Rowan and Lyra ghost portraits throughout battle UI", () => {
  assert.match(portraitOptions, /import rowanGhostPortrait from .*rowan_ghost\.png/);
  assert.match(portraitOptions, /import lyraGhostPortrait from .*lyra_ghost\.png/);
  assert.match(
    portraitOptions,
    /character\.form === "ghost"[\s\S]*GHOST_PORTRAIT_SOURCES\[character\.presetId\]/,
  );
  assert.match(
    partyStatusPanel,
    /src=\{getCharacterPortraitSource\(character\)\}/,
  );
  assert.match(
    battleScreen,
    /src=\{getCharacterPortraitSource\(target\)\}/,
  );
  assert.match(
    battleScreen,
    /portraitSrc=\{getCharacterPortraitSource\([\s\S]*?commandCharacter \?\? combatState\.characters\["character-1"\],[\s\S]*?\)\}/,
  );
});

test("finished ghost portraits keep their authored blue colors", () => {
  assert.match(
    styles,
    /\.statusCard--ghost \.statusCard__portrait \{\s*filter: none;\s*\}/,
  );
  assert.match(
    styles,
    /\.cmdbar--ghost \.cmdbar__portraitImg \{\s*filter: none;\s*\}/,
  );
  assert.match(
    styles,
    /\.enemyStatus__intentPortrait--ghost \{\s*filter: none;\s*\}/,
  );
});
