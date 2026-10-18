export type PlayerId = "player1" | "player2";

export type CharacterInstanceId = "character-1" | "character-2";

export type EnemyInstanceId = `enemy-${number}`;

export type CombatantId = CharacterInstanceId | EnemyInstanceId;

export type GameMode = "singlePlayer" | "twoPlayer";

export type InitialLoadout = "run" | "development";
export type RunDifficulty = "normal" | "hardTest";

export type CharacterPresetId = "char1" | "char2";

export type PortraitId =
  | "c1p1"
  | "c1p2"
  | "c1p3"
  | "c2p1"
  | "c2p2"
  | "c2p3";

export type EnemyId =
  | "smallSlime"
  | "greenSlime"
  | "blueSlime"
  | "level1Orc"
  | "orcRaider"
  | "orcMage"
  | "orcWizard"
  | "orcHealer"
  | "orcMauler"
  | "orcGuard"
  | "brakkBoss"
  | "gorakBoss"
  | "goat1"
  | "goat2";

export type EncounterId =
  | "slimeTrail"
  | "growingThreat"
  | "poisonedTrail"
  | "forestAmbush"
  | "orcReinforcements"
  | "spiritCamp"
  | "raiderPatrol"
  | "raiderWarband"
  | "darkMage"
  | "dreadflameRitual"
  | "guardPatrol"
  | "mightAndMending"
  | "forestRest"
  | "orcBrothers"
  | "mountainPass";

export type StatUpgradeId =
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

export type AbilityRewardChoiceId = `ability:${AbilityId}:${AbilityRank}`;

export type GhostAbilityRewardChoiceId = `ghostAbility:${AbilityId}:1`;

export type GhostUpgradeId = "heavyHaunt" | "closerToTheVeil";

export type GhostUpgradeRewardChoiceId = `ghostUpgrade:${GhostUpgradeId}`;

export type SpiritRewardChoiceId = `spirit:${SpiritId}`;
export type SpiritRankRewardChoiceId = `spiritRank:${SpiritId}:2`;

export type PassiveId =
  | "bloodScent"
  | "serratedEdge"
  | "deepWounds"
  | "openWound"
  | "jaggedStrikes"
  | "kindling"
  | "hotterFlames"
  | "wildfire"
  | "flashpoint"
  | "thorns"
  | "protectedCasting"
  | "manaWard"
  | "shelteredRecovery"
  | "triage"
  | "sharedRecovery"
  | "refreshingWaters"
  | "lifeCurrent"
  | "lastingCare"
  | "shieldmate"
  | "leaveItToMe"
  | "battleRhythm"
  | "brace"
  | "counterguard"
  | "bombardier"
  | "luckyHaul"
  | "tailwind"
  | "galeFocus";

export type PassiveCategory =
  | "bleed"
  | "burn"
  | "barrier"
  | "healing"
  | "physical"
  | "coop"
  | "items"
  | "wind";

export type KnownPassives = Partial<Record<PassiveId, true>>;

export type KnownGhostUpgrades = Partial<Record<GhostUpgradeId, true>>;

export type PassiveRewardChoiceId = `passive:${PassiveId}`;

export type RestChoiceId =
  | "rest:recover"
  | "rest:focus"
  | "rest:upgrade";

export type RewardChoiceId =
  | StatUpgradeId
  | AbilityRewardChoiceId
  | GhostAbilityRewardChoiceId
  | GhostUpgradeRewardChoiceId
  | SpiritRewardChoiceId
  | SpiritRankRewardChoiceId
  | PassiveRewardChoiceId
  | RestChoiceId;

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

export type RewardTag =
  | "fire"
  | "water"
  | "earth"
  | "wind"
  | "physical"
  | "magical"
  | "damage"
  | "healing"
  | "barrier"
  | "burn"
  | "bleed"
  | "crit"
  | "pp"
  | "hp"
  | "attack"
  | "defense"
  | "resistance"
  | "agility"
  | "items"
  | "spirit"
  | "ghost"
  | "revive"
  | "cleanse"
  | "debuff"
  | "defend"
  | "aoe"
  | "single_target"
  | "multi_hit"
  | "charge"
  | "quick"
  | "delayed"
  | "damage_over_time"
  | "partner"
  | "same_target"
  | "sacrifice"
  | "low_hp"
  | "kill"
  | "opener"
  | "finisher"
  | "high_cost"
  | "auto_attack"
  | "barrier_break"
  | "normal_reward";

