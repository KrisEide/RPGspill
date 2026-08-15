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

export type EnemyId =
  | "level1Orc"
  | "orcRaider"
  | "orcMage"
  | "orcWizard";

export type EncounterId =
  | "forestAmbush"
  | "orcReinforcements"
  | "raiderWarband"
  | "darkMage"
  | "dreadflameRitual";

export type UpgradeChoiceId =
  | "vitality"
  | "power"
  | "quickness"
  | "fortitude"
  | "warding"
  | "focus"
  | "precision"
  | "flame-affinity"
  | "tidal-affinity"
  | "stone-affinity"
  | "gale-affinity";

export type StatUpgradeTarget =
  | "maxHp"
  | "maxPp"
  | "attack"
  | "agility"
  | "defense"
  | "resistance"
  | "criticalChance"
  | "firePower"
  | "waterPower"
  | "earthPower"
  | "windPower";

export type RewardOffer = {
  id: UpgradeChoiceId;
  type: "stat";
  icon: string;
  title: string;
  description: string;
  effect: {
    target: StatUpgradeTarget;
    amount: number;
    restoreHp?: number;
    restorePp?: number;
  };
};

export type RewardOffers = Record<CharacterInstanceId, RewardOffer[]>;

export type Element = "fire" | "water" | "earth" | "wind";

export type DamageType = "physical" | "elemental" | "magical";

export type ElementalPower = Record<Element, number>;

export type AbilityId =
  | "autoAttack"
  | "defend"
  | "fireball"
  | "crashingWave"
  | "healingTide"
  | "stonebloom"
  | "whirlwind"
  | "windSlash"
  | "gangStrike"
  | "darkBolt"
  | "dreadflame"
  | "cinderburst";

export type SpiritId = "embertail";

export type AbilityTarget =
  | "singleEnemy"
  | "allEnemies"
  | "singleAlly"
  | "self";

export type AbilityCategory = "action" | "ability" | "spirit";

export type AbilityRank = 1 | 2;

export type KnownAbilities = Partial<Record<AbilityId, AbilityRank>>;

export type SpiritState = {
  id: SpiritId;
  activeUsesRemaining: number;
  passiveTriggeredRound: number | null;
};

export type KnownSpirits = Partial<Record<SpiritId, SpiritState>>;

export type StatusId =
  | "burn"
  | "cracked"
  | "wet"
  | "exposed"
  | "weakened";

export type StatusStackingRule = "refresh";

export type StatusDefinition = {
  id: StatusId;
  name: string;
  stackingRule: StatusStackingRule;
  maxStacks: 1;
  durationRounds?: number;
  endOfRoundDamage?: {
    basePower: number;
    damageType: DamageType;
    element: Element;
  };
  incomingDamageModifier?: {
    multiplier: number;
    triggeringAttacker: "sourcePartner";
    consumeOnTrigger: true;
  };
  outgoingDamageModifier?: {
    consumeOnNextDamageAction: true;
  };
};

export type ActiveStatus = {
  id: StatusId;
  sourceId: CombatantId;
  appliedRound: number;
  magnitude?: number;
  remainingRounds?: number;
};

export type StatusChange =
  | {
      type: "applied";
      combatantId: CombatantId;
      status: ActiveStatus;
    }
  | {
      type: "removed";
      combatantId: CombatantId;
      statusId: StatusId;
    };

export type DamageEffect = {
  type: "damage";
  damageType: DamageType;
  basePower: number;
  attackScaling: number;
  elementalPowerScaling: number;
  usesDamageVariance?: boolean;
  damagePerOtherLivingSameEnemy?: number;
  criticalHit?: {
    chance: number;
    damageMultiplier: number;
  };
  statusOnCriticalHit?: StatusId;
  statusOnHit?: {
    statusId: StatusId;
    magnitude?: number;
  };
};

export type DefendEffect = {
  type: "defend";
  damageReduction: number;
  duration: "round";
};

export type HealingEffect = {
  type: "healing";
  basePower: number;
  elementalPowerScaling: number;
};

export type BarrierEffect = {
  type: "barrier";
  amount: number;
};

export type CleanseEffect = {
  type: "cleanse";
  statusId: StatusId;
};

export type AbilityEffect =
  | DamageEffect
  | DefendEffect
  | HealingEffect
  | BarrierEffect
  | CleanseEffect;

export type AbilityRankDefinition = {
  shortDescription: string;
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

export type SpiritDefinition = {
  id: SpiritId;
  name: string;
  element: Element;
  passive: {
    name: string;
    description: string;
    firstDamageActionEachRound: {
      basePower: number;
      damageType: DamageType;
      element: Element;
    };
  };
  activeAbilityId: AbilityId;
  activeUsesPerEncounter: number;
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
  criticalChance: number;
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
  barrier: number;
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
  startingEncounterId?: EncounterId;
  players: Record<PlayerId, PlayerSetup>;
};

export type CharacterState = CharacterDraft & {
  instanceId: CharacterInstanceId;
  ownerId: PlayerId;
  level: number;
  hp: number;
  pp: number;
  barrier: number;
  stats: CombatStats;
  abilityRanks: KnownAbilities;
  spirits: KnownSpirits;
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
  absorbedByBarrier: number;
  remainingBarrier: number;
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
  absorbedByBarrier: number;
  remainingBarrier: number;
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

export type StatusDamageEvent = {
  type: "statusDamage";
  sourceId: CombatantId;
  targetId: CombatantId;
  statusId: StatusId;
  element: Element;
  amount: number;
  remainingHp: number;
  isCritical: false;
  statusChanges: StatusChange[];
};

export type SpiritDamageEvent = {
  type: "spiritDamage";
  sourceId: CharacterInstanceId;
  targetId: CombatantId;
  spiritId: SpiritId;
  element: Element;
  amount: number;
  remainingHp: number;
  absorbedByBarrier: number;
  remainingBarrier: number;
  isCritical: false;
  statusChanges: StatusChange[];
};

export type SupportEvent = {
  type: "support";
  actorId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  healingAmount: number;
  remainingHp: number;
  barrierAmount: number;
  remainingBarrier: number;
  statusChanges: StatusChange[];
};

export type CombatEvent =
  | DamageEvent
  | MultiTargetDamageEvent
  | StatusDamageEvent
  | SpiritDamageEvent
  | SupportEvent
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
  rewardOffers: RewardOffers | null;
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
