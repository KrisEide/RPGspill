import { SPIRIT_DEFINITIONS } from "../../data/spirits";
import { CHARACTER_ORDER } from "../playerControl";
import type { CombatState, SpiritId } from "../types";

export function getPartyHealingReceivedBonus(state: CombatState) {
  const activeSpiritIds = new Set<SpiritId>();

  for (const characterId of CHARACTER_ORDER) {
    for (const spirit of Object.values(state.characters[characterId].spirits)) {
      if (spirit) {
        activeSpiritIds.add(spirit.id);
      }
    }
  }

  return [...activeSpiritIds].reduce(
    (totalBonus, spiritId) =>
      totalBonus +
      (SPIRIT_DEFINITIONS[spiritId].passive.allHealingReceived
        ?.flatIncrease ?? 0),
    0,
  );
}
