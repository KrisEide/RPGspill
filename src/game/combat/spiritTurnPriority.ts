import { SPIRIT_DEFINITIONS } from "../../data/spirits";
import { CHARACTER_ORDER, isCharacterInstanceId } from "../playerControl";
import type {
  CombatState,
  CombatantId,
  KnownSpirits,
  SpiritId,
} from "../types";
import { nextRandom } from "./random";

export function prepareRoundTurnPriorities(
  state: CombatState,
): CombatState {
  let randomSeed = state.randomSeed;
  const characters = { ...state.characters };

  for (const characterId of CHARACTER_ORDER) {
    const character = characters[characterId];
    const spirits: KnownSpirits = { ...character.spirits };

    for (const spiritId of Object.keys(spirits).sort() as SpiritId[]) {
      const spirit = spirits[spiritId];
      const passive =
        SPIRIT_DEFINITIONS[spiritId].passive.roundStartTurnPriority;

      if (!spirit) {
        continue;
      }

      let roundPriorityActive = false;

      if (passive && character.hp > 0) {
        const result = nextRandom(randomSeed);
        randomSeed = result.nextSeed;
        roundPriorityActive = result.value < passive.chance;
      }

      spirits[spiritId] = {
        ...spirit,
        roundPriorityActive,
      };
    }

    characters[characterId] = {
      ...character,
      spirits,
    };
  }

  return {
    ...state,
    randomSeed,
    characters,
  };
}

export function getSpiritTurnResolutionPriority(
  state: CombatState,
  combatantId: CombatantId,
) {
  if (!isCharacterInstanceId(combatantId)) {
    return 0;
  }

  return Object.values(state.characters[combatantId].spirits).reduce(
    (highestPriority, spirit) => {
      if (!spirit?.roundPriorityActive) {
        return highestPriority;
      }

      return Math.max(
        highestPriority,
        SPIRIT_DEFINITIONS[spirit.id].passive.roundStartTurnPriority
          ?.resolutionPriority ?? 0,
      );
    },
    0,
  );
}
