import { ABILITIES } from "../../data/abilities";
import { ABILITY_REWARD_POOL } from "../../data/abilityRewards";
import { STAT_UPGRADE_POOL } from "../../data/upgrades";
import { PASSIVE_REWARD_POOL } from "../../data/passives";
import { GHOST_REWARD_POOL } from "../../data/ghostRewards";
import {
  createKnownSpirits,
  SPIRIT_DEFINITIONS,
} from "../../data/spirits";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import {
  getAbilityScalingDescription,
  getKnownAbilityRank,
  learnAbility,
  resolveAbility,
  upgradeAbility,
} from "../abilities/abilityProgression";
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
  GhostAbilityRewardOffer,
  GhostUpgradeRewardOffer,
  RewardChoiceId,
  RewardOffers,
  PassiveRewardOffer,
  RestRewardOffer,
  SpiritRewardOffer,
  SpiritRankRewardOffer,
  StatRewardOffer,
} from "../types";

const OFFERS_PER_CHARACTER = 3;
const RANK_TWO_START_ENCOUNTER = 9;
const RANK_TWO_FULL_WEIGHT_ENCOUNTER = 13;
const STANDARD_REWARD_CATEGORY_WEIGHT = 1;
const NEW_ABILITY_CATEGORY_WEIGHT = 1;
export type GeneratedRewardOffers = {
  offers: RewardOffers;
  nextSeed: number;
};

function createSpiritRewardOffer(
  definition: (typeof SPIRIT_DEFINITIONS)[keyof typeof SPIRIT_DEFINITIONS],
): SpiritRewardOffer {
  const activeAbility = resolveAbility(definition.activeAbilityId, 1);
  const activeDescription =
    activeAbility?.shortDescription ?? "Use this Spirit once per encounter.";

  return {
    id: `spirit:${definition.id}`,
    type: "newSpirit",
    spiritId: definition.id,
    icon: definition.icon,
    tags: definition.tags,
    title: definition.name,
    description: `${definition.passive.description} ${activeDescription}`,
    passiveName: definition.passive.name,
    passiveShortDescription: definition.passive.shortDescription,
    passiveDescription: definition.passive.description,
    activeName: activeAbility?.name ?? definition.name,
    activeDescription,
    activeDetailedDescription:
      activeAbility?.description ?? activeDescription,
    automaticActive: definition.automaticActive,
  };
}

function drawSpiritOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  let nextSeed = seed;
  const character = state.characters[characterId];
  const allDefinitions = Object.values(SPIRIT_DEFINITIONS);
  const unownedDefinitions = allDefinitions.filter(
    (definition) => !character.spirits[definition.id],
  );
  const availableDefinitions = [
    ...(unownedDefinitions.length >= OFFERS_PER_CHARACTER
      ? unownedDefinitions
      : allDefinitions),
  ];
  const offers: SpiritRewardOffer[] = [];

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
      offers.push(createSpiritRewardOffer(selectedDefinition));
    }
  }

  return { offers, nextSeed };
}

function createPassiveRewardOffer(
  definition: (typeof PASSIVE_REWARD_POOL)[number],
): PassiveRewardOffer {
  return {
    id: `passive:${definition.id}`,
    type: "passive",
    passiveId: definition.id,
    category: definition.category,
    icon: definition.icon,
    tags: definition.tags,
    title: definition.name,
    description: definition.description,
  };
}

function getRewardProgressEncounterNumber(state: CombatState) {
  const encounter = ENCOUNTER_DEFINITIONS[state.encounterId];

  // A rest belongs to the encounter that was just completed. This prevents
  // camps before a numbered combat from advancing reward progression early.
  return encounter.kind === "rest"
    ? Math.max(0, encounter.number - 1)
    : encounter.number;
}

function getRankTwoCategoryWeight(state: CombatState) {
  const encounterNumber = getRewardProgressEncounterNumber(state);

  if (encounterNumber < RANK_TWO_START_ENCOUNTER) {
    return 0;
  }

  const progressionSteps =
    RANK_TWO_FULL_WEIGHT_ENCOUNTER - RANK_TWO_START_ENCOUNTER + 1;

  return Math.min(
    STANDARD_REWARD_CATEGORY_WEIGHT,
    (encounterNumber - RANK_TWO_START_ENCOUNTER + 1) / progressionSteps,
  );
}

function drawWeightedCategory<T extends string>(
  categories: Array<{ id: T; weight: number }>,
  randomValue: number,
) {
  const totalWeight = categories.reduce(
    (sum, category) => sum + category.weight,
    0,
  );
  let cursor = randomValue * totalWeight;

  for (const category of categories) {
    cursor -= category.weight;
    if (cursor < 0) {
      return category.id;
    }
  }

  return categories[categories.length - 1]?.id;
}

function drawStandardOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
  options: { offerCount?: number; allowRankTwo?: boolean } = {},
) {
  let nextSeed = seed;
  const character = state.characters[characterId];
  const statOffers = [...STAT_UPGRADE_POOL];
  const passiveOffers = PASSIVE_REWARD_POOL.filter(
    (passive) => !character.passives[passive.id],
  );
  const newAbilityDefinitions = ABILITY_REWARD_POOL.filter(
    ({ abilityId }) =>
      getKnownAbilityRank(character.abilityRanks, abilityId) === null,
  );
  const rankTwoDefinitions = ABILITY_REWARD_POOL.filter(
    ({ abilityId }) =>
      getKnownAbilityRank(character.abilityRanks, abilityId) === 1 &&
      ABILITIES[abilityId].ranks[2] !== undefined,
  );
  const rankTwoCategoryWeight = getRankTwoCategoryWeight(state);
  const offers: (
    | StatRewardOffer
    | PassiveRewardOffer
    | AbilityRewardOffer
  )[] = [];

  const offerCount = options.offerCount ?? OFFERS_PER_CHARACTER;
  const allowRankTwo = options.allowRankTwo ?? true;

  while (offers.length < offerCount) {
    const availableCategories = [
      ...(statOffers.length > 0
        ? [{ id: "stat" as const, weight: STANDARD_REWARD_CATEGORY_WEIGHT }]
        : []),
      ...(passiveOffers.length > 0
        ? [
            {
              id: "passive" as const,
              weight: STANDARD_REWARD_CATEGORY_WEIGHT,
            },
          ]
        : []),
      ...(newAbilityDefinitions.length > 0
        ? [
            {
              id: "newAbility" as const,
              weight: NEW_ABILITY_CATEGORY_WEIGHT,
            },
          ]
        : []),
      ...(allowRankTwo && rankTwoDefinitions.length > 0 && rankTwoCategoryWeight > 0
        ? [
            {
              id: "abilityRank" as const,
              weight: rankTwoCategoryWeight,
            },
          ]
        : []),
    ];

    if (availableCategories.length === 0) {
      break;
    }

    const categoryRoll = nextRandom(nextSeed);
    nextSeed = categoryRoll.nextSeed;
    const category = drawWeightedCategory(
      availableCategories,
      categoryRoll.value,
    );
    const selectionRoll = nextRandom(nextSeed);
    nextSeed = selectionRoll.nextSeed;

    if (category === "passive") {
      const index = Math.floor(selectionRoll.value * passiveOffers.length);
      const [passive] = passiveOffers.splice(index, 1);
      if (passive) offers.push(createPassiveRewardOffer(passive));
    } else if (category === "stat") {
      const index = Math.floor(selectionRoll.value * statOffers.length);
      const [stat] = statOffers.splice(index, 1);
      if (stat) offers.push(stat);
    } else if (category === "newAbility") {
      const index = Math.floor(
        selectionRoll.value * newAbilityDefinitions.length,
      );
      const [definition] = newAbilityDefinitions.splice(index, 1);
      if (definition) {
        offers.push(createAbilityRewardOffer(definition));
      }
    } else {
      const index = Math.floor(
        selectionRoll.value * rankTwoDefinitions.length,
      );
      const [definition] = rankTwoDefinitions.splice(index, 1);
      if (definition) {
        offers.push(createAbilityRewardOffer(definition, 2));
      }
    }
  }

  return { offers, nextSeed };
}

function drawActOneBossOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  const character = state.characters[characterId];
  const eligibleRankTwoDefinitions = ABILITY_REWARD_POOL.filter(
    ({ abilityId }) =>
      getKnownAbilityRank(character.abilityRanks, abilityId) === 1 &&
      ABILITIES[abilityId].ranks[2] !== undefined,
  );

  if (eligibleRankTwoDefinitions.length === 0) {
    return drawStandardOffers(state, characterId, seed, {
      allowRankTwo: false,
    });
  }

  const rankRoll = nextRandom(seed);
  const rankDefinition =
    eligibleRankTwoDefinitions[
      Math.floor(rankRoll.value * eligibleRankTwoDefinitions.length)
    ];
  const remaining = drawStandardOffers(
    state,
    characterId,
    rankRoll.nextSeed,
    { offerCount: OFFERS_PER_CHARACTER - 1, allowRankTwo: false },
  );
  const positionRoll = nextRandom(remaining.nextSeed);
  const offers = [...remaining.offers];
  offers.splice(
    Math.floor(positionRoll.value * OFFERS_PER_CHARACTER),
    0,
    createAbilityRewardOffer(rankDefinition, 2),
  );

  return { offers, nextSeed: positionRoll.nextSeed };
}

