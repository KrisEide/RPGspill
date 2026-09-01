import type {
  AbilityId,
  CharacterEventState,
  CharacterInstanceId,
  CharacterState,
  CombatState,
} from "../types";

export const GHOST_MAX_HP = 100;
export const GHOST_STARTING_HP = 30;
export const GHOST_MAX_PP = 20;
export const GHOST_INCOMING_DAMAGE_MULTIPLIER = 0.5;
export const GHOST_RECEIVED_HEALING_MULTIPLIER = 0.5;
export const REFORM_LIVING_HP = 30;
export const GHOST_UPGRADE_VALUES = {
  heavyHauntDamageBonus: 4,
  closerToTheVeilHpThreshold: 25,
  closerToTheVeilDamageBonus: 0.5,
} as const;
export const BASELINE_GHOST_ABILITY_IDS = [
  "ghostStrike",
  "ghostBolt",
  "ghostHeal",
] as const satisfies readonly AbilityId[];
export const GHOST_REWARD_ABILITY_IDS = [
  "possession",
] as const satisfies readonly AbilityId[];
export const GHOST_ABILITY_IDS = [
  ...BASELINE_GHOST_ABILITY_IDS,
  ...GHOST_REWARD_ABILITY_IDS,
] as const satisfies readonly AbilityId[];

export function isGhostAbilityId(abilityId: AbilityId) {
  return (GHOST_ABILITY_IDS as readonly AbilityId[]).includes(abilityId);
}

export function canCharacterUseGhostAbility(
  character: CharacterState,
  abilityId: AbilityId,
) {
  return (
    character.form === "ghost" &&
    ((BASELINE_GHOST_ABILITY_IDS as readonly AbilityId[]).includes(
      abilityId,
    ) || character.ghostAbilityRanks[abilityId] !== undefined)
  );
}

export function getKnownGhostAbilityIds(character: CharacterState) {
  const learnedRewardAbilities = Object.keys(
    character.ghostAbilityRanks,
  ) as AbilityId[];

  return ["ghostBolt" as const, ...learnedRewardAbilities];
}

export function applyCharacterHp(
  character: CharacterState,
  requestedHp: number,
): CharacterState {
  if (character.form === "permanentlyDead") {
    return character;
  }

  if (requestedHp > 0) {
    return { ...character, hp: requestedHp };
  }

  if (character.form === "living") {
    return {
      ...character,
      form: "ghost",
      hp: GHOST_STARTING_HP,
      pp: GHOST_MAX_PP,
      savedLivingPp: character.pp,
      barrier: 0,
      statuses: [],
      itemDamageBonus: null,
      abilityDamageBonus: null,
    };
  }

  return {
    ...character,
    form: "permanentlyDead",
    hp: 0,
    pp: 0,
    barrier: 0,
    statuses: [],
    itemDamageBonus: null,
    abilityDamageBonus: null,
  };
}

export function getCharacterEventState(
  character: CharacterState,
): CharacterEventState {
  return {
    form: character.form,
    pp: character.pp,
    savedLivingPp: character.savedLivingPp,
    statuses: character.statuses,
  };
}

export function getCharacterMaxHp(character: CharacterState) {
  return character.form === "ghost" ? GHOST_MAX_HP : character.stats.maxHp;
}

export function getCharacterMaxPp(character: CharacterState) {
  return character.form === "ghost" ? GHOST_MAX_PP : character.stats.maxPp;
}

export function applyGhostIncomingDamage(
  target: CharacterState,
  damage: number,
) {
  return target.form === "ghost"
    ? Math.max(1, Math.round(damage * GHOST_INCOMING_DAMAGE_MULTIPLIER))
    : damage;
}

export function applyGhostReceivedHealing(
  target: CharacterState,
  healing: number,
) {
  return target.form === "ghost"
    ? Math.max(1, Math.round(healing * GHOST_RECEIVED_HEALING_MULTIPLIER))
    : healing;
}

export function reformGhost(
  state: CombatState,
  characterId: CharacterInstanceId,
): CombatState | null {
  const character = state.characters[characterId];

  if (character.form !== "ghost" || character.hp < GHOST_MAX_HP) {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        form: "living",
        hp: Math.min(character.stats.maxHp, REFORM_LIVING_HP),
        pp: Math.min(
          character.stats.maxPp,
          character.savedLivingPp ?? character.stats.maxPp,
        ),
        savedLivingPp: null,
        statuses: [],
      },
    },
  };
}

export function reviveGhost(
  state: CombatState,
  characterId: CharacterInstanceId,
  hp = REFORM_LIVING_HP,
): CombatState | null {
  const character = state.characters[characterId];

  if (character.form !== "ghost") {
    return null;
  }

  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...character,
        form: "living",
        hp: Math.min(character.stats.maxHp, hp),
        pp: Math.min(
          character.stats.maxPp,
          character.savedLivingPp ?? character.stats.maxPp,
        ),
        savedLivingPp: null,
        statuses: [],
      },
    },
  };
}
