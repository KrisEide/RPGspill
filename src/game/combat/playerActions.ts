import { ABILITIES } from "../../data/actions";
import { PLAYER_ORDER } from "../playerControl";
import type {
  AbilityId,
  CombatState,
  EnemyInstanceId,
  PlayerId,
  RoundSelections,
} from "../types";

type PlayerActionRequest = {
  playerId: PlayerId;
  abilityId: AbilityId;
  targetId: EnemyInstanceId;
};

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
  const target = state.enemies.find(
    (enemy) => enemy.instanceId === request.targetId,
  );
  const ability = ABILITIES[request.abilityId];

  if (
    actor.hp <= 0 ||
    selections[characterId] !== null ||
    !actor.abilityIds.includes(request.abilityId) ||
    actor.pp < ability.ppCost ||
    !target ||
    target.hp <= 0
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