type RewardOfferBase = {
  id: RewardChoiceId;
  icon: string;
  title: string;
  description: string;
  tags: readonly RewardTag[];
};

export type StatRewardOffer = RewardOfferBase & {
  id: StatUpgradeId;
  type: "stat";
  effect: {
    target: StatUpgradeTarget;
    amount: number;
    restoreHp?: number;
    restorePp?: number;
  };
};

export type AbilityRewardOffer = RewardOfferBase & {
  id: AbilityRewardChoiceId;
  type: "newAbility" | "abilityRank";
  abilityId: AbilityId;
  rank: AbilityRank;
  ppCost: number;
  detailedDescription: string;
  scalingDescription: string;
};

export type GhostAbilityRewardOffer = RewardOfferBase & {
  id: GhostAbilityRewardChoiceId;
  type: "newGhostAbility";
  abilityId: AbilityId;
  rank: 1;
  ppCost: number;
  costLabel: string;
  detailedDescription: string;
  scalingDescription: string;
};

export type GhostUpgradeRewardOffer = RewardOfferBase & {
  id: GhostUpgradeRewardChoiceId;
  type: "ghostUpgrade";
  upgradeId: GhostUpgradeId;
};

export type PassiveRewardOffer = RewardOfferBase & {
  id: PassiveRewardChoiceId;
  type: "passive";
  passiveId: PassiveId;
  category: PassiveCategory;
};

export type SpiritRewardOffer = RewardOfferBase & {
  id: SpiritRewardChoiceId;
  type: "newSpirit";
  spiritId: SpiritId;
  passiveName: string;
  passiveShortDescription: string;
  passiveDescription: string;
  activeName: string;
  activeDescription: string;
  activeDetailedDescription: string;
  automaticActive?: boolean;
};

export type SpiritRankRewardOffer = RewardOfferBase & {
  id: SpiritRankRewardChoiceId;
  type: "spiritRank";
  spiritId: SpiritId;
  rank: 2;
  passiveName: string;
  passiveDescription: string;
  activeName: string;
  activeDescription: string;
  automaticActive?: boolean;
};

export type RestRewardOffer = RewardOfferBase & {
  id: RestChoiceId;
  type: "rest";
  effect:
    | {
        type: "restore";
        hp: number;
        pp: number;
      }
    | {
        type: "normalReward";
      };
};

export type RewardOffer =
  | StatRewardOffer
  | AbilityRewardOffer
  | GhostAbilityRewardOffer
  | GhostUpgradeRewardOffer
  | SpiritRewardOffer
  | SpiritRankRewardOffer
  | PassiveRewardOffer
  | RestRewardOffer;

export type RewardOffers = Record<CharacterInstanceId, RewardOffer[]>;

export type Element = "fire" | "water" | "earth" | "wind";

export type DamageType = "physical" | "elemental" | "magical" | "true";

export type ElementalPower = Record<Element, number>;

export type AbilityId =
  | "autoAttack"
  | "defend"
  | "ghostStrike"
  | "ghostBolt"
  | "ghostHeal"
  | "possession"
  | "sacrificialStrike"
  | "lacerate"
  | "fireball"
  | "cinderCurse"
  | "searingBrand"
  | "twinFlames"
  | "rootseed"
  | "earthquake"
  | "stonebreaker"
  | "stoneguard"
  | "fortify"
  | "earthDemon"
  | "crashingWave"
  | "tidalDrain"
  | "restoringCurrent"
  | "magicBag"
  | "healingTide"
  | "stonebloom"
  | "whirlwind"
  | "windSlash"
  | "razorGale"
  | "cyclone"
  | "backwind"
  | "greenSlimeStrongAttack"
  | "greenSlimeBuff"
  | "blueSlimePoisonAttack"
  | "prepareSweep"
  | "orcGruntMultiAttack"
  | "gangStrike"
  | "darkBolt"
  | "shatterWard"
  | "gatherDreadflame"
  | "dreadflame"
  | "mendWounds"
  | "guardRally"
  | "guardShieldCharge"
  | "gorakAutoAttack"
  | "shieldCharge"
  | "wakeUp"
  | "bloodCleave"
  | "smash"
  | "catchBreath"
  | "goatStomp"
  | "goatCharge"
  | "cinderburst"
  | "stoneback"
  | "swiftWing"
  | "riverheart"
  | "warhound"
  | "bodyguard"
  | "bloodpact"
  | "ironquill"
  | "phoenixRebirth";

