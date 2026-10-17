import { getSpiritPassive } from "../../data/spirits";
import { CHARACTER_ORDER } from "../playerControl";
import type { CombatState, SpiritId } from "../types";

export function getPartyHealingReceivedBonus(state: CombatState) {
  const activeSpirits = new Map<SpiritId, NonNullable<CombatState["characters"]["character-1"]["spirits"][SpiritId]>>();

  for (const characterId of CHARACTER_ORDER) {
    if (state.characters[characterId].form !== "living") {
      continue;
    }

    for (const spirit of Object.values(state.characters[characterId].spirits)) {
      if (spirit) {
        activeSpirits.set(spirit.id, spirit);
      }
    }
  }

  return [...activeSpirits.values()].reduce(
    (totalBonus, spirit) =>
      totalBonus +
      (getSpiritPassive(spirit).allHealingReceived?.flatIncrease ?? 0),
    0,
  );
}
