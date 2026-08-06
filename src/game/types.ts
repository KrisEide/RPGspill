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
  isBoss: boolean;
  stats: CombatStats;
  abilityIds: AbilityId[];
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
  abilityIds: AbilityId[];
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
  abilityIds: AbilityId[];
};

export type CombatAction = {
  actorId: CombatantId;
  abilityId: AbilityId;
  targetId: CombatantId;
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
  amount: number;
  remainingHp: number;
  isCritical: boolean;
};

export type CombatEvent = DamageEvent;

export type RoundOutcomePhase = "selectingActions" | "victory" | "defeat";

export type GamePhase = RoundOutcomePhase | "animating";

export type CombatState = {
  mode: GameMode;
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
