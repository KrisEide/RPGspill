import { STAT_UPGRADE_POOL } from "../../data/upgrades";
import { CHARACTER_ORDER } from "../playerControl";
import { nextRandom } from "../combat/random";
import type {
  CharacterInstanceId,
  CombatState,
  RewardOffer,
  RewardOffers,
  UpgradeChoiceId,
} from "../types";

const OFFERS_PER_CHARACTER = 3;

export type GeneratedRewardOffers = {
  offers: RewardOffers;
  nextSeed: number;
};

function drawUniqueOffers(seed: number) {
  let nextSeed = seed;
  const availableOffers = [...STAT_UPGRADE_POOL];
  const offers: RewardOffer[] = [];

  while (
    offers.length < OFFERS_PER_CHARACTER &&
    availableOffers.length > 0
  ) {
    const roll = nextRandom(nextSeed);
    nextSeed = roll.nextSeed;
    const selectedIndex = Math.floor(roll.value * availableOffers.length);
    const [selectedOffer] = availableOffers.splice(selectedIndex, 1);

    if (selectedOffer) {
      offers.push(selectedOffer);
    }
  }

  return { offers, nextSeed };
}

export function generateRewardOffers(seed: number): GeneratedRewardOffers {
  const firstCharacter = drawUniqueOffers(seed);
  const secondCharacter = drawUniqueOffers(firstCharacter.nextSeed);

  return {
    offers: {
      "character-1": firstCharacter.offers,
      "character-2": secondCharacter.offers,
    },
    nextSeed: secondCharacter.nextSeed,
  };
}

function applyStatUpgrade(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: RewardOffer,
): CombatState {
  const character = state.characters[characterId];
  const {
    target,
    amount,
    restoreHp = 0,
    restorePp = 0,
  } = offer.effect;
  const nextStats = {
    ...character.stats,
    elementalPower: { ...character.stats.elementalPower },
  };

  switch (target) {
    case "maxHp":
      nextStats.maxHp += amount;
      break;
    case "maxPp":
      nextStats.maxPp += amount;
      break;
    case "firePower":
      nextStats.elementalPower.fire += amount;
      break;
    case "waterPower":
      nextStats.elementalPower.water += amount;
      break;
    case "earthPower":
      nextStats.elementalPower.earth += amount;
      break;
    case "windPower":
      nextStats.elementalPower.wind += amount;
      break;
    default:
      nextStats[target] += amount;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        hp: Math.min(nextStats.maxHp, character.hp + restoreHp),
        pp: Math.min(nextStats.maxPp, character.pp + restorePp),
        stats: nextStats,
      },
    },
  };
}

export function isRewardOfferedToCharacter(
  state: CombatState,
  characterId: CharacterInstanceId,
  choiceId: UpgradeChoiceId,
) {
  return Boolean(
    state.rewardOffers?.[characterId].some(
      (offer) => offer.id === choiceId,
    ),
  );
}

export function applyRewardChoices(
  state: CombatState,
  choices: Record<CharacterInstanceId, UpgradeChoiceId>,
): CombatState | null {
  let nextState = state;

  for (const characterId of CHARACTER_ORDER) {
    const choiceId = choices[characterId];
    const offer = state.rewardOffers?.[characterId].find(
      (candidate) => candidate.id === choiceId,
    );

    if (!offer) {
      return null;
    }

    nextState = applyStatUpgrade(nextState, characterId, offer);
  }

  return nextState;
}
