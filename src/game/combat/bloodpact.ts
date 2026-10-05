import { CHARACTER_ORDER, isCharacterInstanceId } from "../playerControl";
import type { CharacterInstanceId, CombatState, PlayerId } from "../types";

export function getPendingBloodpactOwners(state: CombatState) {
  if (CHARACTER_ORDER.some(
    (id) => state.characters[id].form === "permanentlyDead",
  )) {
    return [];
  }
  return CHARACTER_ORDER.filter((id) => {
    const spirit = state.characters[id].spirits.bloodpact;
    return spirit && !spirit.bloodpactRoles;
  });
}

export function prepareBloodpactSelection(state: CombatState): CombatState {
  return state.phase === "selectingActions" &&
    getPendingBloodpactOwners(state).length > 0
    ? { ...state, phase: "selectingBloodpact" }
    : state;
}

export function selectBloodpactRoles(
  state: CombatState,
  playerId: PlayerId,
  sacrificeId: CharacterInstanceId,
): CombatState | null {
  const ownerId = state.players[playerId]?.controlledCharacterId;
  if (
    state.phase !== "selectingBloodpact" ||
    state.round !== 1 ||
    !ownerId ||
    !isCharacterInstanceId(sacrificeId) ||
    !getPendingBloodpactOwners(state).includes(ownerId)
  ) {
    return null;
  }

  const owner = state.characters[ownerId];
  const spirit = owner.spirits.bloodpact!;
  const nextState: CombatState = {
    ...state,
    characters: {
      ...state.characters,
      [ownerId]: {
        ...owner,
        spirits: {
          ...owner.spirits,
          bloodpact: {
            ...spirit,
            bloodpactRoles: {
              sacrificeId,
              protectedId: sacrificeId === "character-1" ? "character-2" : "character-1",
            },
          },
        },
      },
    },
  };
  return getPendingBloodpactOwners(nextState).length === 0
    ? { ...nextState, phase: "selectingActions" }
    : nextState;
}

export function getActiveBloodpactRoles(
  state: CombatState,
  ownerId: CharacterInstanceId,
) {
  const owner = state.characters[ownerId];
  const roles = owner.spirits.bloodpact?.bloodpactRoles;
  return owner.form === "living" && roles &&
    state.characters[roles.sacrificeId].form === "living" &&
    state.characters[roles.protectedId].form === "living"
    ? roles
    : null;
}
