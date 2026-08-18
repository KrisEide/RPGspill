import { ABILITIES } from "../../data/abilities";
import { INITIAL_ABILITY_REWARD_POOL } from "../../data/abilityRewards";
import { STAT_UPGRADE_POOL } from "../../data/upgrades";
import { PASSIVE_REWARD_POOL } from "../../data/passives";
import { getKnownAbilityRank, learnAbility } from "../abilities/abilityProgression";
import { CHARACTER_ORDER } from "../playerControl";
import { nextRandom } from "../combat/random";
import type {
  AbilityRewardOffer,
  CharacterInstanceId,
  CombatState,
  RewardChoiceId,
  RewardOffers,
  PassiveRewardOffer,
  StatRewardOffer,
} from "../types";

const OFFERS_PER_CHARACTER = 3;

export type GeneratedRewardOffers = {
  offers: RewardOffers;
  nextSeed: number;
};

function createPassiveRewardOffer(
  definition: (typeof PASSIVE_REWARD_POOL)[number],
): PassiveRewardOffer {
  return {
    id: `passive:${definition.id}`,
    type: "passive",
    passiveId: definition.id,
    category: definition.category,
    icon: definition.icon,
    title: definition.name,
    description: definition.description,
  };
}

function drawStandardOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  let nextSeed = seed;
  const character = state.characters[characterId];
  const statOffers = [...STAT_UPGRADE_POOL];
  const passiveOffers = PASSIVE_REWARD_POOL.filter(
    (passive) => !character.passives[passive.id],
  );
  const offers: (StatRewardOffer | PassiveRewardOffer)[] = [];

  while (offers.length < OFFERS_PER_CHARACTER) {
    const availableCategories = [
      ...(statOffers.length > 0 ? ["stat" as const] : []),
      ...(passiveOffers.length > 0 ? ["passive" as const] : []),
    ];

    if (availableCategories.length === 0) {
      break;
    }

    const categoryRoll = nextRandom(nextSeed);
    nextSeed = categoryRoll.nextSeed;
    const category =
      availableCategories[
        Math.floor(categoryRoll.value * availableCategories.length)
      ];
    const selectionRoll = nextRandom(nextSeed);
    nextSeed = selectionRoll.nextSeed;

    if (category === "passive") {
      const index = Math.floor(selectionRoll.value * passiveOffers.length);
      const [passive] = passiveOffers.splice(index, 1);
      if (passive) offers.push(createPassiveRewardOffer(passive));
    } else {
      const index = Math.floor(selectionRoll.value * statOffers.length);
      const [stat] = statOffers.splice(index, 1);
      if (stat) offers.push(stat);
    }
  }

  return { offers, nextSeed };
}

function createAbilityRewardOffer(
  definition: (typeof INITIAL_ABILITY_REWARD_POOL)[number],
): AbilityRewardOffer {
  const ability = ABILITIES[definition.abilityId];
  const rank = ability.ranks[1];

  return {
    id: `ability:${definition.abilityId}:1`,
    type: "newAbility",
    abilityId: definition.abilityId,
    rank: 1,
    ppCost: rank.ppCost,
    icon: definition.icon,
    title: ability.name,
    description: rank.description,
  };
}

function drawOpeningAbilityOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  let nextSeed = seed;
  const abilityRanks = state.characters[characterId].abilityRanks;
  const availableDefinitions = INITIAL_ABILITY_REWARD_POOL.filter(
    ({ abilityId }) => getKnownAbilityRank(abilityRanks, abilityId) === null,
  );
  const offers: AbilityRewardOffer[] = [];

  while (
    offers.length < OFFERS_PER_CHARACTER &&
    availableDefinitions.length > 0
  ) {
    const roll = nextRandom(nextSeed);
    nextSeed = roll.nextSeed;
    const selectedIndex = Math.floor(
      roll.value * availableDefinitions.length,
    );
    const [selectedDefinition] = availableDefinitions.splice(
      selectedIndex,
      1,
    );

    if (selectedDefinition) {
      offers.push(createAbilityRewardOffer(selectedDefinition));
    }
  }

  return { offers, nextSeed };
}

function drawOffersForCharacter(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  if (state.encounterId === "forestAmbush") {
    const abilityOffers = drawOpeningAbilityOffers(
      state,
      characterId,
      seed,
    );

    if (abilityOffers.offers.length === OFFERS_PER_CHARACTER) {
      return abilityOffers;
    }
  }

  return drawStandardOffers(state, characterId, seed);
}

export function generateRewardOffers(
  state: CombatState,
  seed: number,
): GeneratedRewardOffers {
  const firstCharacter = drawOffersForCharacter(
    state,
    "character-1",
    seed,
  );
  const secondCharacter = drawOffersForCharacter(
    state,
    "character-2",
    firstCharacter.nextSeed,
  );

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
  offer: StatRewardOffer,
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

function applyAbilityReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: AbilityRewardOffer,
): CombatState | null {
  const character = state.characters[characterId];
  const abilityRanks = learnAbility(character.abilityRanks, offer.abilityId);

  if (!abilityRanks) {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        abilityRanks,
      },
    },
  };
}

function applyPassiveReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: PassiveRewardOffer,
): CombatState | null {
  const character = state.characters[characterId];

  if (character.passives[offer.passiveId]) {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        passives: {
          ...character.passives,
          [offer.passiveId]: true,
        },
      },
    },
  };
}

export function isRewardOfferedToCharacter(
  state: CombatState,
  characterId: CharacterInstanceId,
  choiceId: RewardChoiceId,
) {
  return Boolean(
    state.rewardOffers?.[characterId].some(
      (offer) => offer.id === choiceId,
    ),
  );
}

export function applyRewardChoices(
  state: CombatState,
  choices: Record<CharacterInstanceId, RewardChoiceId>,
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

    const appliedState =
      offer.type === "stat"
        ? applyStatUpgrade(nextState, characterId, offer)
        : offer.type === "passive"
          ? applyPassiveReward(nextState, characterId, offer)
          : applyAbilityReward(nextState, characterId, offer);

    if (!appliedState) {
      return null;
    }

    nextState = appliedState;
  }

  return nextState;
}
