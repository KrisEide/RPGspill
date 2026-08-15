import type { AbilityDefinition, AbilityId } from "../../game/types";
import { ACTION_ABILITY_DEFINITIONS } from "./actions";
import { FIRE_ABILITY_DEFINITIONS } from "./fire";
import { EARTH_ABILITY_DEFINITIONS } from "./earth";
import { PHYSICAL_ABILITY_DEFINITIONS } from "./physical";
import { WIND_ABILITY_DEFINITIONS } from "./wind";
import { WATER_ABILITY_DEFINITIONS } from "./water";
import { SPIRIT_ABILITY_DEFINITIONS } from "./spirits";

export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  ...ACTION_ABILITY_DEFINITIONS,
  ...FIRE_ABILITY_DEFINITIONS,
  ...EARTH_ABILITY_DEFINITIONS,
  ...PHYSICAL_ABILITY_DEFINITIONS,
  ...WIND_ABILITY_DEFINITIONS,
  ...WATER_ABILITY_DEFINITIONS,
  ...SPIRIT_ABILITY_DEFINITIONS,
};