export type SpiritId =
  | "embertail"
  | "stoneback"
  | "swiftWing"
  | "riverheart"
  | "warhound"
  | "guardDog"
  | "bloodpact"
  | "ironquill"
  | "phoenix";

export type AbilityTarget =
  | "singleEnemy"
  | "allEnemies"
  | "allAllies"
  | "singleAlly"
  | "self";

export type AbilityCategory =
  | "action"
  | "ability"
  | "ghostAbility"
  | "spirit";

export type AbilityRank = 1 | 2;

export type KnownAbilities = Partial<Record<AbilityId, AbilityRank>>;

export type SpiritState = {
  id: SpiritId;
  rank: AbilityRank;
  activeUsesRemaining: number;
  passiveTriggeredThisEncounter: boolean;
  roundPriorityActive: boolean;
  steelDartAbilityBonusStacks: number;
  bloodpactRoles?: {
    sacrificeId: CharacterInstanceId;
    protectedId: CharacterInstanceId;
  } | null;
};

export type KnownSpirits = Partial<Record<SpiritId, SpiritState>>;

export type StatusId =
  | "burn"
  | "poison"
  | "empowered"
  | "cinderCurse"
  | "rootseed"
  | "abilityCharge"
  | "bleed"
  | "cracked"
  | "wet"
  | "exposed"
  | "weakened"
  | "bodyguard"
  | "stunned"
  | "sleeping";

export type ItemId = string;

export type ItemUseTiming = "action" | "quickAction";

export type ItemResolutionTiming = "preRound" | "turn" | "endOfRound";

export type ItemRarity = "common" | "uncommon" | "rare";

export type ItemTarget = AbilityTarget | "singleFallenAlly";

export type ItemEffect =
  | {
      type: "restoreHp";
      amount: number;
    }
  | {
      type: "restoreGhostHp";
      amount: number;
    }
  | {
      type: "directHpLoss";
      amount: number;
    }
  | {
      type: "restorePp";
      amount: number;
    }
  | {
      type: "grantBarrier";
      amount: number;
    }
  | {
      type: "damage";
      amount: number;
      damageType: DamageType;
      element: Element | null;
      usesDamageVariance: boolean;
      canCrit: boolean;
    }
  | {
      type: "nextDamagingAbilityBonus";
      amount: number;
    }
  | {
      type: "cleanse";
      statusIds: StatusId[] | "all";
    }
  | {
      type: "applyStatus";
      statusId: StatusId;
      magnitude?: number;
      durationRounds?: number;
    }
  | {
      type: "revive";
      hp: number;
    };

export type ItemDefinition = {
  id: ItemId;
  name: string;
  menuName: string;
  icon: string;
  shortDescription: string;
  description: string;
  tags: readonly RewardTag[];
  rarity: ItemRarity;
  rewardWeight?: number;
  useTiming: ItemUseTiming;
  resolutionTiming: ItemResolutionTiming;
  target: ItemTarget;
  effects: ItemEffect[];
  ghostUse?: {
    useTiming: ItemUseTiming;
    resolutionTiming: ItemResolutionTiming;
    effects: ItemEffect[];
  };
};

export type Inventory = Record<ItemId, number>;

export type ItemRewards = Record<CharacterInstanceId, ItemId[]>;

export type ItemDamageBonus = {
  amount: number;
  expiresRound: number;
};

export type AbilityDamageBonus = {
  amount: number;
  expiresAfterRound: number;
  sourceId: CharacterInstanceId;
  sourcePassiveId: PassiveId;
};

export type PassiveCombatState = {
  firstHealUsed: boolean;
  tailwindActive: boolean;
  galeFocusLastUsedRound: number | null;
};

