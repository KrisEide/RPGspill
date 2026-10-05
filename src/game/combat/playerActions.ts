import { ITEM_DEFINITIONS } from "../../data/items";
import {
  getSpiritForActiveAbility,
  SPIRIT_DEFINITIONS,
} from "../../data/spirits";
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
  CharacterInstanceId,
  CombatantId,
  CombatState,
  ItemId,
  ItemTarget,
  PlayerId,
  RoundSelections,
} from "../types";
import { getEffectiveAbilityPpCost } from "../passives/passiveSystem";
import { isEnemyTargetable } from "./targeting";
import { getActiveBloodpactRoles } from "./bloodpact";
import { canCharacterUseGhostAbility } from "../ghost/ghostSystem";

type PlayerActionRequest = {
  playerId: PlayerId;
  abilityId: AbilityId;
  targetId: CombatantId | null;
  secondaryTargetId?: CombatantId | null;
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
      state.characters[targetId].form === "ghost"
    );
  }

  if (targetType === "allEnemies") {
    return targetId === null && state.enemies.some(isEnemyTargetable);
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
        (enemy) =>
          enemy.instanceId === targetId && isEnemyTargetable(enemy),
      ),
    )
  );
}

export function createEmptyRoundSelections(): RoundSelections {
  return {
    "character-1": { action: null, bonusAction: null, quickActions: [] },
    "character-2": { action: null, bonusAction: null, quickActions: [] },
  };
}

function getPossessionSourceForCharacter(
  selections: RoundSelections,
  characterId: CharacterInstanceId,
) {
  for (const sourceId of Object.keys(selections) as CharacterInstanceId[]) {
    const action = selections[sourceId].action;

    if (
      action?.kind === "ability" &&
      action.abilityId === "possession" &&
      action.targetId === characterId
    ) {
      return sourceId;
    }
  }

  return null;
}

export function doesCharacterNeedAction(
  state: CombatState,
  selections: RoundSelections,
  characterId: CharacterInstanceId,
) {
  if (state.characters[characterId].hp <= 0) {
    return false;
  }

  if (
    state.characters[characterId].form === "living" &&
    state.characters[characterId].statuses.some(
      (status) => status.id === "abilityCharge",
    )
  ) {
    return false;
  }

  const selection = selections[characterId];

  if (selection.action === null) {
    return true;
  }

  return (
    getPossessionSourceForCharacter(selections, characterId) !== null &&
    selection.bonusAction === null
  );
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
  const ghostAbility = canCharacterUseGhostAbility(
    actor,
    request.abilityId,
  );
  const ability = ghostAbility
    ? resolveAbility(request.abilityId, 1)
    : actor.form !== "living"
      ? null
      : abilityRank
    ? resolveAbility(request.abilityId, abilityRank)
    : activeSpirit
      ? resolveAbility(request.abilityId, 1)
      : null;
  const ppCost = ability
    ? getEffectiveAbilityPpCost(actor, ability.category, ability.ppCost)
    : 0;
  const ghostHpCost =
    ability?.effects.find((effect) => effect.type === "ghostHpCost")
      ?.amount ?? 0;
  const possessionTargetIsValid =
    request.abilityId !== "possession" ||
    (request.targetId !== null &&
      isCharacterInstanceId(request.targetId) &&
      request.targetId !== characterId &&
      state.characters[request.targetId].form === "living");
  const isBonusAction =
    selection.action !== null &&
    getPossessionSourceForCharacter(selections, characterId) !== null;
  const secondaryTargetIsValid = ability?.secondaryTarget
    ? isValidPlayerTarget(
        state,
        characterId,
        request.secondaryTargetId ?? null,
        ability.secondaryTarget,
      )
      : request.secondaryTargetId === undefined ||
      request.secondaryTargetId === null;
  const warhound = actor.spirits.warhound;
  const isWarhoundQuickAutoAttack =
    request.abilityId === "autoAttack" &&
    actor.form === "living" &&
    Boolean(
      warhound &&
        SPIRIT_DEFINITIONS[warhound.id].passive
          .firstAutoAttackEachRoundIsQuick,
    ) &&
    selection.action === null &&
    !actor.statuses.some((status) => status.id === "stunned") &&
    !selection.quickActions.some(
      (action) =>
        action.kind === "ability" && action.abilityId === "autoAttack",
    );
  const isQuickAbility = ability?.useTiming === "quickAction";
  const spiritActiveAlreadyQueued = Boolean(
    activeSpirit &&
      selection.quickActions.some(
        (action) =>
          action.kind === "ability" &&
          action.abilityId === request.abilityId,
      ),
  );

  if (
    actor.form === "permanentlyDead" ||
    actor.statuses.some((status) => status.id === "abilityCharge") ||
    (selection.action !== null &&
      (!isBonusAction || selection.bonusAction !== null)) ||
    !ability ||
    (request.abilityId === "bloodpact" && !getActiveBloodpactRoles(state, characterId)) ||
    (ability.category === "spirit" &&
      (!activeSpirit || activeSpirit.activeUsesRemaining <= 0)) ||
    (isQuickAbility &&
      actor.statuses.some((status) => status.id === "stunned")) ||
    spiritActiveAlreadyQueued ||
    actor.pp < ppCost ||
    actor.hp < ghostHpCost ||
    !possessionTargetIsValid ||
    !secondaryTargetIsValid ||
    !isValidPlayerTarget(
      state,
      characterId,
      request.targetId,
      ability.target,
    )
  ) {
    return null;
  }

  const abilityAction = {
    kind: "ability" as const,
    actorId: characterId,
    abilityId: request.abilityId,
    targetId: request.targetId,
    secondaryTargetId: request.secondaryTargetId ?? null,
  };

  if (isWarhoundQuickAutoAttack || isQuickAbility) {
    return {
      ...selections,
      [characterId]: {
        ...selection,
        quickActions: [...selection.quickActions, abilityAction],
      },
    };
  }

  return {
    ...selections,
    [characterId]: {
      ...selection,
      [isBonusAction ? "bonusAction" : "action"]: abilityAction,
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
    actor.form !== "living" ||
    actor.statuses.some((status) => status.id === "abilityCharge") ||
    (definition?.useTiming === "quickAction" &&
      actor.statuses.some((status) => status.id === "stunned")) ||
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

  const queuedQuantity = [
    selection.action,
    selection.bonusAction,
    ...selection.quickActions,
  ].filter(
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

  const isBonusAction =
    selection.action !== null &&
    getPossessionSourceForCharacter(selections, characterId) !== null;

  if (
    selection.action !== null &&
    (!isBonusAction || selection.bonusAction !== null)
  ) {
    return null;
  }

  return {
    ...selections,
    [characterId]: {
      ...selection,
      [isBonusAction ? "bonusAction" : "action"]: itemAction,
    },
  };
}

export function areAllLivingPlayersReady(
  state: CombatState,
  selections: RoundSelections,
) {
  return PLAYER_ORDER.every((playerId) => {
    const characterId = state.players[playerId].controlledCharacterId;

    return !doesCharacterNeedAction(state, selections, characterId);
  });
}
