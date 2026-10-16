import { hasPassive } from "../../data/passives";
import type {
  AbilityCategory,
  CharacterState,
  CombatantId,
  CombatState,
  PassiveId,
  StatusId,
} from "../types";

export const PASSIVE_VALUES = {
  bloodScentDamageBonus: 0.25,
  statusDurationBonus: 1,
  statusTickDamageBonus: 1,
  jaggedStrikesChance: 0.2,
  thornsDamage: 3,
  protectedCastingPpReduction: 1,
  manaWardBarrier: 6,
  manaWardMinimumBasePpCost: 8,
  shelteredRecoveryHealing: 5,
  triageThreshold: 0.3,
  triageHealing: 6,
  sharedRecoveryHealing: 5,
  refreshingWatersPp: 3,
  lifeCurrentMultiplier: 1.3,
  lastingCareBarrier: 3,
  shieldmateBarrier: 5,
  leaveItToMeDamageBonus: 0.25,
  battleRhythmPp: 3,
  braceBarrier: 6,
  counterguardDamage: 4,
  bombardierDamageBonus: 0.35,
  luckyHaulChance: 0.25,
  tailwindDamageBonus: 0.25,
} as const;

export function characterHasPassive(
  character: CharacterState,
  passiveId: PassiveId,
) {
  return character.form === "living" && hasPassive(character.passives, passiveId);
}

export function getStatusDurationForSource(
  state: CombatState,
  sourceId: CombatantId,
  statusId: StatusId,
  baseDuration: number,
) {
  const source =
    sourceId === "character-1" || sourceId === "character-2"
      ? state.characters[sourceId]
      : null;

  if (!source) {
    return baseDuration;
  }

  if (statusId !== "burn" && statusId !== "bleed") {
    return baseDuration;
  }

  const passiveId = statusId === "burn" ? "kindling" : "serratedEdge";
  return (
    baseDuration +
    (characterHasPassive(source, passiveId)
      ? PASSIVE_VALUES.statusDurationBonus
      : 0)
  );
}

export function getStatusTickPowerForSource(
  state: CombatState,
  sourceId: CombatantId,
  statusId: StatusId,
  basePower: number,
) {
  const source =
    sourceId === "character-1" || sourceId === "character-2"
      ? state.characters[sourceId]
      : null;

  if (!source) {
    return basePower;
  }

  if (statusId !== "burn" && statusId !== "bleed") {
    return basePower;
  }

  const passiveId = statusId === "burn" ? "hotterFlames" : "deepWounds";
  return (
    basePower +
    (characterHasPassive(source, passiveId)
      ? PASSIVE_VALUES.statusTickDamageBonus
      : 0)
  );
}

export function getEffectiveAbilityPpCost(
  character: CharacterState,
  category: AbilityCategory,
  baseCost: number,
) {
  if (
    category !== "ability" ||
    baseCost <= 0 ||
    character.barrier <= 0 ||
    !characterHasPassive(character, "protectedCasting")
  ) {
    return baseCost;
  }

  return Math.max(
    1,
    baseCost - PASSIVE_VALUES.protectedCastingPpReduction,
  );
}