export type StatusStackingRule =
  | "refresh"
  | "increaseTickPower"
  | "increaseMagnitude";

export type StatusDefinition = {
  id: StatusId;
  name: string;
  stackingRule: StatusStackingRule;
  maxStacks: number;
  tickPowerIncreasePerApplication?: number;
  maxMagnitude?: number;
  stackingScope?: "target" | "source";
  persistsUntilCombatEnd?: boolean;
  durationRounds?: number;
  endOfRoundDamage?: {
    basePower: number;
    damageType: DamageType;
    element: Element | null;
    ignoresMitigation?: boolean;
  };
  incomingDamageModifier?: {
    multiplier: number;
    triggeringAttacker: "sourcePartner";
    consumeOnTrigger: true;
  };
  outgoingDamageModifier?: {
    operation: "increase" | "decrease";
    consumeOnNextDamageAction: boolean;
  };
  defensiveStatReduction?: {
    defense: number;
    resistance: number;
  };
};

export type ActiveStatus = {
  id: StatusId;
  sourceId: CombatantId;
  appliedRound: number;
  magnitude?: number;
  remainingRounds?: number;
  fullDurationRounds?: number;
  tickBasePower?: number;
  healingReceivedMultiplier?: number;
  ticksTriggered?: number;
  sourceHealingPerTick?: number;
  empowerAfterTicks?: number;
  empoweredTickBasePower?: number;
  empoweredSourceHealingPerTick?: number;
  readiedAbilityId?: AbilityId;
  readiedTargetId?: CombatantId;
};

export type PassiveDefinition = {
  id: PassiveId;
  name: string;
  icon: string;
  category: PassiveCategory;
  tags: readonly RewardTag[];
  description: string;
  unique: true;
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
      sourceId?: CombatantId;
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
    chance?: number;
    durationRounds?: number;
    triggerTickIfNew?: boolean;
    triggerTickIfAlreadyActive?: boolean;
  };
  statusOnHpDamage?: {
    statusId: StatusId;
    magnitude?: number;
    chance?: number;
  };
  spreadStatus?: {
    statusId: StatusId;
    maxAdditionalTargets: number;
  };
  healingFromDamage?: {
    ratio: number;
    target: "self" | "secondaryTarget";
  };
  partnerElementDamageBonus?: {
    element: Element;
    multiplier: number;
  };
  twinFlamesCombo?: {
    fire: {
      basePower: number;
      elementalPowerScaling: number;
    };
    water: {
      partyHealing: number;
      cleanseStatusId: "burn";
    };
    earth: {
      barrierRemoval: number;
    };
    wind: {
      additionalEnemy: true;
    };
    ghost: {
      healing: number;
    };
  };
  twinFlamesFollowUp?: boolean;
  targetRule?: "randomOtherEnemy";
  retargetOnDefeat?: boolean;
  multiHitIndex?: number;
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

export type ApplyStatusEffect = {
  type: "applyStatus";
  statusId: StatusId;
  tickBasePower: number;
  elementalPowerScaling: number;
  magnitude?: number;
  healingReceivedMultiplier?: number;
  sourceHealingPerTick?: number;
  empowerAfterTicks?: number;
  empoweredTickBasePower?: number;
  empoweredSourceHealingPerTick?: number;
};

export type GhostHealingEffect = {
  type: "ghostHealing";
  amount: number;
};

export type GhostRecoveryOnHitEffect = {
  type: "ghostRecoveryOnHit";
  amount: number;
  ppAmount?: number;
};

export type GhostHpCostEffect = {
  type: "ghostHpCost";
  amount: number;
};

export type SelfHpDamageEffect = {
  type: "selfHpDamage";
  amount: number;
  timing: "afterDamage";
};

export type GrantAdditionalActionEffect = {
  type: "grantAdditionalAction";
};

export type BarrierEffect = {
  type: "barrier";
  amount: number;
  elementalPowerScaling?: number;
  bonusIfNoBarrier?: number;
};

export type RemoveBarrierEffect = {
  type: "removeBarrier";
};

export type CleanseEffect = {
  type: "cleanse";
  statusId: StatusId;
};

