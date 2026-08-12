export type PlayerId = "player1" | "player2";

export type CharacterInstanceId = "character-1" | "character-2";

export type EnemyInstanceId = `enemy-${number}`;

export type CombatantId = CharacterInstanceId | EnemyInstanceId;

export type GameMode = "singlePlayer" | "twoPlayer";

export type CharacterPresetId = "char1" | "char2";

export type PortraitId =
  | "c1p1"
  | "c1p2"
  | "c1p3"
  | "c2p1"
  | "c2p2"
  | "c2p3";

export type EnemyId = "level1Orc" | "orcRaider" | "orcMage";

export type EncounterId =
  | "forestAmbush"
  | "orcReinforcements"
  | "raiderWarband"
  | "darkMage";

export type UpgradeChoiceId =
  | "placeholder-upgrade-1"
  | "placeholder-upgrade-2"
  | "placeholder-upgrade-3";

export type Element = "fire" | "water" | "earth" | "wind";

export type DamageType = "physical" | "elemental";

export type ElementalPower = Record<Element, number>;

export type AbilityId =
  | "autoAttack"
  | "defend"
  | "fireball"
  | "whirlwind"
  | "windSlash"
  | "gangStrike"
  | "darkBolt";

export type AbilityTarget =
  | "singleEnemy"
  | "allEnemies"
  | "singleAlly"
  | "self";

export type AbilityCategory = "action" | "ability" | "spirit";

export type AbilityRank = 1 | 2;

export type KnownAbilities = Partial<Record<AbilityId, AbilityRank>>;

export type StatusId = "burn" | "cracked" | "wet" | "exposed";

export type StatusStackingRule = "refresh";

export type StatusDefinition = {
  id: StatusId;
  name: string;
  stackingRule: StatusStackingRule;
  maxStacks: 1;
  incomingDamageModifier?: {
    multiplier: number;
    triggeringAttacker: "sourcePartner";
    consumeOnTrigger: true;
  };
};

export type ActiveStatus = {
  id: StatusId;
  sourceId: CombatantId;
  appliedRound: number;
};

export type StatusChange =
  | {
      type: "applied";
      status: ActiveStatus;
    }
  | {
      type: "removed";
      statusId: StatusId;
    };

export type DamageEffect = {
  type: "damage";
  damageType: DamageType;
  basePower: number;
  attackScaling: number;
  elementalPowerScaling: number;
  damagePerOtherLivingSameEnemy?: number;
  criticalHit?: {
    chance: number;
    damageMultiplier: number;
  };
  statusOnCriticalHit?: StatusId;
};

export type DefendEffect = {
  type: "defend";
  damageReduction: number;
  duration: "round";
};

export type AbilityEffect = DamageEffect | DefendEffect;

export type AbilityRankDefinition = {
  description: string;
  ppCost: number;
  effects: AbilityEffect[];
};

export type AbilityRankTwoDefinition = AbilityRankDefinition & {
  newEffectDescription: string;
};

export type AbilityDefinition = {
  id: AbilityId;
  name: string;
  category: AbilityCategory;
  resolutionPriority: number;
  target: AbilityTarget;
  element: Element | null;
  aiTargeting?: "randomLivingCharacter";
  ranks: {
    1: AbilityRankDefinition;
    2?: AbilityRankTwoDefinition;
  };
};

export type ResolvedAbilityDefinition = Omit<
  AbilityDefinition,
  "ranks"
> &
  AbilityRankDefinition & {
    rank: AbilityRank;
  };

export type CombatStats = {
  maxHp: number;
  maxPp: number;
  attack: number;
  defense: number;
  resistance: number;
  agility: number;
  elementalPower: ElementalPower;
};

export type EnemyDefinition = {
  id: EnemyId;
  name: string;
  level: number;
  isBoss: boolean;
  stats: CombatStats;
  abilityRanks: KnownAbilities;
  passive?: {
    name: string;
    description: string;
  };
};

export type EnemyState = {
  instanceId: EnemyInstanceId;
  enemyId: EnemyId;
  name: string;
  level: number;
  isBoss: boolean;
  hp: number;
  pp: number;
  stats: CombatStats;
  abilityRanks: KnownAbilities;
  statuses: ActiveStatus[];
};

export type CharacterDraft = {
  name: string;
  portraitId: PortraitId;
  presetId: CharacterPresetId;
};

export type PlayerSetup = {
  id: PlayerId;
  controlledCharacterId: CharacterInstanceId;
  character: CharacterDraft;
};

export type GameSetup = {
  mode: GameMode;
  randomSeed: number;
  players: Record<PlayerId, PlayerSetup>;
};

export type CharacterState = CharacterDraft & {
  instanceId: CharacterInstanceId;
  ownerId: PlayerId;
  level: number;
  hp: number;
  pp: number;
  stats: CombatStats;
  abilityRanks: KnownAbilities;
  statuses: ActiveStatus[];
};

export type CombatAction = {
  actorId: CombatantId;
  abilityId: AbilityId;
  targetId: CombatantId | null;
};

export type RoundSelections = Record<CharacterInstanceId, CombatAction | null>;

export type PlayerState = {
  id: PlayerId;
  controlledCharacterId: CharacterInstanceId;
};

export type DamageEvent = {
  type: "damage";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  amount: number;
  remainingHp: number;
  isCritical: boolean;
  statusChanges: StatusChange[];
};

export type DefendEvent = {
  type: "defend";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
};

export type MultiTargetDamageImpact = {
  targetId: CombatantId;
  amount: number;
  remainingHp: number;
  isCritical: boolean;
  statusChanges: StatusChange[];
};

export type MultiTargetDamageEvent = {
  type: "multiTargetDamage";
  actorId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  impacts: MultiTargetDamageImpact[];
};

export type CombatEvent =
  | DamageEvent
  | MultiTargetDamageEvent
  | DefendEvent;

export type RoundOutcomePhase = "selectingActions" | "victory" | "defeat";

export type GamePhase = RoundOutcomePhase | "animating";

export type CombatState = {
  mode: GameMode;
  encounterId: EncounterId;
  randomSeed: number;
  round: number;
  phase: RoundOutcomePhase;
  players: Record<PlayerId, PlayerState>;
  characters: Record<CharacterInstanceId, CharacterState>;
  enemies: EnemyState[];
};

export type RoundResult = {
  nextState: CombatState;
  events: CombatEvent[];
};

export type PendingRound = {
  result: RoundResult;
  nextEventIndex: number;
  currentEventApplied: boolean;
};

export type ClientBattleState = {
  combat: CombatState;
  phase: GamePhase;
  roundSelections: RoundSelections;
  lastRoundEvents: CombatEvent[];
  pendingRound: PendingRound | null;
};
