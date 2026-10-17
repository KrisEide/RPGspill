import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Act 1 completion clearly presents Spirit Rank 2 and full restoration", () => {
  const upgradeSelection = readFileSync(
    new URL(
      "../src/features/battle/components/UpgradeSelection.tsx",
      import.meta.url,
    ),
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
  const protocol = readFileSync(
    new URL("../src/network/protocol.ts", import.meta.url),
    "utf8",
  );
  const server = readFileSync(
    new URL("../server/src/server.ts", import.meta.url),
    "utf8",
  );

  assert.match(upgradeSelection, /Spirit Rank 2/);
  assert.match(upgradeSelection, /Passive/);
  assert.match(upgradeSelection, /Continue/);
  assert.match(battleScreen, /actTransitionStage === "restoration"/);
  assert.match(battleScreen, /Fully Restored/);
  assert.match(battleScreen, /HP.*\/.*PP/s);
  assert.match(styles, /\.actRestoration/);
  assert.match(styles, /@keyframes actRestorationPulse/);
  assert.match(battleScreen, /submitMultiplayerActTransitionReady/);
  assert.match(battleScreen, /Ready ✓/);
  assert.match(battleScreen, /Waiting for the other player/);
  assert.match(protocol, /actTransitionReady/);
  assert.match(protocol, /actTransitionReadinessUpdated/);
  assert.match(server, /actTransitionReadyPlayerIds/);
  assert.doesNotMatch(server, /ACT_TRANSITION_RESTORATION_DURATION_MS/);
});