export type ChargeEffect = {
  type: "charge";
  readiesAbilityId: AbilityId;
};

export type WakeEnemyEffect = {
  type: "wakeEnemy";
  enemyId: EnemyId;
};

export type WaitEffect = {
  type: "wait";
  cleansesDamageStatuses?: boolean;
};

export type GainRandomItemEffect = {
  type: "gainRandomItem";
  pool: "normal";
  drawCount?: number;
  bonusDrawChance?: number;
};

export type CountAsItemUseEffect = {
  type: "countAsItemUse";
  itemId: ItemId;
  count: number;
};

export type SummonEarthDemonEffect = {
  type: "summonEarthDemon";
  baseHp: number;
  hpScaling: number;
  attackBasePower: number;
  attackScaling: number;
};

export type GoatStompMarkEffect = {
  type: "goatStompMark";
};

export type AbilityEffect =
  | { type: "bloodpact"; hpCost: number; barrierAmount: number }
  | DamageEffect
  | DefendEffect
  | HealingEffect
  | ApplyStatusEffect
  | GhostHealingEffect
  | GhostRecoveryOnHitEffect
  | GhostHpCostEffect
  | SelfHpDamageEffect
  | GrantAdditionalActionEffect
  | BarrierEffect
  | RemoveBarrierEffect
  | CleanseEffect
  | ChargeEffect
  | WakeEnemyEffect
  | WaitEffect
  | GainRandomItemEffect
  | CountAsItemUseEffect
  | SummonEarthDemonEffect
  | GoatStompMarkEffect;

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
  useTiming?: "action" | "quickAction";
  turnOrderRule?: "alwaysLast" | "absoluteLast";
  target: AbilityTarget;
  secondaryTarget?: AbilityTarget;
  element: Element | null;
  aiTargeting?:
    | "randomLivingCharacter"
    | "lowestHpPercentageLivingAlly";
  ranks: {
    1: AbilityRankDefinition;
    2?: AbilityRankTwoDefinition;
  };
};

export type SpiritPassiveDefinition = {
  name: string;
  shortDescription: string;
  description: string;
  firstDamageActionEachEncounter?: {
    basePower: number;
    damageType: DamageType;
    element: Element;
    elementalPowerScaling: number;
    statusOnHit?: StatusId;
  };
  firstBarrierGainEachEncounter?: {
    additionalBarrier: number;
  };
  roundStartTurnPriority?: {
    chance: number;
    resolutionPriority: number;
  };
  allHealingReceived?: {
    flatIncrease: number;
  };
  firstAutoAttackEachEncounterIsQuick?: true;
  firstAutoAttackDamageMultiplier?: number;
  nonDamagingActionSpiritAttack?: {
    basePower: number;
    damageType: DamageType;
  };
  bodyguardCounterDamage?: number;
  steelDartAbilityAmplifier?: {
    damageBonusPerDart: number;
  };
  roundStartBloodpact?: { hpCost: number; barrierAmount: number };
  roundStartHealing?: { amount: number };
  phoenixTonicReviveBonus?: { amount: number };
};

export type SpiritDefinition = {
  id: SpiritId;
  name: string;
  icon: string;
  element: Element | null;
  tags: readonly RewardTag[];
  passive: SpiritPassiveDefinition;
  rankTwoPassive: SpiritPassiveDefinition;
  activeAbilityId: AbilityId;
  activeUsesPerEncounter: number;
  automaticActive?: true;
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
  targetingPattern?: "splitThenAlternate";
  randomActionPattern?: {
    abilityIds: AbilityId[];
    preventImmediateRepeat: boolean;
    startsAfterRound?: number;
  };
  actionPattern?: AbilityId[];
  openingActionPattern?: Array<AbilityId | null>;
  repeatingActionPattern?: Array<AbilityId | null>;
  startsSleeping?: boolean;
  wakesOnRound?: number;
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
  orcMageDarkBoltsSinceShatter?: number;
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
  initialLoadout: InitialLoadout;
  difficulty?: RunDifficulty;
  randomSeed: number;
  startingEncounterId?: EncounterId;
  developmentStartInGhostForm?: boolean;
  developmentPassives?: Partial<
    Record<CharacterInstanceId, PassiveId[]>
  >;
  players: Record<PlayerId, PlayerSetup>;
};

