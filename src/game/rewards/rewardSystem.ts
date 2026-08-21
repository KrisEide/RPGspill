import { ABILITIES } from "../../data/abilities";
import { INITIAL_ABILITY_REWARD_POOL } from "../../data/abilityRewards";
import { STAT_UPGRADE_POOL } from "../../data/upgrades";
import { PASSIVE_REWARD_POOL } from "../../data/passives";
import { getKnownAbilityRank, learnAbility } from "../abilities/abilityProgression";
import { CHARACTER_ORDER } from "../playerControl";
import { nextRandom } from "../combat/random";
import {
  getCharacterMaxHp,
  getCharacterMaxPp,
} from "../ghost/ghostSystem";
import type {
  AbilityRewardOffer,
  CharacterInstanceId,
  CombatState,
  EncounterId,
  RewardChoiceId,
  RewardOffers,
  PassiveRewardOffer,
  RestRewardOffer,
  StatRewardOffer,
} from "../types";

const OFFERS_PER_CHARACTER = 3;
const CORE_ABILITY_REWARD_ENCOUNTERS = new Set<EncounterId>([
  "forestAmbush",
  "orcReinforcements",
]);

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
  if (CORE_ABILITY_REWARD_ENCOUNTERS.has(state.encounterId)) {
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
  const firstCharacter =
    state.characters["character-1"].form === "permanentlyDead"
      ? { offers: [], nextSeed: seed }
      : drawOffersForCharacter(state, "character-1", seed);
  const secondCharacter =
    state.characters["character-2"].form === "permanentlyDead"
      ? { offers: [], nextSeed: firstCharacter.nextSeed }
      : drawOffersForCharacter(
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

function generateStandardOffersForCharacters(
  state: CombatState,
  characterIds: CharacterInstanceId[],
  seed: number,
): GeneratedRewardOffers {
  let nextSeed = seed;
  const offers: RewardOffers = {
    "character-1": [],
    "character-2": [],
  };

  for (const characterId of characterIds) {
    const generated = drawStandardOffers(state, characterId, nextSeed);
    offers[characterId] = generated.offers;
    nextSeed = generated.nextSeed;
  }

  return { offers, nextSeed };
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
        hp: Math.min(
          character.form === "ghost" ? getCharacterMaxHp(character) : nextStats.maxHp,
          character.hp + restoreHp,
        ),
        pp: Math.min(
          character.form === "ghost" ? getCharacterMaxPp(character) : nextStats.maxPp,
          character.pp + restorePp,
        ),
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

function applyRestReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: RestRewardOffer,
): CombatState {
  if (offer.effect.type !== "restore") {
    return state;
  }

  const character = state.characters[characterId];

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        hp: Math.min(
          getCharacterMaxHp(character),
          character.hp + offer.effect.hp,
        ),
        pp: Math.min(
          getCharacterMaxPp(character),
          character.pp + offer.effect.pp,
        ),
      },
    },
  };
}

export function getRewardParticipantCharacterIds(state: CombatState) {
  return CHARACTER_ORDER.filter(
    (characterId) => (state.rewardOffers?.[characterId].length ?? 0) > 0,
  );
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
  choices: Partial<Record<CharacterInstanceId, RewardChoiceId>>,
): CombatState | null {
  let nextState = state;
  const participants = getRewardParticipantCharacterIds(state);
  const upgradeParticipants: CharacterInstanceId[] = [];

  for (const characterId of participants) {
    const choiceId = choices[characterId];
    if (!choiceId) {
      return null;
    }

    const offer = state.rewardOffers?.[characterId].find(
      (candidate) => candidate.id === choiceId,
    );

    if (!offer) {
      return null;
    }

    if (
      state.phase === "rest" &&
      ((state.restStage === "choice" && offer.type !== "rest") ||
        (state.restStage === "upgrade" && offer.type === "rest"))
    ) {
      return null;
    }

    if (
      offer.type === "rest" &&
      offer.effect.type === "normalReward"
    ) {
      upgradeParticipants.push(characterId);
    }

    const appliedState =
      offer.type === "rest"
        ? applyRestReward(nextState, characterId, offer)
        : offer.type === "stat"
        ? applyStatUpgrade(nextState, characterId, offer)
        : offer.type === "passive"
          ? applyPassiveReward(nextState, characterId, offer)
          : applyAbilityReward(nextState, characterId, offer);

    if (!appliedState) {
      return null;
    }

    nextState = appliedState;
  }

  if (state.phase === "rest" && state.restStage === "choice") {
    if (upgradeParticipants.length === 0) {
      return {
        ...nextState,
        restStage: "complete",
        rewardOffers: null,
      };
    }

    const generated = generateStandardOffersForCharacters(
      nextState,
      upgradeParticipants,
      nextState.randomSeed,
    );

    return {
      ...nextState,
      randomSeed: generated.nextSeed,
      restStage: "upgrade",
      rewardOffers: generated.offers,
    };
  }

  if (state.phase === "rest" && state.restStage === "upgrade") {
    return {
      ...nextState,
      restStage: "complete",
      rewardOffers: null,
    };
  }

  return nextState;
}
