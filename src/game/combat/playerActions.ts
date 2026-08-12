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
  AbilityTarget,
  CombatantId,
  CombatState,
  PlayerId,
  RoundSelections,
} from "../types";

type PlayerActionRequest = {
  playerId: PlayerId;
  abilityId: AbilityId;
  targetId: CombatantId | null;
};

function isValidTarget(
  state: CombatState,
  actorId: CombatantId,
  targetId: CombatantId | null,
  targetType: AbilityTarget,
) {
  if (targetType === "allEnemies") {
    return (
      targetId === null && state.enemies.some((enemy) => enemy.hp > 0)
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
    "character-1": null,
    "character-2": null,
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
  const abilityRank = getKnownAbilityRank(
    actor.abilityRanks,
    request.abilityId,
  );
  const ability = abilityRank
    ? resolveAbility(request.abilityId, abilityRank)
    : null;

  if (
    actor.hp <= 0 ||
    selections[characterId] !== null ||
    !ability ||
    actor.pp < ability.ppCost ||
    !isValidTarget(
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
      actorId: characterId,
      abilityId: request.abilityId,
      targetId: request.targetId,
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
      selections[characterId] !== null
    );
  });
}
