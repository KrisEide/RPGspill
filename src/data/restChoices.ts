import type {
  EncounterId,
  RestChoiceId,
  RestRewardOffer,
} from "../game/types";

export type RestSceneDefinition = {
  eyebrow: string;
  title: string;
  completeMessage: string;
  waitingMessage: string;
  choices: Record<RestChoiceId, RestRewardOffer>;
};

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

export const SPIRIT_CAMP_CHOICES: Record<RestChoiceId, RestRewardOffer> = {
  "rest:recover": {
    id: "rest:recover",
    type: "rest",
    icon: "🔥",
    title: "Recover",
    description: "Restore 50 HP and 15 PP.",
    effect: {
      type: "restore",
      hp: 50,
      pp: 15,
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
    description: "Choose from 3 normal rewards.",
    effect: {
      type: "normalReward",
    },
  },
};

const REST_SCENES = {
  spiritCamp: {
    eyebrow: "Forest Camp",
    title: "Choose How to Recover",
    completeMessage: "The party is ready to continue.",
    waitingMessage:
      "Your camp choice is complete. The other player is still choosing.",
    choices: SPIRIT_CAMP_CHOICES,
  },
  forestRest: {
    eyebrow: "Boss Encounter Next",
    title: "Prepare for the Orc Brothers.",
    completeMessage: "Preparations complete.",
    waitingMessage:
      "Your preparation is complete. The other player is choosing an upgrade.",
    choices: FOREST_REST_CHOICES,
  },
} satisfies Partial<Record<EncounterId, RestSceneDefinition>>;

export function getRestSceneDefinition(encounterId: EncounterId) {
  const definition = REST_SCENES[encounterId as keyof typeof REST_SCENES];

  if (!definition) {
    throw new Error(`Encounter ${encounterId} has no rest scene definition.`);
  }

  return definition;
}

export function createRestOffers(encounterId: EncounterId) {
  return Object.values(getRestSceneDefinition(encounterId).choices);
}
