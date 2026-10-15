import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import UpgradeSelection from "../src/features/battle/components/UpgradeSelection";
import type { RewardOffer } from "../src/game/types";

Object.assign(globalThis, { React });

function abilityChoice(
  type: "newAbility" | "abilityRank",
  rank: 1 | 2,
): RewardOffer {
  return {
    id: `ability:razorGale:${rank}`,
    type,
    abilityId: "razorGale",
    rank,
    icon: "🌬️",
    title: "Razor Gale",
    description: "Wind damage to all enemies.",
    detailedDescription: "Deal Wind damage to all enemies.",
    scalingDescription: "Wind Power",
    ppCost: 4,
  };
}

function renderChoice(choice: RewardOffer, withItemReward = false) {
  return renderToStaticMarkup(
    <UpgradeSelection
      characterName="Kris"
      itemRewards={withItemReward
        ? [{
            name: "Power Tonic",
            icon: "/power-tonic.png",
            rarity: "uncommon",
            description: "Gain Power.",
            useTiming: "action",
          }]
        : []}
      choices={[choice]}
      selectedChoiceId={null}
      waitingMessage={null}
      submitting={false}
      onSelect={() => undefined}
    />,
  );
}

test("rank 1 ability cards omit rank and PP metadata", () => {
  const markup = renderChoice(abilityChoice("newAbility", 1));

  assert.doesNotMatch(markup, /Rank 1/);
  assert.doesNotMatch(markup, /4 PP/);
  assert.match(markup, />Razor Gale</);
});

test("rank upgrades include the new rank in the ability title", () => {
  const markup = renderChoice(abilityChoice("abilityRank", 2));

  assert.match(markup, />Rank 2 · Razor Gale</);
  assert.doesNotMatch(markup, /4 PP/);
  assert.doesNotMatch(markup, /upgradeSelection__cardMeta/);
});

test("the victory header uses one compact helper line and a concise item status", () => {
  const markup = renderChoice(abilityChoice("newAbility", 1), true);

  assert.match(markup, />Victory</);
  assert.match(markup, />Choose an Upgrade</);
  assert.match(markup, />For Kris · Hold Shift for details</);
  assert.match(markup, /<strong>Power Tonic<\/strong> found/);
  assert.doesNotMatch(markup, /Choose one reward for Kris/);
  assert.doesNotMatch(markup, /Hold Shift while hovering for more info/);
  assert.doesNotMatch(markup, /Item found:/);
});

test("the Ghost reward header uses one heading instead of repeating itself", () => {
  const markup = renderChoice({
    id: "ghostUpgrade:heavyHaunt",
    type: "ghostUpgrade",
    upgradeId: "heavyHaunt",
    icon: "👻",
    title: "Heavy Haunt",
    description: "Ghost Strike deals more damage.",
  });

  assert.match(markup, />Choose a Ghost Upgrade</);
  assert.doesNotMatch(markup, />Ghost Reward</);
  assert.match(markup, />For Kris</);
});

test("Spirit rewards show concise summaries and keep full rules in Shift details", () => {
  const markup = renderChoice({
    id: "spirit:bloodpact",
    type: "newSpirit",
    spiritId: "bloodpact",
    icon: "🩸",
    title: "Bloodpact",
    description: "Full combined description.",
    passiveName: "Bloodpact",
    passiveShortDescription:
      "Sacrifice loses 1 HP; Protected gains 2 Barrier.",
    passiveDescription:
      "At encounter start, choose Sacrifice and Protected. Roles stay locked.",
    activeName: "Bloodpact",
    activeDescription:
      "Sacrifice loses 10 HP. Protected gains 30 Barrier.",
    activeDetailedDescription:
      "The locked Sacrifice loses 10 HP, ignoring Barrier.",
  });

  assert.match(markup, />Choose a Spirit</);
  assert.match(markup, />For Kris · Hold Shift for details</);
  assert.match(markup, />Passive</);
  assert.match(markup, /Sacrifice loses 1 HP; Protected gains 2 Barrier/);
  assert.match(markup, />Active</);
  assert.doesNotMatch(markup, /New Spirit/);
  assert.doesNotMatch(markup, /Passive — Bloodpact/);
  assert.doesNotMatch(markup, /At encounter start, choose Sacrifice/);
});
