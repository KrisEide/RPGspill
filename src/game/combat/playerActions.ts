import { ITEM_DEFINITIONS } from "../../data/items";
import { getSpiritForActiveAbility } from "../../data/spirits";
import {
  getKnownAbilityRank,
  resolveAbility,
} from "../abilities/abilityProgression";
import {
  isCharacterInstanceId,
  PLAYER_ORDER,
} from "../playerControl";
import type {
  AbilityId,
  CombatantId,
  CombatState,
  ItemId,
  ItemTarget,
  PlayerId,
  RoundSelections,
} from "../types";
import { getEffectiveAbilityPpCost } from "../passives/passiveSystem";

type PlayerActionRequest = {
  playerId: PlayerId;
  abilityId: AbilityId;
  targetId: CombatantId | null;
};

type PlayerItemRequest = {
  playerId: PlayerId;
  itemId: ItemId;
  targetId: CombatantId | null;
};

export function isValidPlayerTarget(
  state: CombatState,
  actorId: CombatantId,
  targetId: CombatantId | null,
  targetType: ItemTarget,
) {
  if (targetType === "singleFallenAlly") {
    return (
      targetId !== null &&
      isCharacterInstanceId(targetId) &&
      state.characters[targetId].hp <= 0
    );
  }

  if (targetType === "allEnemies") {
    return targetId === null && state.enemies.some((enemy) => enemy.hp > 0);
  }

  if (targetType === "allAllies") {
    return (
      targetId === null &&
      isCharacterInstanceId(actorId) &&
      Object.values(state.characters).some((character) => character.hp > 0)
    );
  }

  if (targetType === "self") {
    return targetId === actorId;
  }

  if (targetType === "singleAlly") {
    return (
      targetId !== null &&
      isCharacterInstanceId(targetId) &&
      state.characters[targetId].hp > 0
    );
  }

  return (
    targetId !== null &&
    !isCharacterInstanceId(targetId) &&
    Boolean(
      state.enemies.find(
        (enemy) => enemy.instanceId === targetId && enemy.hp > 0,
      ),
    )
  );
}

export function createEmptyRoundSelections(): RoundSelections {
  return {
    "character-1": { action: null, quickActions: [] },
    "character-2": { action: null, quickActions: [] },
  };
}

export function selectPlayerAction(
  state: CombatState,
  selections: RoundSelections,
  request: PlayerActionRequest,
): RoundSelections | null {
  if (state.phase !== "selectingActions") {
    return null;
  }

  const characterId = state.players[request.playerId].controlledCharacterId;
  const actor = state.characters[characterId];
  const selection = selections[characterId];
  const abilityRank = getKnownAbilityRank(
    actor.abilityRanks,
    request.abilityId,
  );
  const activeSpirit = getSpiritForActiveAbility(
    actor.spirits,
    request.abilityId,
  );
  const ability = abilityRank
    ? resolveAbility(request.abilityId, abilityRank)
    : activeSpirit
      ? resolveAbility(request.abilityId, 1)
      : null;
  const ppCost = ability
    ? getEffectiveAbilityPpCost(actor, ability.category, ability.ppCost)
    : 0;

  if (
    actor.hp <= 0 ||
    selection.action !== null ||
    !ability ||
    (ability.category === "spirit" &&
      (!activeSpirit || activeSpirit.activeUsesRemaining <= 0)) ||
    actor.pp < ppCost ||
    !isValidPlayerTarget(
      state,
      characterId,
      request.targetId,
      ability.target,
    )
  ) {
    return null;
  }

  return {
    ...selections,
    [characterId]: {
      ...selection,
      action: {
        kind: "ability",
        actorId: characterId,
        abilityId: request.abilityId,
        targetId: request.targetId,
      },
    },
  };
}

export function selectPlayerItem(
  state: CombatState,
  selections: RoundSelections,
  request: PlayerItemRequest,
): RoundSelections | null {
  if (state.phase !== "selectingActions") {
    return null;
  }

  const characterId = state.players[request.playerId].controlledCharacterId;
  const actor = state.characters[characterId];
  const definition = ITEM_DEFINITIONS[request.itemId];
  const selection = selections[characterId];

  if (
    actor.hp <= 0 ||
    !definition ||
    definition.resolutionTiming === "preRound" ||
    !isValidPlayerTarget(
      state,
      characterId,
      request.targetId,
      definition.target,
    )
  ) {
    return null;
  }

  const queuedQuantity = [selection.action, ...selection.quickActions].filter(
    (action) => action?.kind === "item" && action.itemId === request.itemId,
  ).length;

  if ((actor.inventory[request.itemId] ?? 0) <= queuedQuantity) {
    return null;
  }

  const itemAction = {
    kind: "item" as const,
    actorId: characterId,
    itemId: request.itemId,
    targetId: request.targetId,
  };

  if (definition.useTiming === "quickAction") {
    return {
      ...selections,
      [characterId]: {
        ...selection,
        quickActions: [...selection.quickActions, itemAction],
      },
    };
  }

  if (selection.action !== null) {
    return null;
  }

  return {
    ...selections,
    [characterId]: {
      ...selection,
      action: itemAction,
    },
  };
}

export function areAllLivingPlayersReady(
  state: CombatState,
  selections: RoundSelections,
) {
  return PLAYER_ORDER.every((playerId) => {
    const characterId = state.players[playerId].controlledCharacterId;

    return (
      state.characters[characterId].hp <= 0 ||
      selections[characterId].action !== null
    );
  });
}
