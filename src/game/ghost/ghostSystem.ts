import type {
  AbilityId,
  CharacterEventState,
  CharacterInstanceId,
  CharacterState,
  CombatState,
} from "../types";

export const GHOST_MAX_HP = 120;
export const GHOST_REFORM_HP = 100;
export const GHOST_STARTING_HP = 30;
export const GHOST_MAX_PP = 20;
export const GHOST_INCOMING_DAMAGE_MULTIPLIER = 0.5;
export const GHOST_RECEIVED_HEALING_MULTIPLIER = 0.5;
export const REFORM_LIVING_HP = 30;
export const PHOENIX_REBIRTH_HP = 40;
export const PHOENIX_REBIRTH_BARRIER = 10;
const PHOENIX_CLEANSED_STATUS_IDS = new Set([
  "burn",
  "poison",
  "cinderCurse",
  "rootseed",
  "bleed",
]);
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
    return {
      ...character,
      hp: requestedHp,
      ghostReformReady:
        character.form === "ghost"
          ? character.ghostReformReady || requestedHp >= GHOST_REFORM_HP
          : false,
      soulLinkActive:
        character.form === "ghost" ? character.soulLinkActive : false,
    };
  }

  if (character.form === "living") {
    const phoenix = character.spirits.phoenix;

    if (phoenix && phoenix.activeUsesRemaining > 0) {
      return {
        ...character,
        hp: Math.min(character.stats.maxHp, PHOENIX_REBIRTH_HP),
        barrier: PHOENIX_REBIRTH_BARRIER,
        statuses: character.statuses.filter(
          (status) => !PHOENIX_CLEANSED_STATUS_IDS.has(status.id),
        ),
        spirits: {
          ...character.spirits,
          phoenix: {
            ...phoenix,
            activeUsesRemaining: 0,
          },
        },
      };
    }

    return {
      ...character,
      form: "ghost",
      hp: GHOST_STARTING_HP,
      pp: GHOST_MAX_PP,
      savedLivingPp: character.pp,
      ghostReformReady: false,
      soulLinkActive: true,
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
    ghostReformReady: false,
    soulLinkActive: false,
    barrier: 0,
    statuses: [],
    itemDamageBonus: null,
    abilityDamageBonus: null,
  };
}

export function hasAvailablePhoenixRebirth(character: CharacterState) {
  return (
    character.form === "living" &&
    (character.spirits.phoenix?.activeUsesRemaining ?? 0) > 0
  );
}

export function getCharacterEventState(
  character: CharacterState,
): CharacterEventState {
  return {
    form: character.form,
    pp: character.pp,
    savedLivingPp: character.savedLivingPp,
    ghostReformReady: character.ghostReformReady,
    soulLinkActive: character.soulLinkActive,
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

  if (character.form !== "ghost" || !character.ghostReformReady) {
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
        ghostReformReady: false,
        soulLinkActive: false,
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
        ghostReformReady: false,
        soulLinkActive: false,
        statuses: [],
      },
    },
  };
}
