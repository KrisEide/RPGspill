import { ITEM_DEFINITIONS, ITEM_REWARD_POOL } from "../../data/items";
import { CHARACTER_ORDER } from "../playerControl";
import { nextRandom } from "../combat/random";
import { characterHasPassive, PASSIVE_VALUES } from "../passives/passiveSystem";
import type {
  CombatState,
  Inventory,
  ItemDefinition,
  ItemId,
  ItemRewards,
} from "../types";

const TEST_ITEM_QUANTITY = 1;
const ITEM_RARITY_WEIGHTS = {
  common: 6,
  uncommon: 3,
  rare: 1,
} as const;

export function getItemRewardWeight(itemId: ItemId) {
  const definition = ITEM_DEFINITIONS[itemId];
  return definition.rewardWeight ?? ITEM_RARITY_WEIGHTS[definition.rarity];
}

export type InventoryEntry = {
  definition: ItemDefinition;
  quantity: number;
};

export function createItemRewardPool(): ItemId[] {
  return ITEM_REWARD_POOL.flatMap((itemId) =>
    Array.from({ length: getItemRewardWeight(itemId) }, () => itemId),
  );
}

export function createTestingInventory(): Inventory {
  return Object.fromEntries(
    ITEM_REWARD_POOL.map((itemId) => [itemId, TEST_ITEM_QUANTITY]),
  );
}

export function createEmptyInventory(): Inventory {
  return {};
}

export function drawNormalItemReward(seed: number) {
  const draw = drawWeightedItem(ITEM_REWARD_POOL, seed);

  return {
    itemId: draw.itemId,
    nextSeed: draw.nextSeed,
  };
}

export function getInventoryEntries(inventory: Inventory): InventoryEntry[] {
  return Object.entries(inventory).flatMap(([itemId, quantity]) => {
    const definition = ITEM_DEFINITIONS[itemId];

    return definition && quantity > 0 ? [{ definition, quantity }] : [];
  });
}

type ItemRewardResult = {
  state: CombatState;
  rewards: ItemRewards;
  nextSeed: number;
};

export function grantEncounterItemRewards(
  state: CombatState,
  seed: number,
): ItemRewardResult {
  let nextState = state;
  let nextSeed = seed;
  const rewards: ItemRewards = {
    "character-1": [],
    "character-2": [],
  };

  for (const characterId of CHARACTER_ORDER) {
    const character = nextState.characters[characterId];

    if (character.form === "permanentlyDead") {
      continue;
    }

    let updatedCharacter =
      character.remainingItemRewardPool.length > 0
        ? character
        : {
            ...character,
            remainingItemRewardPool: createItemRewardPool(),
          };

    if (updatedCharacter.remainingItemRewardPool.length > 0) {
      const draw = drawItemFromBag(
        updatedCharacter.remainingItemRewardPool,
        nextSeed,
      );
      nextSeed = draw.nextSeed;

      if (draw.itemId) {
        rewards[characterId].push(draw.itemId);
        updatedCharacter = {
          ...updatedCharacter,
          inventory: {
            ...updatedCharacter.inventory,
            [draw.itemId]: (updatedCharacter.inventory[draw.itemId] ?? 0) + 1,
          },
          remainingItemRewardPool: updatedCharacter.remainingItemRewardPool.filter(
            (_, index) => index !== draw.selectedIndex,
          ),
        };
      }
    }

    if (characterHasPassive(updatedCharacter, "luckyHaul")) {
      const chanceRoll = nextRandom(nextSeed);
      nextSeed = chanceRoll.nextSeed;

      if (chanceRoll.value < PASSIVE_VALUES.luckyHaulChance) {
        if (updatedCharacter.remainingItemRewardPool.length === 0) {
          updatedCharacter = {
            ...updatedCharacter,
            remainingItemRewardPool: createItemRewardPool(),
          };
        }

        const bonusDraw = drawItemFromBag(
          updatedCharacter.remainingItemRewardPool,
          nextSeed,
        );
        nextSeed = bonusDraw.nextSeed;

        if (bonusDraw.itemId) {
          rewards[characterId].push(bonusDraw.itemId);
          updatedCharacter = {
            ...updatedCharacter,
            inventory: {
              ...updatedCharacter.inventory,
              [bonusDraw.itemId]:
                (updatedCharacter.inventory[bonusDraw.itemId] ?? 0) + 1,
            },
            remainingItemRewardPool:
              updatedCharacter.remainingItemRewardPool.filter(
                (_, index) => index !== bonusDraw.selectedIndex,
              ),
          };
        }
      }
    }

    nextState = {
      ...nextState,
      characters: {
        ...nextState.characters,
        [characterId]: updatedCharacter,
      },
    };
  }

  return { state: nextState, rewards, nextSeed };
}

function drawItemFromBag(pool: readonly ItemId[], seed: number) {
  if (pool.length === 0) {
    return { itemId: null, selectedIndex: -1, nextSeed: seed };
  }

  const roll = nextRandom(seed);
  const selectedIndex = Math.min(
    pool.length - 1,
    Math.floor(roll.value * pool.length),
  );

  return {
    itemId: pool[selectedIndex] ?? null,
    selectedIndex,
    nextSeed: roll.nextSeed,
  };
}

function drawWeightedItem(pool: readonly ItemId[], seed: number) {
  if (pool.length === 0) {
    return { itemId: null, selectedIndex: -1, nextSeed: seed };
  }

  const roll = nextRandom(seed);
  const totalWeight = pool.reduce(
    (sum, itemId) => sum + getItemRewardWeight(itemId),
    0,
  );
  let weightedRoll = roll.value * totalWeight;
  let selectedIndex = pool.length - 1;

  for (let index = 0; index < pool.length; index += 1) {
    weightedRoll -= getItemRewardWeight(pool[index]);
    if (weightedRoll < 0) {
      selectedIndex = index;
      break;
    }
  }

  return {
    itemId: pool[selectedIndex] ?? null,
    selectedIndex,
    nextSeed: roll.nextSeed,
  };
}
