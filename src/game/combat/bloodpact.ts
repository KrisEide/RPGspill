import type { CharacterInstanceId, CombatState } from "../types";

export function getActiveBloodpactRoles(
  state: CombatState,
  ownerId: CharacterInstanceId,
) {
  const owner = state.characters[ownerId];
  const protectedId: CharacterInstanceId =
    ownerId === "character-1" ? "character-2" : "character-1";
  return owner.spirits.bloodpact && owner.form === "living" &&
    state.characters[protectedId].form === "living"
    ? { sacrificeId: ownerId, protectedId }
    : null;
}