export type CharacterState = CharacterDraft & {
  instanceId: CharacterInstanceId;
  ownerId: PlayerId;
  level: number;
  form: "living" | "ghost" | "permanentlyDead";
  hp: number;
  pp: number;
  savedLivingPp: number | null;
  ghostReformReady: boolean;
  soulLinkActive: boolean;
  barrier: number;
  stats: CombatStats;
  abilityRanks: KnownAbilities;
  ghostAbilityRanks: KnownAbilities;
  ghostUpgrades: KnownGhostUpgrades;
  passives: KnownPassives;
  passiveCombatState: PassiveCombatState;
  spirits: KnownSpirits;
  inventory: Inventory;
  remainingItemRewardPool: ItemId[];
  magicBagLastUsedRound: number | null;
  itemDamageBonus: ItemDamageBonus | null;
  abilityDamageBonus: AbilityDamageBonus | null;
  statuses: ActiveStatus[];
};

export type CharacterEventState = Pick<
  CharacterState,
  | "form"
  | "pp"
  | "savedLivingPp"
  | "ghostReformReady"
  | "soulLinkActive"
  | "statuses"
>;

export type AbilityCombatAction = {
  kind: "ability";
  actorId: CombatantId;
  abilityId: AbilityId;
  targetId: CombatantId | null;
  secondaryTargetId?: CombatantId | null;
  isChargeRelease?: boolean;
};

export type ItemCombatAction = {
  kind: "item";
  actorId: CharacterInstanceId;
  itemId: ItemId;
  targetId: CombatantId | null;
};

export type CombatAction = AbilityCombatAction | ItemCombatAction;

export type CharacterRoundSelection = {
  action: CombatAction | null;
  bonusAction: CombatAction | null;
  quickActions: CombatAction[];
};

export type RoundSelections = Record<
  CharacterInstanceId,
  CharacterRoundSelection
>;

export type PlayerState = {
  id: PlayerId;
  controlledCharacterId: CharacterInstanceId;
};

export type EnemyIntent = {
  abilityId: AbilityId;
  targetId: CombatantId | null;
  targetIds: CombatantId[];
  isChargeRelease?: boolean;
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
  characterState?: CharacterEventState;
  reflectedDamage?: ReflectedDamage;
  actorHealingAmount?: number;
  actorPpRecoveryAmount?: number;
  actorRemainingHp?: number;
  actorCharacterState?: CharacterEventState;
  linkedSupportImpact?: MultiTargetSupportImpact;
  linkedSecondarySupportImpacts?: MultiTargetSupportImpact[];
  twinFlamesElement?: Element | null;
  twinFlamesFollowUp?: boolean;
  twinFlamesGhostPartnerId?: CharacterInstanceId;
  backwindBonus?: boolean;
  barrierRemovedBeforeHit?: number;
  multiHitIndex?: number;
};

export type SelfDamageEvent = {
  type: "selfDamage";
  actorId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  amount: number;
  remainingHp: number;
  absorbedByBarrier: 0;
  isCritical: false;
  statusChanges: StatusChange[];
  characterState: CharacterEventState;
};

export type ReflectedDamage = {
  sourceId: CharacterInstanceId;
  targetId: CombatantId;
  passiveIds: Array<"thorns" | "counterguard" | "guardDog">;
  amount: number;
  remainingHp: number;
  absorbedByBarrier: number;
  remainingBarrier: number;
  statusChanges: StatusChange[];
};

export type DefendEvent = {
  type: "defend";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  barrierAmount: number;
  remainingBarrier: number;
};

export type ManaWardEvent = {
  type: "manaWard";
  actorId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  passiveId: "manaWard";
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  barrierAmount: number;
  remainingBarrier: number;
};

export type TailwindEvent = {
  type: "tailwind";
  actorId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  passiveId: "tailwind";
  active: boolean;
  rearmed: boolean;
};

export type ChargeEvent = {
  type: "charge";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  readiedAbilityId: AbilityId;
  statusChanges: StatusChange[];
};