function createAbilityRewardOffer(
  definition: (typeof ABILITY_REWARD_POOL)[number],
  rankNumber: 1 | 2 = 1,
): AbilityRewardOffer {
  const ability = ABILITIES[definition.abilityId];
  const rank = ability.ranks[rankNumber];
  const resolvedAbility = resolveAbility(definition.abilityId, rankNumber);

  if (!rank) {
    throw new Error(
      `${ability.name} does not define Rank ${rankNumber}.`,
    );
  }

  return {
    id: `ability:${definition.abilityId}:${rankNumber}`,
    type: rankNumber === 1 ? "newAbility" : "abilityRank",
    abilityId: definition.abilityId,
    rank: rankNumber,
    ppCost: rank.ppCost,
    icon: definition.icon,
    tags: definition.tags,
    title: ability.name,
    description: rank.shortDescription,
    detailedDescription: rank.description,
    scalingDescription: resolvedAbility
      ? getAbilityScalingDescription(resolvedAbility)
      : "",
  };
}

function createGhostAbilityRewardOffer(
  definition: Extract<
    (typeof GHOST_REWARD_POOL)[number],
    { type: "newGhostAbility" }
  >,
): GhostAbilityRewardOffer {
  const ability = ABILITIES[definition.abilityId];
  const rank = ability.ranks[1];
  const resolvedAbility = resolveAbility(definition.abilityId, 1);
  const ghostHpCost = rank.effects.find(
    (effect) => effect.type === "ghostHpCost",
  )?.amount;

  return {
    id: `ghostAbility:${definition.abilityId}:1`,
    type: "newGhostAbility",
    abilityId: definition.abilityId,
    rank: 1,
    ppCost: rank.ppCost,
    costLabel: ghostHpCost
      ? `${ghostHpCost} Ghost HP`
      : `${rank.ppCost} Ghost PP`,
    icon: definition.icon,
    tags: definition.tags,
    title: ability.name,
    description: rank.shortDescription,
    detailedDescription: rank.description,
    scalingDescription: resolvedAbility
      ? getAbilityScalingDescription(resolvedAbility)
      : "",
  };
}

function createGhostUpgradeRewardOffer(
  definition: Extract<
    (typeof GHOST_REWARD_POOL)[number],
    { type: "ghostUpgrade" }
  >,
): GhostUpgradeRewardOffer {
  return {
    id: `ghostUpgrade:${definition.upgradeId}`,
    type: "ghostUpgrade",
    upgradeId: definition.upgradeId,
    icon: definition.icon,
    tags: definition.tags,
    title: definition.title,
    description: definition.description,
  };
}

function drawGhostOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  let nextSeed = seed;
  const character = state.characters[characterId];
  const availableDefinitions = GHOST_REWARD_POOL.filter(
    (definition) =>
      definition.type === "newGhostAbility"
        ? character.ghostAbilityRanks[definition.abilityId] === undefined
        : !character.ghostUpgrades[definition.upgradeId],
  );
  const offers: (GhostAbilityRewardOffer | GhostUpgradeRewardOffer)[] = [];

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
      offers.push(
        selectedDefinition.type === "newGhostAbility"
          ? createGhostAbilityRewardOffer(selectedDefinition)
          : createGhostUpgradeRewardOffer(selectedDefinition),
      );
    }
  }

  return { offers, nextSeed };
}

function drawOpeningAbilityOffers(
  state: CombatState,
  characterId: CharacterInstanceId,
  seed: number,
) {
  let nextSeed = seed;
  const abilityRanks = state.characters[characterId].abilityRanks;
  const availableDefinitions = ABILITY_REWARD_POOL.filter(
    ({ abilityId, availableInOpeningRewards }) =>
      availableInOpeningRewards !== false &&
      getKnownAbilityRank(abilityRanks, abilityId) === null,
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
  const rewardType = ENCOUNTER_DEFINITIONS[state.encounterId].rewardType;

  if (state.encounterId === "orcBrothers") {
    return drawActOneBossOffers(state, characterId, seed);
  }

  if (rewardType === "spirits") {
    return drawSpiritOffers(state, characterId, seed);
  }

  if (state.characters[characterId].form === "ghost") {
    return drawGhostOffers(state, characterId, seed);
  }

  if (rewardType === "openingAbilities") {
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

function createSpiritRankRewardOffer(
  state: CombatState,
  characterId: CharacterInstanceId,
): SpiritRankRewardOffer | null {
  const spirit = Object.values(state.characters[characterId].spirits).find(
    (candidate) => candidate !== undefined,
  );
  if (!spirit) return null;

  const definition = SPIRIT_DEFINITIONS[spirit.id];
  const passive = definition.rankTwoPassive;
  const active = resolveAbility(definition.activeAbilityId, 2);

  if (!active) return null;

  return {
    id: `spiritRank:${spirit.id}:2`,
    type: "spiritRank",
    spiritId: spirit.id,
    rank: 2,
    icon: definition.icon,
    tags: definition.tags,
    title: `${definition.name} · Rank 2`,
    description: `${passive.shortDescription} ${active.shortDescription}`,
    passiveName: passive.name,
    passiveDescription: passive.shortDescription,
    activeName: active.name,
    activeDescription: active.shortDescription,
    automaticActive: definition.automaticActive,
  };
}

function beginSpiritRankTwoStage(state: CombatState): CombatState {
  const offers: RewardOffers = { "character-1": [], "character-2": [] };

  for (const characterId of CHARACTER_ORDER) {
    if (state.characters[characterId].form === "permanentlyDead") continue;
    const offer = createSpiritRankRewardOffer(state, characterId);
    if (offer) offers[characterId] = [offer];
  }

  return {
    ...state,
    actTransitionStage: "spiritRank2",
    rewardOffers: offers,
  };
}

function applySpiritRankReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: SpiritRankRewardOffer,
): CombatState | null {
  const character = state.characters[characterId];
  const spirit = character.spirits[offer.spiritId];
  if (!spirit || spirit.rank !== 1) return null;

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: {
          ...character.spirits,
          [offer.spiritId]: { ...spirit, rank: 2 },
        },
      },
    },
  };
}

