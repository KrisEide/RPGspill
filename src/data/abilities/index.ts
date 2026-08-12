import type { AbilityDefinition, AbilityId } from "../../game/types";
import { ACTION_ABILITY_DEFINITIONS } from "./actions";
import { FIRE_ABILITY_DEFINITIONS } from "./fire";
import { PHYSICAL_ABILITY_DEFINITIONS } from "./physical";
import { WIND_ABILITY_DEFINITIONS } from "./wind";

export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  ...ACTION_ABILITY_DEFINITIONS,
  ...FIRE_ABILITY_DEFINITIONS,
  ...PHYSICAL_ABILITY_DEFINITIONS,
  ...WIND_ABILITY_DEFINITIONS,
};