export type WakeEvent = {
  type: "wake";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  statusChanges: StatusChange[];
};

export type WaitEvent = {
  type: "wait";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  statusChanges: StatusChange[];
};

export type SkipTurnEvent = {
  type: "skipTurn";
  actorId: CombatantId;
  targetId: CombatantId;
  reason: "stunned" | "chargeTargetUnavailable";
  skippedAbilityId?: AbilityId;
  skippedItemId?: ItemId;
  statusChanges: StatusChange[];
};

export type MultiTargetDamageImpact = {
  targetId: CombatantId;
  amount: number;
  remainingHp: number;
  absorbedByBarrier: number;
  remainingBarrier: number;
  isCritical: boolean;
  statusChanges: StatusChange[];
  characterState?: CharacterEventState;
  reflectedDamage?: ReflectedDamage;
};

export type MultiTargetDamageEvent = {
  type: "multiTargetDamage";
  actorId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  impacts: MultiTargetDamageImpact[];
};

export type BarrierRemovedEvent = {
  type: "barrierRemoved";
  actorId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  impacts: Array<{
    targetId: CharacterInstanceId;
    barrierRemoved: number;
    remainingBarrier: 0;
  }>;
};

export type StatusDamageEvent = {
  type: "statusDamage";
  sourceId: CombatantId;
  targetId: CombatantId;
  statusId: StatusId;
  element: Element | null;
  amount: number;
  remainingHp: number;
  isCritical: false;
  statusChanges: StatusChange[];
  characterState?: CharacterEventState;
  sourceHealingAmount?: number;
  sourceRemainingHp?: number;
  sourceCharacterState?: CharacterEventState;
};

export type StatusAppliedEvent = {
  type: "statusApplied";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  statusChanges: StatusChange[];
};

export type SpiritDamageEvent = {
  type: "spiritDamage";
  sourceId: CharacterInstanceId;
  targetId: CombatantId;
  spiritId: SpiritId;
  damageType: DamageType;
  element: Element | null;
  amount: number;
  remainingHp: number;
  absorbedByBarrier: number;
  remainingBarrier: number;
  isCritical: false;
  statusChanges: StatusChange[];
};

export type SupportEvent = {
  type: "support";
  actorId: CombatantId;
  targetId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  healingAmount: number;
  remainingHp: number;
  barrierAmount: number;
  remainingBarrier: number;
  ppRestored?: number;
  remainingPp?: number;
  statusChanges: StatusChange[];
  characterState?: CharacterEventState;
  actorRemainingHp?: number;
  actorCharacterState?: CharacterEventState;
  secondaryImpacts?: MultiTargetSupportImpact[];
  gainedItemId?: ItemId;
  gainedItemQuantity?: number;
  gainedItemIds?: ItemId[];
};

export type MultiTargetSupportImpact = Omit<
  SupportEvent,
  "type" | "actorId" | "abilityId" | "abilityRank" | "secondaryImpacts"
>;

export type MultiTargetSupportEvent = {
  type: "multiTargetSupport";
  actorId: CombatantId;
  abilityId: AbilityId;
  abilityRank: AbilityRank;
  impacts: MultiTargetSupportImpact[];
  secondaryImpacts?: MultiTargetSupportImpact[];
};

export type ItemUseImpact = {
  targetId: CombatantId;
  damageAmount: number;
  absorbedByBarrier: number;
  healingAmount: number;
  ppRestored: number;
  barrierAmount: number;
  remainingHp: number;
  remainingPp: number;
  remainingBarrier: number;
  revived: boolean;
  statusChanges: StatusChange[];
  characterState?: CharacterEventState;
};

export type ItemUseEvent = {
  type: "itemUse";
  actorId: CharacterInstanceId;
  itemId: ItemId;
  targetId: CombatantId | null;
  visualPhase: "activation" | "impact";
  impacts: ItemUseImpact[];
  remainingQuantity: number;
  damageBonus: ItemDamageBonus | null;
};

export type BloodpactEvent = {
  type: "bloodpact";
  actorId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  abilityId: "bloodpact";
  abilityRank: 1;
  stage: "sacrifice" | "protected";
  active: boolean;
  hpLoss: number;
  barrierAmount: number;
  remainingHp: number;
  remainingBarrier: number;
  characterState: CharacterEventState;
  secondaryImpacts?: MultiTargetSupportImpact[];
};

