import type { RestChoiceId, RestRewardOffer } from "../game/types";

export const FOREST_REST_CHOICES: Record<RestChoiceId, RestRewardOffer> = {
  "rest:recover": {
    id: "rest:recover",
    type: "rest",
    icon: "🔥",
    title: "Recover",
    description: "Restore 40 HP and 25 PP.",
    effect: {
      type: "restore",
      hp: 40,
      pp: 25,
    },
  },
  "rest:focus": {
    id: "rest:focus",
    type: "rest",
    icon: "✨",
    title: "Focus",
    description: "Restore 20 HP and 40 PP.",
    effect: {
      type: "restore",
      hp: 20,
      pp: 40,
    },
  },
  "rest:upgrade": {
    id: "rest:upgrade",
    type: "rest",
    icon: "⬆️",
    title: "Take an Upgrade",
    description: "Receive a normal reward choice.",
    effect: {
      type: "normalReward",
    },
  },
};

export function createForestRestOffers() {
  return Object.values(FOREST_REST_CHOICES);
}