function restorePartyForActTwo(state: CombatState): CombatState {
  return {
    ...state,
    actTransitionStage: "restoration",
    rewardOffers: null,
    characters: Object.fromEntries(
      CHARACTER_ORDER.map((characterId) => {
        const character = state.characters[characterId];
        return [
          characterId,
          character.form === "permanentlyDead"
            ? character
            : {
                ...character,
                form: "living" as const,
                hp: character.stats.maxHp,
                pp: character.stats.maxPp,
                savedLivingPp: null,
                ghostReformReady: false,
                soulLinkActive: false,
                barrier: 0,
                statuses: [],
              },
        ];
      }),
    ) as CombatState["characters"],
  };
}

function applySpiritReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: SpiritRewardOffer,
): CombatState {
  const character = state.characters[characterId];

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        spirits: createKnownSpirits([offer.spiritId]),
      },
    },
  };
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
  const abilityRanks =
    offer.type === "abilityRank"
      ? upgradeAbility(character.abilityRanks, offer.abilityId)
      : learnAbility(character.abilityRanks, offer.abilityId);

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

function applyGhostAbilityReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: GhostAbilityRewardOffer,
): CombatState | null {
  const character = state.characters[characterId];

  if (
    character.form !== "ghost" ||
    character.ghostAbilityRanks[offer.abilityId] !== undefined
  ) {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        ghostAbilityRanks: {
          ...character.ghostAbilityRanks,
          [offer.abilityId]: 1,
        },
      },
    },
  };
}

function applyGhostUpgradeReward(
  state: CombatState,
  characterId: CharacterInstanceId,
  offer: GhostUpgradeRewardOffer,
): CombatState | null {
  const character = state.characters[characterId];

  if (
    character.form !== "ghost" ||
    character.ghostUpgrades[offer.upgradeId]
  ) {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        ghostUpgrades: {
          ...character.ghostUpgrades,
          [offer.upgradeId]: true,
        },
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

export function previewRestRewardChoice(
  state: CombatState,
  characterId: CharacterInstanceId,
  choiceId: RewardChoiceId,
): CombatState | null {
  if (state.phase !== "rest" || state.restStage !== "choice") {
    return null;
  }

  const offer = state.rewardOffers?.[characterId].find(
    (candidate) => candidate.id === choiceId,
  );

  if (!offer || offer.type !== "rest") {
    return null;
  }

  return applyRestReward(state, characterId, offer);
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
        : offer.type === "newSpirit"
          ? applySpiritReward(nextState, characterId, offer)
        : offer.type === "spiritRank"
          ? applySpiritRankReward(nextState, characterId, offer)
        : offer.type === "stat"
        ? applyStatUpgrade(nextState, characterId, offer)
        : offer.type === "passive"
          ? applyPassiveReward(nextState, characterId, offer)
          : offer.type === "ghostUpgrade"
            ? applyGhostUpgradeReward(nextState, characterId, offer)
          : offer.type === "newGhostAbility"
            ? applyGhostAbilityReward(nextState, characterId, offer)
            : applyAbilityReward(nextState, characterId, offer);

    if (!appliedState) {
      return null;
    }

    nextState = appliedState;
  }

  if (state.actTransitionStage === "spiritRank2") {
    return restorePartyForActTwo(nextState);
  }

  if (
    state.encounterId === "orcBrothers" &&
    state.phase === "victory" &&
    state.actTransitionStage === null
  ) {
    return beginSpiritRankTwoStage(nextState);
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