export type SoulTransferEvent = {
  type: "soulTransfer";
  ghostId: CharacterInstanceId;
  targetId: CharacterInstanceId;
  ghostHpLost: number;
  targetHpRestored: number;
  ghostRemainingHp: number;
  targetRemainingHp: number;
  ghostCharacterState: CharacterEventState;
  targetCharacterState: CharacterEventState;
};

export type PhoenixRebirthEvent = {
  type: "phoenixRebirth";
  targetId: CharacterInstanceId;
  remainingHp: number;
  remainingBarrier: number;
  phoenixActiveUsesRemaining: number;
  characterState: CharacterEventState;
};

export type PostCombatRecoveryEvent = {
  type: "postCombatRecovery";
  impacts: Array<{
    targetId: CharacterInstanceId;
    hpRestored: number;
    ppRestored: number;
    remainingHp: number;
    remainingPp: number;
  }>;
};

export type EarthDemonState = {
  ownerId: CharacterInstanceId;
  rank: AbilityRank;
  hp: number;
  maxHp: number;
  attackPower: number;
};

export type EarthDemonEvent =
  | {
      type: "earthDemonSummoned";
      actorId: CharacterInstanceId;
      targetId: CharacterInstanceId;
      abilityId: "earthDemon";
      abilityRank: AbilityRank;
      summon: EarthDemonState;
    }
  | {
      type: "earthDemonHit";
      actorId: CombatantId;
      targetId: CharacterInstanceId;
      abilityId: AbilityId;
      abilityRank: AbilityRank;
      amount: number;
      remainingHp: number;
      maxHp: number;
      destroyed: boolean;
    }
  | {
      type: "earthDemonAttack";
      actorId: CharacterInstanceId;
      targetId: CombatantId;
      abilityId: "earthDemon";
      abilityRank: AbilityRank;
      amount: number;
      remainingHp: number;
      absorbedByBarrier: number;
      remainingBarrier: number;
    };

export type CombatEvent =
  | BloodpactEvent
  | SoulTransferEvent
  | PhoenixRebirthEvent
  | PostCombatRecoveryEvent
  | EarthDemonEvent
  | BarrierRemovedEvent
  | DamageEvent
  | SelfDamageEvent
  | MultiTargetDamageEvent
  | StatusDamageEvent
  | StatusAppliedEvent
  | SpiritDamageEvent
  | SupportEvent
  | MultiTargetSupportEvent
  | ItemUseEvent
  | ManaWardEvent
  | TailwindEvent
  | DefendEvent
  | ChargeEvent
  | WakeEvent
  | WaitEvent
  | SkipTurnEvent;

export type RoundOutcomePhase =
  | "selectingBloodpact"
  | "selectingActions"
  | "victory"
  | "defeat"
  | "rest";

export type GamePhase = RoundOutcomePhase | "animating";

export type CombatState = {
  mode: GameMode;
  difficulty: RunDifficulty;
  encounterId: EncounterId;
  randomSeed: number;
  round: number;
  phase: RoundOutcomePhase;
  players: Record<PlayerId, PlayerState>;
  characters: Record<CharacterInstanceId, CharacterState>;
  enemies: EnemyState[];
  enemyIntents: Partial<Record<EnemyInstanceId, EnemyIntent>>;
  restStage: "choice" | "upgrade" | "complete" | null;
  actTransitionStage: "spiritRank2" | "restoration" | null;
  rewardOffers: RewardOffers | null;
  itemRewards: ItemRewards | null;
  earthDemon: EarthDemonState | null;
};

export type RoundResult = {
  nextState: CombatState;
  events: CombatEvent[];
};

export type PendingRound = {
  result: RoundResult;
  nextEventIndex: number;
  currentEventApplied: boolean;
  preserveRoundSelections?: boolean;
};

export type ClientBattleState = {
  combat: CombatState;
  phase: GamePhase;
  roundSelections: RoundSelections;
  lastRoundEvents: CombatEvent[];
  pendingRound: PendingRound | null;
};
