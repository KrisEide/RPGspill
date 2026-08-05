export type PlayerId = "player1" | "player2";

export type EnemyInstanceId = `enemy-${number}`;

export type CombatantId = PlayerId | EnemyInstanceId;

export type GameMode = "singlePlayer" | "twoPlayer";

export type CharacterId = "char1" | "char2";

export type EnemyId = "level1Orc";

export type Element = "fire" | "water" | "earth" | "wind";

export type DamageType = "physical" | "elemental";

export type ElementalPower = Record<Element, number>;

export type AbilityId = "autoAttack";

export type AbilityTarget = "singleEnemy" | "singleAlly" | "self";

export type DamageEffect = {
  type: "damage";
  damageType: DamageType;
  basePower: number;
  attackScaling: number;
  elementalPowerScaling: number;
  criticalHit?: {
    chance: number;
    damageMultiplier: number;
  };
};

export type AbilityEffect = DamageEffect;

export type AbilityDefinition = {
  id: AbilityId;
  name: string;
  description: string;
  ppCost: number;
  target: AbilityTarget;
  element: Element | null;
  effects: AbilityEffect[];
};

export type CombatStats = {
  maxHp: number;
  maxPp: number;
  attack: number;
  defense: number;
  agility: number;
  elementalPower: ElementalPower;
};

export type EnemyDefinition = {
  id: EnemyId;
  name: string;
  level: number;
  stats: CombatStats;
  abilityIds: AbilityId[];
};

export type EnemyState = {
  instanceId: EnemyInstanceId;
  enemyId: EnemyId;
  name: string;
  level: number;
  hp: number;
  pp: number;
  stats: CombatStats;
  abilityIds: AbilityId[];
};

export type CharacterDraft = {
  name: string;
  portraitSrc: string;
  characterId: CharacterId;
};

export type PlayerSetup = {
  id: PlayerId;
  character: CharacterDraft;
};

export type GameSetup = {
  mode: GameMode;
  randomSeed: number;
  players: Record<PlayerId, PlayerSetup>;
};

export type CharacterState = CharacterDraft & {
  ownerId: PlayerId;
  level: number;
  hp: number;
  pp: number;
  stats: CombatStats;
  abilityIds: AbilityId[];
};

export type CombatAction = {
  actorId: CombatantId;
  abilityId: AbilityId;
  targetId: CombatantId;
};

export type RoundSelections = Record<PlayerId, CombatAction | null>;

export type DamageEvent = {
  type: "damage";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  amount: number;
  remainingHp: number;
  isCritical: boolean;
};

export type CombatEvent = DamageEvent;

export type RoundOutcomePhase = "selectingActions" | "victory" | "defeat";

export type GamePhase = RoundOutcomePhase | "animating";

export type PendingRound = {
  events: CombatEvent[];
  nextEventIndex: number;
  currentEventApplied: boolean;
  finalRound: number;
  finalPhase: RoundOutcomePhase;
  finalCharacters: Record<PlayerId, CharacterState>;
  finalEnemies: EnemyState[];
};

export type GameState = {
  mode: GameMode;
  randomSeed: number;
  round: number;
  phase: GamePhase;
  characters: Record<PlayerId, CharacterState>;
  enemies: EnemyState[];
  roundSelections: RoundSelections;
  lastRoundEvents: CombatEvent[];
  pendingRound: PendingRound | null;
};
