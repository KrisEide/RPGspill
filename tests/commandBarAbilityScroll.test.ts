import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const commandBar = readFileSync(
  new URL("../src/features/battle/components/CommandBar.tsx", import.meta.url),
  "utf8",
);
const stylesheet = readFileSync(
  new URL("../src/styles/game.css", import.meta.url),
  "utf8",
);

test("the ability row scrolls only when fixed-width cards overflow", () => {
  assert.match(commandBar, /cmdbar__abilityList--scrollable/);

  const listStyleStart = stylesheet.indexOf(
    ".cmdbar__abilityList--scrollable {",
  );
  const listStyleEnd = stylesheet.indexOf("\n}", listStyleStart);
  const listStyle = stylesheet.slice(listStyleStart, listStyleEnd);

  assert.notEqual(listStyleStart, -1);
  assert.match(listStyle, /justify-content: flex-start/);
  assert.match(listStyle, /overflow-x: auto/);
  assert.doesNotMatch(listStyle, /overflow-x: scroll/);
  assert.match(
    stylesheet,
    /cmdbar__abilityList--scrollable[\s\S]*flex: 0 0 132px/,
  );
});

test("ability tooltips render outside the clipped scrolling row", () => {
  const listStart = commandBar.indexOf(
    "cmdbar__abilityList cmdbar__abilityList--compact cmdbar__abilityList--scrollable",
  );
  const sharedTooltip = commandBar.indexOf(
    "cmdbar__abilityTooltip--shared",
    listStart,
  );

  assert.notEqual(listStart, -1);
  assert.notEqual(sharedTooltip, -1);
  assert.match(commandBar, /const hoveredAbility = abilities\.find/);
  assert.match(commandBar, /onScroll=\{\(\) => setHoveredAbilityId\(null\)\}/);
  assert.match(stylesheet, /\.cmdbar__abilityTooltip--shared/);
});
