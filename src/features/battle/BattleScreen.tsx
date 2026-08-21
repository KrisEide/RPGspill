import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { ITEM_DEFINITIONS } from "../../data/items";
import {
  getSpiritForActiveAbility,
  SPIRIT_DEFINITIONS,
} from "../../data/spirits";
import CommandBar from "./components/CommandBar";
import CombatLog from "./components/CombatLog";
import DamageNumber from "./components/DamageNumber";
import PartyStatusPanel from "./components/PartyStatusPanel";
import UpgradeSelection from "./components/UpgradeSelection";
import { CHARACTER_VISUALS } from "./data/characterVisuals";
import { ABILITY_VISUALS } from "./data/abilityVisuals";
import { ENEMY_VISUALS } from "./data/enemyVisuals";
import { ENCOUNTER_VISUALS } from "./data/encounterVisuals";
import { getEnemyFormationPositions } from "./layout/enemyFormation";
import {
  createClientBattleState,
  createInitialGameState,
} from "../../game/state/initialState";
import { gameReducer } from "../../game/state/gameReducer";
import { startEncounter } from "../../game/state/encounterState";
import {
  applyRewardChoices,
  getRewardParticipantCharacterIds,
} from "../../game/rewards/rewardSystem";
import { getEffectiveAbilityPpCost } from "../../game/passives/passiveSystem";
import { getInventoryEntries } from "../../game/items/itemSystem";
import { resolveImmediateItemUse } from "../../game/combat/resolveRound";
import {
  GHOST_MAX_HP,
  isGhostAbilityId,
  reformGhost,
} from "../../game/ghost/ghostSystem";
import {
  isEnemySleeping,
  isEnemyTargetable,
} from "../../game/combat/targeting";
import {
  getAbilityScalingDescription,
  getKnownAbilityIds,
  getKnownAbilityRank,
  hasKnownAbilityInCategory,
  resolveAbility,
} from "../../game/abilities/abilityProgression";
import {
  isCharacterInstanceId,
  PLAYER_ORDER,
} from "../../game/playerControl";
import { getPortraitSource } from "../characterSelect/data/characterOptions";
import {
  submitMultiplayerAction,
  submitMultiplayerItem,
  submitMultiplayerReform,
  submitMultiplayerUpgrade,
  subscribeToEncounterStarted,
  subscribeToImmediateItemResolved,
  subscribeToGhostReformed,
  subscribeToPlayerReadiness,
  subscribeToRewardStageUpdated,
  subscribeToRoundResolved,
  subscribeToUpgradeReadiness,
} from "../../network/socket";
import type {
  PlayerReadinessState,
  UpgradeReadinessState,
} from "../../network/protocol";
import type {
  AbilityId,
  CharacterInstanceId,
  ClientBattleState,
  CombatEvent,
  CombatState,
  CombatantId,
  EnemyInstanceId,
  GameSetup,
  ItemId,
  ItemUseEvent,
  PlayerId,
  RewardChoiceId,
  CharacterState,
} from "../../game/types";

type Props =
  | {
      setup: GameSetup;
    }
  | {
      initialCombatState: CombatState;
      localPlayerId: PlayerId;
    };

const COMBAT_IMPACT_DELAY_MS = 550;
const COMBAT_EVENT_DURATION_MS = 2100;
const DEFEND_EFFECT_DELAY_MS = 250;
const DEFEND_EVENT_DURATION_MS = 1450;
const BACKGROUND_REVEAL_DURATION_MS = 600;
const ENCOUNTER_ANNOUNCEMENT_DURATION_MS = 3600;
const COMBAT_ENTRANCE_DURATION_MS = 2600;

type EncounterIntroPhase =
  | "background"
  | "announcement"
  | "entering"
  | "ready";

type ProjectilePath = {
  key: string;
  spriteSrc: string;
  variant: "fire" | "dark" | "wind";
  width: number;
  durationMs: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
};

function createBattleScreenState(props: Props): ClientBattleState {
  return "setup" in props
    ? createInitialGameState(props.setup)
    : createClientBattleState(props.initialCombatState);
}

function getDamageImpactForTarget(
  event: CombatEvent | null,
  targetId: CombatantId,
) {
  if (event?.type === "damage") {
    if (event.targetId === targetId) return event;
    return event.reflectedDamage?.targetId === targetId
      ? {
          ...event.reflectedDamage,
          isCritical: false as const,
          statusChanges: [],
        }
      : null;
  }

  if (event?.type === "statusDamage") {
    return event.targetId === targetId ? event : null;
  }

  if (event?.type === "spiritDamage") {
    return event.targetId === targetId ? event : null;
  }

  if (event?.type === "multiTargetDamage") {
    const impact = event.impacts.find((candidate) => candidate.targetId === targetId);
    if (impact) return impact;
    const reflected = event.impacts.find(
      (candidate) => candidate.reflectedDamage?.targetId === targetId,
    )?.reflectedDamage;
    return reflected
      ? { ...reflected, isCritical: false as const, statusChanges: [] }
      : null;
  }

  if (event?.type === "itemUse") {
    const impact = event.impacts.find(
      (candidate) => candidate.targetId === targetId,
    );

    return impact &&
      (impact.damageAmount > 0 || impact.absorbedByBarrier > 0)
      ? {
          ...impact,
          amount: impact.damageAmount,
          isCritical: false,
        }
      : null;
  }

  return null;
}

function getSupportImpactForTarget(
  event: CombatEvent | null,
  targetId: CombatantId,
) {
  if (event?.type === "support") {
    if (event.targetId === targetId) return event;
    return (
      event.secondaryImpacts?.find(
        (candidate) => candidate.targetId === targetId,
      ) ?? null
    );
  }

  if (event?.type === "multiTargetSupport") {
    const impact = event.impacts.find(
      (candidate) => candidate.targetId === targetId,
    );

    const resolvedImpact =
      impact ??
      event.secondaryImpacts?.find(
        (candidate) => candidate.targetId === targetId,
      );
    return resolvedImpact
      ? { ...resolvedImpact, abilityId: event.abilityId }
      : null;
  }

  if (event?.type === "itemUse") {
    const impact = event.impacts.find(
      (candidate) => candidate.targetId === targetId,
    );

    return impact &&
      (impact.healingAmount > 0 ||
        impact.ppRestored > 0 ||
        impact.barrierAmount > 0 ||
        impact.revived)
      ? { ...impact, itemId: event.itemId }
      : null;
  }

  return null;
}

function getProjectileOrigin(
  event: CombatEvent | null,
  combatState: CombatState,
) {
  if (event?.type !== "damage") {
    return null;
  }

  if (isCharacterInstanceId(event.actorId)) {
    const presetId = combatState.characters[event.actorId].presetId;
    return CHARACTER_VISUALS[presetId].projectileOrigins[event.abilityId];
  }

  const enemy = combatState.enemies.find(
    (candidate) => candidate.instanceId === event.actorId,
  );

  return enemy
    ? ENEMY_VISUALS[enemy.enemyId].projectileOrigins?.[event.abilityId]
    : null;
}

function resolveCharacterAction(
  character: CharacterState,
  abilityId: AbilityId,
) {
  if (character.form === "ghost") {
    return isGhostAbilityId(abilityId)
      ? resolveAbility(abilityId, 1)
      : null;
  }

  if (character.form !== "living") {
    return null;
  }

  const rank = getKnownAbilityRank(character.abilityRanks, abilityId);
  const spirit = getSpiritForActiveAbility(character.spirits, abilityId);

  return rank
    ? resolveAbility(abilityId, rank)
    : spirit
      ? resolveAbility(abilityId, 1)
      : null;
}

export default function BattleScreen(props: Props) {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    props,
    createBattleScreenState,
  );
  const [selectedAbilityId, setSelectedAbilityId] =
    useState<AbilityId | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const [immediateItemEvent, setImmediateItemEvent] =
    useState<ItemUseEvent | null>(null);
  const [queuedItemState, setQueuedItemState] = useState<{
    scope: string;
    counts: Record<ItemId, number>;
  }>({ scope: "", counts: {} });
  const [playerReadiness, setPlayerReadiness] =
    useState<PlayerReadinessState | null>(null);
  const [upgradeReadiness, setUpgradeReadiness] =
    useState<UpgradeReadinessState | null>(null);
  const [localUpgradeChoiceId, setLocalUpgradeChoiceId] =
    useState<RewardChoiceId | null>(null);
  const [singlePlayerUpgradeSelections, setSinglePlayerUpgradeSelections] =
    useState<Record<CharacterInstanceId, RewardChoiceId | null>>({
      "character-1": null,
      "character-2": null,
    });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [loadedBackgroundSrc, setLoadedBackgroundSrc] = useState<
    string | null
  >(null);
  const [encounterIntroState, setEncounterIntroState] = useState<{
    encounterId: CombatState["encounterId"];
    phase: EncounterIntroPhase;
  }>({
    encounterId: gameState.combat.encounterId,
    phase: "background",
  });
  const [projectilePath, setProjectilePath] =
    useState<ProjectilePath | null>(null);
  const battleSceneRef = useRef<HTMLDivElement>(null);
  const combatantElementRefs = useRef(
    new Map<CombatantId, HTMLDivElement>(),
  );
  const isMultiplayer = "localPlayerId" in props;
  const localPlayerId = isMultiplayer ? props.localPlayerId : null;
  const combatState = gameState.combat;
  const encounterIntroPhase =
    encounterIntroState.encounterId === combatState.encounterId
      ? encounterIntroState.phase
      : "background";
  const itemQueueScope = `${combatState.encounterId}:${combatState.round}`;
  const queuedItemCounts =
    queuedItemState.scope === itemQueueScope ? queuedItemState.counts : {};
  const encounter = ENCOUNTER_DEFINITIONS[combatState.encounterId];
  const battleBackground =
    ENCOUNTER_VISUALS[combatState.encounterId].backgroundImageSrc;
  const backgroundReady = loadedBackgroundSrc === battleBackground;
  const nextEncounterId = encounter.nextEncounterId;
  const localCharacterId = localPlayerId
    ? combatState.players[localPlayerId].controlledCharacterId
    : null;
  const localCharacter = localCharacterId
    ? combatState.characters[localCharacterId]
    : null;
  const isRest = gameState.phase === "rest";
  const upgradeSelectionIsActive =
    (gameState.phase === "victory" && nextEncounterId !== null) ||
    (isRest && combatState.restStage !== "complete");
  const singlePlayerUpgradePlayerId = !isMultiplayer
    ? (PLAYER_ORDER.find((playerId) => {
        const characterId =
          combatState.players[playerId].controlledCharacterId;
        return (
          (combatState.rewardOffers?.[characterId].length ?? 0) > 0 &&
          singlePlayerUpgradeSelections[characterId] === null
        );
      }) ?? null)
    : null;
  const upgradeCharacterId = isMultiplayer
    ? localCharacterId &&
      (combatState.rewardOffers?.[localCharacterId].length ?? 0) > 0
      ? localCharacterId
      : null
    : singlePlayerUpgradePlayerId
      ? combatState.players[singlePlayerUpgradePlayerId].controlledCharacterId
      : null;
  const upgradeCharacter = upgradeCharacterId
    ? combatState.characters[upgradeCharacterId]
    : null;
  const upgradeChoices = upgradeCharacterId
    ? (combatState.rewardOffers?.[upgradeCharacterId] ?? [])
    : [];
  const upgradeSelectedChoiceId = isMultiplayer
    ? localUpgradeChoiceId
    : upgradeCharacterId
      ? singlePlayerUpgradeSelections[upgradeCharacterId]
      : null;
  const otherPlayerUpgradeReady = Boolean(
    isMultiplayer &&
      upgradeReadiness?.completedEncounterId ===
        combatState.encounterId &&
      upgradeReadiness.readyPlayerIds.some(
        (playerId) => playerId !== localPlayerId,
      ),
  );
  const localPlayerReady = Boolean(
    localCharacter &&
      localPlayerId &&
      (localCharacter.hp <= 0 ||
        (playerReadiness?.round === combatState.round &&
          playerReadiness.readyPlayerIds.includes(localPlayerId))),
  );
  const encounterIntroComplete = encounterIntroPhase === "ready";
  const activePlayerId =
    encounterIntroComplete && gameState.phase === "selectingActions"
      ? isMultiplayer
        ? localPlayerReady
          ? null
          : localPlayerId
        : (PLAYER_ORDER.find(
            (playerId) => {
              const characterId =
                combatState.players[playerId].controlledCharacterId;

              return (
                combatState.characters[characterId].hp > 0 &&
                gameState.roundSelections[characterId].action === null
              );
            },
          ) ?? null)
      : null;
  const activeCharacterId = activePlayerId
    ? combatState.players[activePlayerId].controlledCharacterId
    : null;
  const activeCharacter = activeCharacterId
    ? combatState.characters[activeCharacterId]
    : null;
  const commandCharacter = isMultiplayer
    ? localCharacter
    : (activeCharacter ?? combatState.characters["character-1"]);
  const abilitiesAvailable = commandCharacter
    ? commandCharacter.form === "living" &&
      hasKnownAbilityInCategory(commandCharacter.abilityRanks, "ability")
    : false;
  const knownAbilities = commandCharacter
    ? getKnownAbilityIds(commandCharacter.abilityRanks).flatMap(
        (abilityId) => {
          const rank = getKnownAbilityRank(
            commandCharacter.abilityRanks,
            abilityId,
          );
          const ability = rank ? resolveAbility(abilityId, rank) : null;
          const visuals = ABILITY_VISUALS[abilityId];
          const ppCost = ability
            ? getEffectiveAbilityPpCost(
                commandCharacter,
                ability.category,
                ability.ppCost,
              )
            : 0;

          return ability?.category === "ability"
            ? [
                {
                  id: ability.id,
                  name: ability.name,
                  shortDescription: ability.shortDescription,
                  description: ability.description,
                  scalingDescription:
                    getAbilityScalingDescription(ability),
                  ppCost,
                  rank: ability.rank,
                  icon: visuals?.icon ?? "✦",
                  available: commandCharacter.pp >= ppCost,
                },
              ]
            : [];
        },
      )
    : [];
  const spiritAvailable = commandCharacter
    ? commandCharacter.form === "living" &&
      Object.values(commandCharacter.spirits).some(Boolean)
    : false;
  const knownSpirits = commandCharacter
    ? Object.values(commandCharacter.spirits).flatMap((spirit) => {
        if (!spirit) {
          return [];
        }

        const definition = SPIRIT_DEFINITIONS[spirit.id];
        const active = resolveAbility(definition.activeAbilityId, 1);

        return active
          ? [
              {
                id: definition.id,
                name: definition.name,
                icon: definition.icon,
                passiveName: definition.passive.name,
                passiveDescription: definition.passive.description,
                activeAbilityId: definition.activeAbilityId,
                activeName: active.name,
                activeShortDescription: active.shortDescription,
                activeDescription: active.description,
                usesRemaining: spirit.activeUsesRemaining,
              },
            ]
          : [];
      })
    : [];
  const inventoryItems = commandCharacter
    ? commandCharacter.form === "living"
      ? getInventoryEntries(commandCharacter.inventory).map(
        ({ definition, quantity }) => ({
          id: definition.id,
          name: definition.name,
          menuName: definition.menuName,
          icon: definition.icon,
          description: definition.description,
          quantity: Math.max(
            0,
            quantity - (queuedItemCounts[definition.id] ?? 0),
          ),
          useTiming: definition.useTiming,
        }),
        )
      : []
    : [];
  const currentCombatEvent = gameState.pendingRound
    ? gameState.pendingRound.result.events[
        gameState.pendingRound.nextEventIndex
      ]
    : null;
  const currentAbilityVisuals =
    currentCombatEvent?.type === "damage" ||
    currentCombatEvent?.type === "multiTargetDamage" ||
    currentCombatEvent?.type === "support" ||
    currentCombatEvent?.type === "multiTargetSupport" ||
    currentCombatEvent?.type === "charge" ||
    currentCombatEvent?.type === "wake" ||
    currentCombatEvent?.type === "wait"
      ? ABILITY_VISUALS[currentCombatEvent.abilityId]
      : null;
  const projectileOrigin = getProjectileOrigin(
    currentCombatEvent,
    combatState,
  );
  const appliedCombatEvent = gameState.pendingRound?.currentEventApplied
    ? currentCombatEvent
    : null;
  const displayedImpactEvent = appliedCombatEvent ?? immediateItemEvent;
  const appliedEventCount = gameState.pendingRound
    ? gameState.pendingRound.nextEventIndex +
      (gameState.pendingRound.currentEventApplied ? 1 : 0)
    : 0;
  const defendingCombatantIds = new Set(
    gameState.pendingRound?.result.events
      .slice(0, appliedEventCount)
      .filter((event) => event.type === "defend")
      .map((event) => event.targetId) ?? [],
  );
  const enemyFormationPositions =
    ENCOUNTER_VISUALS[combatState.encounterId].enemyFormation ??
    getEnemyFormationPositions(combatState.enemies);
  const currentBattlefieldEffect =
    currentCombatEvent?.type === "multiTargetDamage" ||
    currentCombatEvent?.type === "multiTargetSupport"
      ? currentAbilityVisuals?.battlefieldEffect
      : null;
  const battlefieldEffectPositions =
    currentCombatEvent?.type === "multiTargetDamage"
      ? currentCombatEvent.impacts.flatMap((impact) => {
          const targetIndex = combatState.enemies.findIndex(
            (enemy) => enemy.instanceId === impact.targetId,
          );
          const targetEnemy = combatState.enemies[targetIndex];

          return targetIndex >= 0 && targetEnemy
            ? [
                {
                  position: enemyFormationPositions[targetIndex],
                  impactAnchor:
                    ENEMY_VISUALS[targetEnemy.enemyId].impactAnchor,
                },
              ]
            : [];
        })
      : [];
  const battlefieldEffectCenter =
    battlefieldEffectPositions.length > 0
      ? {
          xPercent:
            battlefieldEffectPositions.reduce(
              (sum, entry) => sum + entry.position.xPercent,
              0,
            ) / battlefieldEffectPositions.length,
          yPercent:
            battlefieldEffectPositions.reduce(
              (sum, entry) => sum + entry.position.yPercent,
              0,
            ) / battlefieldEffectPositions.length,
          xOffsetPx:
            battlefieldEffectPositions.reduce(
              (sum, entry) =>
                sum +
                ((entry.impactAnchor?.xRatio ?? 0.5) - 0.5) *
                  550 *
                  entry.position.scale,
              0,
            ) / battlefieldEffectPositions.length,
          yOffsetPx:
            battlefieldEffectPositions.reduce(
              (sum, entry) =>
                sum +
                ((entry.impactAnchor?.yRatio ?? 0.5) - 0.5) *
                  367 *
                  entry.position.scale,
              0,
            ) / battlefieldEffectPositions.length,
        }
      : null;
  const encounterEnemyTraits = Array.from(
    new Map(
      combatState.enemies.flatMap((enemy) => {
        const passive = ENEMY_DEFINITIONS[enemy.enemyId].passive;

        return passive ? ([[passive.name, passive]] as const) : [];
      }),
    ).values(),
  );
  const unitsAreWaiting =
    encounterIntroPhase === "background" ||
    encounterIntroPhase === "announcement";
  const unitEntranceClass = unitsAreWaiting
    ? "battleScene__unit--waiting"
    : encounterIntroPhase === "entering"
      ? "battleScene__unit--entering"
      : "";
  const interfaceIsVisible =
    encounterIntroPhase === "entering" || encounterIntroComplete;

  useEffect(() => {
    const spriteSources = new Set(
      [
        ...Object.values(CHARACTER_VISUALS).flatMap((visuals) => [
          visuals.autoAttackSpriteSrc,
          ...Object.values(visuals.abilitySpriteSrcs),
        ]),
        ...Object.values(ABILITY_VISUALS).flatMap((visuals) =>
          [
            ...(visuals?.projectile ? [visuals.projectile.spriteSrc] : []),
            ...(visuals?.targetEffect
              ? [visuals.targetEffect.spriteSrc]
              : []),
            ...(visuals?.battlefieldEffect
              ? [visuals.battlefieldEffect.spriteSrc]
              : []),
          ],
        ),
      ],
    );

    for (const spriteSource of spriteSources) {
      const sprite = new Image();
      sprite.src = spriteSource;
    }
  }, []);

  useLayoutEffect(() => {
    const measurementFrame = window.requestAnimationFrame(() => {
      if (currentCombatEvent?.type !== "damage" || !projectileOrigin) {
        setProjectilePath(null);
        return;
      }

      const abilityVisuals = ABILITY_VISUALS[currentCombatEvent.abilityId];
      const projectile = abilityVisuals?.projectile;
      const timing = abilityVisuals?.timing;
      const sceneElement = battleSceneRef.current;
      const actorElement = combatantElementRefs.current.get(
        currentCombatEvent.actorId,
      );
      const targetElement = combatantElementRefs.current.get(
        currentCombatEvent.targetId,
      );
      const origin = projectileOrigin;

      if (
        !projectile ||
        !timing ||
        !sceneElement ||
        !actorElement ||
        !targetElement ||
        !origin
      ) {
        setProjectilePath(null);
        return;
      }

      const sceneRect = sceneElement.getBoundingClientRect();
      const actorRect = actorElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const targetEnemy = combatState.enemies.find(
        (enemy) => enemy.instanceId === currentCombatEvent.targetId,
      );
      const targetImpactAnchor = targetEnemy
        ? ENEMY_VISUALS[targetEnemy.enemyId].impactAnchor
        : null;
      const startX =
        actorRect.left - sceneRect.left + actorRect.width * origin.xRatio;
      const startY =
        actorRect.top - sceneRect.top + actorRect.height * origin.yRatio;
      const endX =
        targetRect.left -
        sceneRect.left +
        targetRect.width * (targetImpactAnchor?.xRatio ?? 0.5);
      const endY =
        targetRect.top -
        sceneRect.top +
        targetRect.height * (targetImpactAnchor?.yRatio ?? 0.62);

      setProjectilePath({
        key: `${combatState.round}-${gameState.pendingRound?.nextEventIndex ?? 0}-${currentCombatEvent.actorId}`,
        spriteSrc: projectile.spriteSrc,
        variant: projectile.variant,
        width: projectile.width,
        durationMs: timing.impactDelayMs,
        startX,
        startY,
        endX,
        endY,
        angle:
          (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI +
          (projectile.rotationOffsetDegrees ?? 0),
      });
    });

    return () => {
      window.cancelAnimationFrame(measurementFrame);
    };
  }, [
    combatState.enemies,
    combatState.round,
    currentCombatEvent,
    gameState.pendingRound?.nextEventIndex,
    projectileOrigin,
  ]);

  useEffect(() => {
    const backgroundImage = new Image();
    const finishLoading = () => {
      setLoadedBackgroundSrc(battleBackground);
    };

    backgroundImage.addEventListener("load", finishLoading);
    backgroundImage.addEventListener("error", finishLoading);
    backgroundImage.src = battleBackground;

    if (backgroundImage.complete) {
      finishLoading();
    }

    return () => {
      backgroundImage.removeEventListener("load", finishLoading);
      backgroundImage.removeEventListener("error", finishLoading);
    };
  }, [battleBackground]);

  useEffect(() => {
    if (!backgroundReady) {
      return;
    }

    const announcementTimer = window.setTimeout(() => {
      setEncounterIntroState({
        encounterId: combatState.encounterId,
        phase: "announcement",
      });
    }, BACKGROUND_REVEAL_DURATION_MS);
    const entranceTimer = window.setTimeout(
      () => {
        setEncounterIntroState({
          encounterId: combatState.encounterId,
          phase: "entering",
        });
      },
      BACKGROUND_REVEAL_DURATION_MS + ENCOUNTER_ANNOUNCEMENT_DURATION_MS,
    );
    const readyTimer = window.setTimeout(
      () => {
        setEncounterIntroState({
          encounterId: combatState.encounterId,
          phase: "ready",
        });
      },
      BACKGROUND_REVEAL_DURATION_MS +
        ENCOUNTER_ANNOUNCEMENT_DURATION_MS +
        COMBAT_ENTRANCE_DURATION_MS,
    );

    return () => {
      window.clearTimeout(announcementTimer);
      window.clearTimeout(entranceTimer);
      window.clearTimeout(readyTimer);
    };
  }, [backgroundReady, combatState.encounterId]);

  useEffect(() => {
    if (!currentCombatEvent || gameState.phase !== "animating") {
      return;
    }

    const isDefendEvent = currentCombatEvent.type === "defend";
    const isStatusDamageEvent =
      currentCombatEvent.type === "statusDamage" ||
      currentCombatEvent.type === "spiritDamage";
    const currentItem =
      currentCombatEvent.type === "itemUse"
        ? ITEM_DEFINITIONS[currentCombatEvent.itemId]
        : null;
    const impactDelay = isDefendEvent
      ? DEFEND_EFFECT_DELAY_MS
      : isStatusDamageEvent
        ? 300
        : currentItem
          ? 300
        : (currentAbilityVisuals?.timing?.impactDelayMs ??
          COMBAT_IMPACT_DELAY_MS);
    const eventDuration = isDefendEvent
      ? DEFEND_EVENT_DURATION_MS
      : isStatusDamageEvent
        ? 1400
        : currentItem
          ? currentItem.useTiming === "quickAction"
            ? 1100
            : 1700
        : (currentAbilityVisuals?.timing?.eventDurationMs ??
          COMBAT_EVENT_DURATION_MS);
    const impactTimer = window.setTimeout(
      () => {
        dispatch({ type: "applyCurrentCombatEvent" });
      },
      impactDelay,
    );
    const completeTimer = window.setTimeout(
      () => {
        dispatch({ type: "advanceCombatEvent" });
      },
      eventDuration,
    );

    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(completeTimer);
    };
  }, [currentAbilityVisuals, currentCombatEvent, gameState.phase]);

  useEffect(() => {
    if (!isMultiplayer) {
      return;
    }

    const unsubscribeFromReadiness = subscribeToPlayerReadiness(
      setPlayerReadiness,
    );
    const unsubscribeFromRound = subscribeToRoundResolved((result) => {
      setPlayerReadiness(null);
      setSelectedAbilityId(null);
      setSelectedItemId(null);
      dispatch({ type: "receiveRoundResult", result });
    });
    const unsubscribeFromImmediateItem = subscribeToImmediateItemResolved(
      ({ state, event }) => {
        dispatch({ type: "syncCombatState", combatState: state });
        setImmediateItemEvent(event);
      },
    );
    const unsubscribeFromGhostReformed = subscribeToGhostReformed(
      (nextCombatState) => {
        setSelectedAbilityId(null);
        setSelectedItemId(null);
        dispatch({
          type: "syncCombatState",
          combatState: nextCombatState,
        });
      },
    );
    const unsubscribeFromUpgradeReadiness = subscribeToUpgradeReadiness(
      setUpgradeReadiness,
    );
    const unsubscribeFromRewardStage = subscribeToRewardStageUpdated(
      (nextCombatState) => {
        setUpgradeReadiness(null);
        setLocalUpgradeChoiceId(null);
        dispatch({
          type: "syncCombatState",
          combatState: nextCombatState,
        });
      },
    );
    const unsubscribeFromEncounter = subscribeToEncounterStarted(
      (nextCombatState) => {
        setPlayerReadiness(null);
        setUpgradeReadiness(null);
        setLocalUpgradeChoiceId(null);
        setSelectedAbilityId(null);
        setSelectedItemId(null);
        dispatch({
          type: "startEncounter",
          combatState: nextCombatState,
        });
      },
    );

    return () => {
      unsubscribeFromReadiness();
      unsubscribeFromRound();
      unsubscribeFromImmediateItem();
      unsubscribeFromGhostReformed();
      unsubscribeFromUpgradeReadiness();
      unsubscribeFromRewardStage();
      unsubscribeFromEncounter();
    };
  }, [isMultiplayer]);

  useEffect(() => {
    if (!immediateItemEvent) {
      return;
    }

    const timer = window.setTimeout(() => {
      setImmediateItemEvent(null);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [immediateItemEvent]);

  const getCombatantName = (combatantId: CombatantId) => {
    if (
      combatantId === "character-1" ||
      combatantId === "character-2"
    ) {
      return combatState.characters[combatantId].name;
    }

    return (
      combatState.enemies.find((enemy) => enemy.instanceId === combatantId)
        ?.name ?? "Enemy"
    );
  };

  const submitPlayerAction = async (
    abilityId: AbilityId,
    targetId: CombatantId | null,
  ) => {
    if (!activePlayerId || actionSubmitting) {
      return;
    }

    if (isMultiplayer) {
      setActionSubmitting(true);
      const accepted = await submitMultiplayerAction({
        round: combatState.round,
        abilityId,
        targetId,
      });

      if (accepted && localPlayerId) {
        setPlayerReadiness((currentReadiness) => ({
          round: combatState.round,
          readyPlayerIds: Array.from(
            new Set([
              ...(currentReadiness?.round === combatState.round
                ? currentReadiness.readyPlayerIds
                : []),
              localPlayerId,
            ]),
          ),
        }));
      }

      setActionSubmitting(false);
      setSelectedAbilityId(null);
      return;
    }

    dispatch({
      type: "submitPlayerAction",
      playerId: activePlayerId,
      abilityId,
      targetId,
    });
    setSelectedAbilityId(null);
  };

  const submitPlayerItem = async (
    itemId: ItemId,
    targetId: CombatantId | null,
  ) => {
    if (!activePlayerId || !activeCharacterId || actionSubmitting) {
      return;
    }

    const definition = ITEM_DEFINITIONS[itemId];

    if (!definition) {
      return;
    }

    if (isMultiplayer) {
      setActionSubmitting(true);
      const result = await submitMultiplayerItem({
        round: combatState.round,
        itemId,
        targetId,
      });

      if (
        result.accepted &&
        !result.resolvedImmediately &&
        definition.useTiming === "action" &&
        localPlayerId
      ) {
        setPlayerReadiness((currentReadiness) => ({
          round: combatState.round,
          readyPlayerIds: Array.from(
            new Set([
              ...(currentReadiness?.round === combatState.round
                ? currentReadiness.readyPlayerIds
                : []),
              localPlayerId,
            ]),
          ),
        }));
      }

      if (result.accepted && !result.resolvedImmediately) {
        setQueuedItemState((current) => {
          const counts =
            current.scope === itemQueueScope ? current.counts : {};

          return {
            scope: itemQueueScope,
            counts: {
              ...counts,
              [itemId]: (counts[itemId] ?? 0) + 1,
            },
          };
        });
      }

      setActionSubmitting(false);
      setSelectedItemId(null);
      return;
    }

    if (definition.resolutionTiming === "preRound") {
      const result = resolveImmediateItemUse(combatState, {
        kind: "item",
        actorId: activeCharacterId,
        itemId,
        targetId,
      });

      if (result) {
        dispatch({
          type: "syncCombatState",
          combatState: result.nextState,
        });
        setImmediateItemEvent(result.event);
      }
    } else {
      dispatch({
        type: "submitPlayerItem",
        playerId: activePlayerId,
        itemId,
        targetId,
      });
      setQueuedItemState((current) => {
        const counts =
          current.scope === itemQueueScope ? current.counts : {};

        return {
          scope: itemQueueScope,
          counts: {
            ...counts,
            [itemId]: (counts[itemId] ?? 0) + 1,
          },
        };
      });
    }

    setSelectedItemId(null);
  };

  const selectEnemyTarget = async (targetId: EnemyInstanceId) => {
    if (selectedItemId) {
      const item = ITEM_DEFINITIONS[selectedItemId];

      if (item?.target === "singleEnemy") {
        await submitPlayerItem(selectedItemId, targetId);
      }
      return;
    }

    if (!selectedAbilityId || !commandCharacter) {
      return;
    }

    const selectedAbility = resolveCharacterAction(
      commandCharacter,
      selectedAbilityId,
    );

    if (selectedAbility?.target !== "singleEnemy") {
      return;
    }

    await submitPlayerAction(selectedAbilityId, targetId);
  };

  const selectAllyTarget = async (targetId: CharacterInstanceId) => {
    if (selectedItemId) {
      const item = ITEM_DEFINITIONS[selectedItemId];

      if (
        item?.target === "singleAlly" ||
        item?.target === "singleFallenAlly"
      ) {
        await submitPlayerItem(selectedItemId, targetId);
      }
      return;
    }

    if (!selectedAbilityId || !commandCharacter) {
      return;
    }

    const selectedRank = getKnownAbilityRank(
      commandCharacter.abilityRanks,
      selectedAbilityId,
    );
    const selectedSpirit = getSpiritForActiveAbility(
      commandCharacter.spirits,
      selectedAbilityId,
    );
    const ability = selectedRank
      ? resolveAbility(selectedAbilityId, selectedRank)
      : selectedSpirit
        ? resolveAbility(selectedAbilityId, 1)
        : null;

    if (ability?.target !== "singleAlly") {
      return;
    }

    await submitPlayerAction(selectedAbilityId, targetId);
  };

  const selectReform = async () => {
    if (!activeCharacterId || actionSubmitting) {
      return;
    }

    if (isMultiplayer) {
      setActionSubmitting(true);
      const accepted = await submitMultiplayerReform({
        round: combatState.round,
      });
      setActionSubmitting(false);
      if (!accepted) {
        return;
      }
    } else {
      const reformedState = reformGhost(combatState, activeCharacterId);
      if (!reformedState) {
        return;
      }
      dispatch({ type: "syncCombatState", combatState: reformedState });
    }

    setSelectedAbilityId(null);
    setSelectedItemId(null);
  };

  const selectUpgrade = async (choiceId: RewardChoiceId) => {
    if (
      !upgradeSelectionIsActive ||
      !upgradeCharacterId ||
      upgradeSubmitting ||
      upgradeSelectedChoiceId
    ) {
      return;
    }

    if (isMultiplayer) {
      setUpgradeSubmitting(true);
      const accepted = await submitMultiplayerUpgrade({
        completedEncounterId: combatState.encounterId,
        choiceId,
      });

      if (accepted && localPlayerId) {
        setLocalUpgradeChoiceId(choiceId);
        setUpgradeReadiness((currentReadiness) => ({
          completedEncounterId: combatState.encounterId,
          readyPlayerIds: Array.from(
            new Set([
              ...(currentReadiness?.completedEncounterId ===
              combatState.encounterId
                ? currentReadiness.readyPlayerIds
                : []),
              localPlayerId,
            ]),
          ),
        }));
      }

      setUpgradeSubmitting(false);
      return;
    }

    const nextSelections = {
      ...singlePlayerUpgradeSelections,
      [upgradeCharacterId]: choiceId,
    };
    const rewardParticipants = getRewardParticipantCharacterIds(combatState);

    if (
      rewardParticipants.some(
        (characterId) => !nextSelections[characterId],
      )
    ) {
      setSinglePlayerUpgradeSelections(nextSelections);
      return;
    }

    const selectedChoices: Partial<
      Record<CharacterInstanceId, RewardChoiceId>
    > = {};

    for (const characterId of rewardParticipants) {
      const choice = nextSelections[characterId];
      if (choice) {
        selectedChoices[characterId] = choice;
      }
    }

    const upgradedCombatState = applyRewardChoices(
      combatState,
      selectedChoices,
    );

    if (!upgradedCombatState) {
      return;
    }

    setSinglePlayerUpgradeSelections({
      "character-1": null,
      "character-2": null,
    });

    if (isRest) {
      if (
        upgradedCombatState.restStage === "complete" &&
        nextEncounterId
      ) {
        dispatch({
          type: "startEncounter",
          combatState: startEncounter(
            upgradedCombatState,
            nextEncounterId,
          ),
        });
      } else {
        dispatch({
          type: "syncCombatState",
          combatState: upgradedCombatState,
        });
      }
      return;
    }

    if (!nextEncounterId) {
      return;
    }

    dispatch({
      type: "startEncounter",
      combatState: startEncounter(upgradedCombatState, nextEncounterId),
    });
  };

  const selectedAbility =
    selectedAbilityId && commandCharacter
      ? resolveCharacterAction(commandCharacter, selectedAbilityId)
      : null;
  const selectedItem = selectedItemId
    ? ITEM_DEFINITIONS[selectedItemId]
    : null;

  const otherPlayerReady = Boolean(
    isMultiplayer &&
      playerReadiness?.round === combatState.round &&
      playerReadiness.readyPlayerIds.some(
        (playerId) => playerId !== localPlayerId,
      ),
  );

  const prompt =
    gameState.phase === "victory"
      ? "Victory!"
      : gameState.phase === "defeat"
        ? "Defeat"
        : gameState.phase === "animating"
          ? currentCombatEvent?.type === "skipTurn"
            ? `${getCombatantName(currentCombatEvent.actorId)} is Stunned and loses the action...`
          : currentCombatEvent?.type === "wake"
            ? `${getCombatantName(currentCombatEvent.actorId)} wakes ${getCombatantName(currentCombatEvent.targetId)}...`
          : currentCombatEvent?.type === "wait"
            ? `${getCombatantName(currentCombatEvent.actorId)} catches their breath...`
          : currentCombatEvent?.type === "defend"
            ? `${getCombatantName(currentCombatEvent.actorId)} defends...`
            : currentCombatEvent?.type === "statusDamage"
              ? `${getCombatantName(currentCombatEvent.targetId)} takes damage from ${currentCombatEvent.statusId === "bleed" ? "Bleed" : "Burn"}...`
            : currentCombatEvent?.type === "spiritDamage"
              ? `Embertail strikes ${getCombatantName(currentCombatEvent.targetId)}...`
            : currentCombatEvent?.type === "charge"
              ? `${getCombatantName(currentCombatEvent.actorId)} gathers Dreadflame...`
            : currentCombatEvent?.type === "support"
              ? `${getCombatantName(currentCombatEvent.actorId)} uses ${resolveAbility(currentCombatEvent.abilityId, currentCombatEvent.abilityRank)?.name ?? "an ability"} on ${getCombatantName(currentCombatEvent.targetId)}...`
            : currentCombatEvent?.type === "multiTargetSupport"
              ? `${getCombatantName(currentCombatEvent.actorId)} uses ${resolveAbility(currentCombatEvent.abilityId, currentCombatEvent.abilityRank)?.name ?? "an ability"} on both heroes...`
            : currentCombatEvent?.type === "itemUse"
              ? `${getCombatantName(currentCombatEvent.actorId)} uses ${ITEM_DEFINITIONS[currentCombatEvent.itemId]?.name ?? "an item"}...`
            : currentCombatEvent
              ? `${getCombatantName(currentCombatEvent.actorId)} uses ${resolveAbility(currentCombatEvent.abilityId, currentCombatEvent.abilityRank)?.name ?? "an ability"}...`
              : "Combat..."
        : isMultiplayer && localPlayerReady
          ? `${commandCharacter?.name} · Waiting for the other player...`
          : selectedAbility?.target === "singleEnemy"
            ? `${commandCharacter?.name} · Select an enemy for ${selectedAbility.name}`
          : selectedAbility?.target === "singleAlly"
            ? `${commandCharacter?.name} · Select an ally for ${selectedAbility.name}`
          : selectedItem?.target === "singleEnemy"
            ? `${commandCharacter?.name} · Select an enemy for ${selectedItem.name}`
          : selectedItem?.target === "singleAlly"
            ? `${commandCharacter?.name} · Select a hero for ${selectedItem.name}`
          : selectedItem?.target === "singleFallenAlly"
            ? `${commandCharacter?.name} · Select a fallen hero for ${selectedItem.name}`
            : otherPlayerReady
              ? `Other player is ready · ${commandCharacter?.name} · Select an action`
              : `${commandCharacter?.name} · Select an action`;

  return (
    <div
      ref={battleSceneRef}
      className={`battleScene ${interfaceIsVisible ? "battleScene--interface-visible" : ""}`}
      style={{ backgroundImage: `url(${battleBackground})` }}
    >
      <div className="battleScene__overlay" />

      {encounterIntroPhase === "announcement" && (
        <div
          className="encounterAnnouncement"
          role="status"
          aria-live="polite"
        >
          <div className="encounterAnnouncement__content">
            <div className="encounterAnnouncement__label">
              {encounter.kind === "rest"
                ? "Rest"
                : `Encounter ${encounter.number}`}
            </div>
            <div className="encounterAnnouncement__title">
              {encounter.title}
            </div>
          </div>
        </div>
      )}

      <PartyStatusPanel
        characters={combatState.characters}
        activeCharacterId={activeCharacterId}
      />

      {encounter.kind === "combat" && (
        <div className="battleRound">Round {combatState.round}</div>
      )}

      {encounterEnemyTraits.length > 0 && (
        <aside className="enemyTraitPanel" aria-label="Enemy traits">
          <div className="enemyTraitPanel__label">Enemy Trait</div>
          {encounterEnemyTraits.map((trait) => (
            <div key={trait.name} className="enemyTraitPanel__trait">
              <div className="enemyTraitPanel__name">{trait.name}</div>
              <div className="enemyTraitPanel__description">
                {trait.description}
              </div>
            </div>
          ))}
        </aside>
      )}

      <div className="battle__content">{/* her kommer sprites/targets */}</div>
      {PLAYER_ORDER.map((playerId, index) => {
        const characterId =
          combatState.players[playerId].controlledCharacterId;
        const character = combatState.characters[characterId];
        const visuals = CHARACTER_VISUALS[character.presetId];
        const idleSpriteSrc =
          character.form === "living"
            ? visuals.idleSpriteSrc
            : visuals.ghostIdleSpriteSrc;
        const isAttacking =
          (currentCombatEvent?.type === "damage" ||
            currentCombatEvent?.type === "multiTargetDamage" ||
            currentCombatEvent?.type === "support" ||
            currentCombatEvent?.type === "multiTargetSupport") &&
          currentCombatEvent.actorId === characterId;
        const activeAbilityVisuals = isAttacking
          ? ABILITY_VISUALS[currentCombatEvent.abilityId]
          : null;
        const isCasting = activeAbilityVisuals?.animation === "cast";
        const castVariant = isCasting
          ? activeAbilityVisuals?.castVariant
          : null;
        const isReleasingProjectile = Boolean(
          isCasting && activeAbilityVisuals?.projectile,
        );
        const isUsingWhirlwind =
          activeAbilityVisuals?.animation === "whirlwind";
        const usesIdleActionSprite =
          isAttacking &&
          (currentCombatEvent.abilityId === "cinderburst" ||
            currentCombatEvent.abilityId === "stoneback" ||
            currentCombatEvent.abilityId === "riverheart");
        const actionSpriteSrc = isAttacking
          ? character.form === "ghost"
            ? (visuals.ghostAbilitySpriteSrcs[
                currentCombatEvent.abilityId
              ] ?? visuals.ghostIdleSpriteSrc)
            : usesIdleActionSprite
            ? idleSpriteSrc
            : (visuals.abilitySpriteSrcs[currentCombatEvent.abilityId] ??
              visuals.autoAttackSpriteSrc)
          : character.form === "ghost"
            ? visuals.ghostIdleSpriteSrc
            : visuals.autoAttackSpriteSrc;
        const actionSpriteAdjustment = isAttacking
          ? visuals.abilitySpriteAdjustments[currentCombatEvent.abilityId]
          : null;
        const isDefending = defendingCombatantIds.has(characterId);
        const isStunned = character.statuses.some(
          (status) => status.id === "stunned",
        );
        const receivedDamage = getDamageImpactForTarget(
          displayedImpactEvent,
          characterId,
        );
        const receivedImpactVisuals =
          receivedDamage &&
          appliedCombatEvent &&
          (appliedCombatEvent.type === "damage" ||
            appliedCombatEvent.type === "multiTargetDamage")
            ? ABILITY_VISUALS[appliedCombatEvent.abilityId]
            : null;
        const isDarkImpact = receivedImpactVisuals?.impact === "dark";
        const isShieldChargeImpact =
          receivedDamage &&
          appliedCombatEvent?.type === "damage" &&
          appliedCombatEvent.abilityId === "shieldCharge";
        const isBurnImpact =
          (appliedCombatEvent?.type === "statusDamage" &&
            appliedCombatEvent.statusId === "burn" &&
            appliedCombatEvent.targetId === characterId) ||
          (appliedCombatEvent?.type === "spiritDamage" &&
            appliedCombatEvent.targetId === characterId);
        const supportImpact = getSupportImpactForTarget(
          displayedImpactEvent,
          characterId,
        );
        const currentTargetEffect =
          currentCombatEvent &&
          getDamageImpactForTarget(currentCombatEvent, characterId) &&
          (currentCombatEvent.type === "damage" ||
            currentCombatEvent.type === "multiTargetDamage")
            ? ABILITY_VISUALS[currentCombatEvent.abilityId]?.targetEffect
            : null;
        const canTargetAlly =
          gameState.phase === "selectingActions" &&
          Boolean(activePlayerId) &&
          !actionSubmitting &&
          ((selectedAbility?.target === "singleAlly" && character.hp > 0) ||
            (selectedItem?.target === "singleAlly" && character.hp > 0) ||
            (selectedItem?.target === "singleFallenAlly" &&
              character.form === "ghost"));

        if (character.form === "permanentlyDead" && !receivedDamage) {
          return null;
        }

        return (
          <div
            key={characterId}
            ref={(element) => {
              if (element) {
                combatantElementRefs.current.set(characterId, element);
              } else {
                combatantElementRefs.current.delete(characterId);
              }
            }}
            className={`battleScene__playerUnit battleScene__playerUnit--${index === 0 ? "one" : "two"} battleScene__playerUnit--${character.form} ${unitEntranceClass} ${isAttacking ? `battleScene__playerUnit--acting battleScene__playerUnit--ability-${currentCombatEvent.abilityId}` : ""} ${isAttacking && !isCasting && !isUsingWhirlwind ? "battleScene__playerUnit--attacking" : ""} ${isCasting ? "battleScene__playerUnit--casting" : ""} ${castVariant ? `battleScene__playerUnit--casting-${castVariant}` : ""} ${isReleasingProjectile ? "battleScene__playerUnit--projectile-casting" : ""} ${isUsingWhirlwind ? "battleScene__playerUnit--whirlwind" : ""} ${isDefending ? "battleScene__playerUnit--defending" : ""} ${isStunned ? "battleScene__playerUnit--stunned" : ""} ${isDarkImpact ? "battleScene__playerUnit--darkImpact" : ""} ${isShieldChargeImpact ? "battleScene__playerUnit--shieldChargeImpact" : ""} ${isBurnImpact ? "battleScene__playerUnit--burnImpact" : ""} ${supportImpact ? `battleScene__playerUnit--supportImpact battleScene__playerUnit--supportImpact-${"abilityId" in supportImpact ? (ABILITY_VISUALS[supportImpact.abilityId]?.impact ?? "water") : "water"}` : ""} ${canTargetAlly ? "battleScene__playerUnit--selectableAlly" : ""}`}
            style={
              activeAbilityVisuals?.timing
                ? ({
                    "--action-animation-duration": `${activeAbilityVisuals.timing.animationDurationMs}ms`,
                  } as CSSProperties)
                : undefined
            }
          >
            <img
              className="battleScene__playerSprite battleScene__playerSprite--idle"
              src={idleSpriteSrc}
              alt=""
            />
            <img
              key={
                isAttacking
                  ? `${characterId}-${currentCombatEvent.abilityId}`
                  : `${characterId}-inactive-action`
              }
              className="battleScene__playerSprite battleScene__playerSprite--attack"
              src={actionSpriteSrc}
              alt=""
              style={
                actionSpriteAdjustment
                  ? ({
                      "--action-sprite-offset-x":
                        actionSpriteAdjustment.offsetX,
                      "--action-sprite-offset-y":
                        actionSpriteAdjustment.offsetY,
                      "--action-sprite-scale": actionSpriteAdjustment.scale,
                      "--action-sprite-width":
                        actionSpriteAdjustment.width ?? "100%",
                      "--action-sprite-height":
                        actionSpriteAdjustment.height ?? "100%",
                      "--action-sprite-left":
                        actionSpriteAdjustment.left ?? "0",
                      "--action-sprite-top":
                        actionSpriteAdjustment.top ?? "0",
                    } as CSSProperties)
                  : undefined
              }
            />
            {currentTargetEffect && (
              <img
                key={`${combatState.round}-${gameState.pendingRound?.nextEventIndex ?? 0}-${characterId}`}
                className={`battleScene__targetEffect battleScene__targetEffect--${currentTargetEffect.variant}`}
                src={currentTargetEffect.spriteSrc}
                alt=""
                style={
                  {
                    width: `${currentTargetEffect.width}px`,
                    "--target-effect-duration": `${currentAbilityVisuals?.timing?.animationDurationMs ?? COMBAT_EVENT_DURATION_MS}ms`,
                  } as CSSProperties
                }
              />
            )}
            {receivedDamage && (
              <DamageNumber
                amount={receivedDamage.amount}
                isCritical={receivedDamage.isCritical}
                durationMs={
                  receivedImpactVisuals?.timing?.damageNumberDurationMs
                }
                absorbedByBarrier={
                  "absorbedByBarrier" in receivedDamage
                    ? receivedDamage.absorbedByBarrier
                    : 0
                }
              />
            )}
            {supportImpact && (
              <div
                className={`supportNumber${
                  appliedCombatEvent &&
                  "abilityId" in appliedCombatEvent &&
                  appliedCombatEvent.abilityId === "stoneback"
                    ? " supportNumber--stoneback"
                    : ""
                }`}
                aria-hidden="true"
              >
                {supportImpact.healingAmount > 0 && (
                  <span>+{supportImpact.healingAmount} HP</span>
                )}
                {supportImpact.barrierAmount > 0 && (
                  <span>🛡 +{supportImpact.barrierAmount}</span>
                )}
                {(supportImpact.ppRestored ?? 0) > 0 && (
                  <span>+{supportImpact.ppRestored} PP</span>
                )}
              </div>
            )}
            <button
              type="button"
              className="battleScene__allyHitbox"
              disabled={!canTargetAlly}
              onClick={() => void selectAllyTarget(characterId)}
              aria-label={`Target ${character.name}`}
            />
          </div>
        );
      })}
      {combatState.enemies.map((enemy, index) => {
        const hpPercent = Math.max(
          0,
          Math.min(100, (enemy.hp / enemy.stats.maxHp) * 100),
        );
        const sleeping = isEnemySleeping(enemy);
        const canTarget =
          gameState.phase === "selectingActions" &&
          Boolean(activePlayerId) &&
          (selectedAbility?.target === "singleEnemy" ||
            selectedItem?.target === "singleEnemy") &&
          !actionSubmitting &&
          isEnemyTargetable(enemy);
        const isAttacking =
          (currentCombatEvent?.type === "damage" ||
            currentCombatEvent?.type === "multiTargetDamage" ||
            currentCombatEvent?.type === "support" ||
            currentCombatEvent?.type === "multiTargetSupport" ||
            currentCombatEvent?.type === "charge" ||
            currentCombatEvent?.type === "wake" ||
            currentCombatEvent?.type === "wait") &&
          currentCombatEvent.actorId === enemy.instanceId;
        const visuals = ENEMY_VISUALS[enemy.enemyId];
        const enemyDefinition = ENEMY_DEFINITIONS[enemy.enemyId];
        const burnStatus = enemy.statuses.find(
          (status) => status.id === "burn",
        );
        const bleedStatus = enemy.statuses.find(
          (status) => status.id === "bleed",
        );
        const enemyIntent = combatState.enemyIntents[enemy.instanceId];
        const enemyIntentRank = enemyIntent
          ? getKnownAbilityRank(enemy.abilityRanks, enemyIntent.abilityId)
          : null;
        const enemyIntentAbility =
          enemyIntent && enemyIntentRank
            ? resolveAbility(enemyIntent.abilityId, enemyIntentRank)
            : null;
        const enemyIntentTargets =
          enemyIntent &&
          gameState.phase === "selectingActions" &&
          enemyIntentAbility?.effects.some(
            (effect) => effect.type === "damage",
          )
            ? enemyIntent.targetIds.filter(isCharacterInstanceId)
            : [];
        const passiveTooltipId = enemyDefinition.passive
          ? `enemy-passive-${enemy.instanceId}`
          : undefined;
        const receivedDamage = getDamageImpactForTarget(
          displayedImpactEvent,
          enemy.instanceId,
        );
        if (enemy.hp <= 0 && !receivedDamage) {
          return null;
        }
        const impactVisuals =
          receivedDamage &&
          appliedCombatEvent &&
          (appliedCombatEvent.type === "damage" ||
            appliedCombatEvent.type === "multiTargetDamage")
            ? ABILITY_VISUALS[appliedCombatEvent.abilityId]
            : null;
        const isFireImpact = impactVisuals?.impact === "fire";
        const isWindImpact = impactVisuals?.impact === "wind";
        const isWaterImpact = impactVisuals?.impact === "water";
        const isBurnImpact =
          (appliedCombatEvent?.type === "statusDamage" &&
            appliedCombatEvent.statusId === "burn" &&
            appliedCombatEvent.targetId === enemy.instanceId) ||
          (appliedCombatEvent?.type === "spiritDamage" &&
            appliedCombatEvent.targetId === enemy.instanceId);
        const supportImpact = getSupportImpactForTarget(
          displayedImpactEvent,
          enemy.instanceId,
        );
        const currentTargetEffect =
          currentCombatEvent &&
          getDamageImpactForTarget(
            currentCombatEvent,
            enemy.instanceId,
          ) &&
          (currentCombatEvent.type === "damage" ||
            currentCombatEvent.type === "multiTargetDamage")
            ? ABILITY_VISUALS[currentCombatEvent.abilityId]?.targetEffect
            : null;
        const activeAbilityVisuals = isAttacking
          ? ABILITY_VISUALS[currentCombatEvent.abilityId]
          : null;
        const activeEnemySpriteSequence = isAttacking
          ? visuals.abilitySpriteSequences?.[currentCombatEvent.abilityId]
          : null;
        const isProjectileCasting = Boolean(
          activeAbilityVisuals?.animation === "cast" &&
            activeAbilityVisuals.projectile,
        );
        const projectileVariant = isProjectileCasting
          ? activeAbilityVisuals?.projectile?.variant
          : null;
        const formationPosition = enemyFormationPositions[index];

        return (
          <div
            key={enemy.instanceId}
            ref={(element) => {
              if (element) {
                combatantElementRefs.current.set(enemy.instanceId, element);
              } else {
                combatantElementRefs.current.delete(enemy.instanceId);
              }
            }}
            className={`battleScene__enemyUnit ${unitEntranceClass} ${canTarget ? "battleScene__enemyUnit--selectable" : ""} ${sleeping ? "battleScene__enemyUnit--sleeping" : ""} ${enemy.hp <= 0 ? "battleScene__enemyUnit--defeated" : ""} ${isAttacking ? "battleScene__enemyUnit--attacking" : ""} ${visuals.attackAnimationVariant ? `battleScene__enemyUnit--attack-${visuals.attackAnimationVariant}` : ""} ${activeEnemySpriteSequence ? `battleScene__enemyUnit--sequence-${activeEnemySpriteSequence.variant}` : ""} ${isProjectileCasting ? "battleScene__enemyUnit--projectile-casting" : ""} ${projectileVariant ? `battleScene__enemyUnit--projectile-${projectileVariant}` : ""} ${isFireImpact ? "battleScene__enemyUnit--fireImpact" : ""} ${isWindImpact ? "battleScene__enemyUnit--windImpact" : ""} ${isWaterImpact ? "battleScene__enemyUnit--waterImpact" : ""} ${isBurnImpact ? "battleScene__enemyUnit--burnImpact" : ""} ${supportImpact ? `battleScene__enemyUnit--supportImpact battleScene__enemyUnit--supportImpact-${"abilityId" in supportImpact ? (ABILITY_VISUALS[supportImpact.abilityId]?.impact ?? "earth") : "earth"}` : ""}`}
            style={
              {
                left: `${formationPosition.xPercent}%`,
                top: `${formationPosition.yPercent}%`,
                "--enemy-scale": formationPosition.scale,
                "--enemy-sprite-scale": visuals.spriteScale ?? 1,
                "--enemy-status-top": sleeping
                  ? (visuals.sleepingStatusTop ?? visuals.statusTop)
                  : visuals.statusTop,
                "--enemy-hitbox-left": visuals.hitboxAdjustment?.left,
                "--enemy-hitbox-top": visuals.hitboxAdjustment?.top,
                "--enemy-hitbox-width": visuals.hitboxAdjustment?.width,
                "--enemy-hitbox-height": visuals.hitboxAdjustment?.height,
                "--enemy-impact-left": visuals.impactAnchor
                  ? `${visuals.impactAnchor.xRatio * 100}%`
                  : undefined,
                "--enemy-impact-top": visuals.impactAnchor
                  ? `${visuals.impactAnchor.yRatio * 100}%`
                  : undefined,
                "--action-animation-duration": `${activeAbilityVisuals?.timing?.animationDurationMs ?? visuals.attackAnimationDurationMs ?? COMBAT_EVENT_DURATION_MS}ms`,
                zIndex: formationPosition.zIndex,
              } as CSSProperties
            }
          >
            <div
              className={`enemyStatus${enemy.isBoss ? " enemyStatus--boss" : ""}`}
            >
              {enemyIntentTargets.length > 0 && (
                <div
                  className="enemyStatus__intent"
                  aria-label={`Targets ${enemyIntentTargets
                    .map((targetId) => combatState.characters[targetId].name)
                    .join(" and ")}`}
                  title={`Targets ${enemyIntentTargets
                    .map((targetId) => combatState.characters[targetId].name)
                    .join(" and ")}`}
                >
                  <span className="enemyStatus__intentSword" aria-hidden="true">
                    ⚔
                  </span>
                  <span className="enemyStatus__intentArrow" aria-hidden="true">
                    ➜
                  </span>
                  {enemyIntentTargets.map((targetId) => {
                    const target = combatState.characters[targetId];

                    return (
                      <img
                        key={targetId}
                        className={`enemyStatus__intentPortrait${target.form === "ghost" ? " enemyStatus__intentPortrait--ghost" : ""}`}
                        src={getPortraitSource(target.portraitId)}
                        alt={target.name}
                      />
                    );
                  })}
                </div>
              )}
              {sleeping && (
                <div className="enemyStatus__condition" role="status">
                  💤 Sleeping
                </div>
              )}
              <div className="enemyStatus__heading">
                <span>
                  {enemy.name}
                </span>
                {enemy.barrier > 0 && (
                  <span
                    className="enemyStatus__barrier"
                    aria-label={`${enemy.barrier} Barrier`}
                    title={`${enemy.barrier} Barrier`}
                  >
                    🛡 {enemy.barrier}
                  </span>
                )}
                {burnStatus && (
                  <span
                    className="enemyStatus__effect enemyStatus__effect--burn"
                    role="img"
                    aria-label={`Burn, ${burnStatus.remainingRounds ?? 1} rounds remaining`}
                    title={`Burn · ${burnStatus.remainingRounds ?? 1} rounds remaining`}
                  >
                    🔥
                  </span>
                )}
                {bleedStatus && (
                  <span
                    className="enemyStatus__effect enemyStatus__effect--bleed"
                    role="img"
                    aria-label={`Bleed, ${bleedStatus.remainingRounds ?? 1} rounds remaining`}
                    title={`Bleed · ${bleedStatus.remainingRounds ?? 1} rounds remaining`}
                  >
                    🩸
                  </span>
                )}
              </div>
              <div
                className="enemyStatus__bar"
                role="progressbar"
                aria-label={`${enemy.name} HP`}
                aria-valuemin={0}
                aria-valuemax={enemy.stats.maxHp}
                aria-valuenow={enemy.hp}
              >
                <div
                  className="enemyStatus__barFill"
                  style={{ width: `${hpPercent}%` }}
                />
                <span className="enemyStatus__barValue">
                  {enemy.hp} / {enemy.stats.maxHp}
                </span>
              </div>
            </div>
            <div className="battleScene__enemySpriteStage">
              <img
                className="battleScene__enemySprite battleScene__enemySprite--idle"
                src={
                  sleeping && visuals.sleepingSpriteSrc
                    ? visuals.sleepingSpriteSrc
                    : visuals.idleSpriteSrc
                }
                alt=""
                style={
                  sleeping
                    ? (visuals.sleepingSpriteAdjustment ??
                      visuals.idleSpriteAdjustment)
                    : visuals.idleSpriteAdjustment
                }
              />
              {(activeEnemySpriteSequence?.frames ?? [
                {
                  spriteSrc: visuals.autoAttackSpriteSrc,
                  adjustment: visuals.attackSpriteAdjustment,
                },
              ]).map((frame, frameIndex) => (
                <img
                  key={`enemy-action-frame-${frameIndex}`}
                  className={`battleScene__enemySprite battleScene__enemySprite--attack battleScene__enemySprite--attackFrame-${frameIndex + 1}`}
                  src={frame.spriteSrc}
                  alt=""
                  style={frame.adjustment}
                />
              ))}
            </div>
            {currentTargetEffect && (
              <img
                key={`${combatState.round}-${gameState.pendingRound?.nextEventIndex ?? 0}-${enemy.instanceId}`}
                className={`battleScene__targetEffect battleScene__targetEffect--${currentTargetEffect.variant}`}
                src={currentTargetEffect.spriteSrc}
                alt=""
                style={
                  {
                    width: `${currentTargetEffect.width}px`,
                    "--target-effect-duration": `${currentAbilityVisuals?.timing?.animationDurationMs ?? COMBAT_EVENT_DURATION_MS}ms`,
                  } as CSSProperties
                }
              />
            )}
            {supportImpact && (
              <div
                className={`supportNumber${
                  appliedCombatEvent &&
                  "abilityId" in appliedCombatEvent &&
                  appliedCombatEvent.abilityId === "stoneback"
                    ? " supportNumber--stoneback"
                    : ""
                }`}
                aria-hidden="true"
              >
                {supportImpact.healingAmount > 0 && (
                  <span>+{supportImpact.healingAmount} HP</span>
                )}
                {supportImpact.barrierAmount > 0 && (
                  <span>🛡 +{supportImpact.barrierAmount}</span>
                )}
              </div>
            )}
            <button
              type="button"
              className="battleScene__enemyHitbox"
              disabled={!canTarget}
              onClick={() => void selectEnemyTarget(enemy.instanceId)}
              aria-label={`Target level ${enemy.level} ${enemy.name}`}
              aria-describedby={passiveTooltipId}
            />
            {enemyDefinition.passive && (
              <div
                id={passiveTooltipId}
                className="enemyPassiveTooltip"
                role="tooltip"
              >
                <div className="enemyPassiveTooltip__name">
                  {enemyDefinition.passive.name}
                </div>
                <div className="enemyPassiveTooltip__description">
                  {enemyDefinition.passive.description}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {currentBattlefieldEffect &&
        (currentBattlefieldEffect.position || battlefieldEffectCenter) && (
        <img
          key={`${combatState.round}-${gameState.pendingRound?.nextEventIndex ?? 0}-battlefield-effect`}
          className={`battleScene__battlefieldEffect battleScene__battlefieldEffect--${currentBattlefieldEffect.variant}`}
          src={currentBattlefieldEffect.spriteSrc}
          alt=""
          style={
            {
              left:
                currentBattlefieldEffect.position?.left ??
                `calc(${battlefieldEffectCenter?.xPercent}% + ${battlefieldEffectCenter?.xOffsetPx ?? 0}px)`,
              top:
                currentBattlefieldEffect.position?.top ??
                `calc(${battlefieldEffectCenter?.yPercent}% + ${battlefieldEffectCenter?.yOffsetPx ?? 0}px)`,
              width: `min(${currentBattlefieldEffect.width}px, 74vw)`,
              "--battlefield-effect-duration": `${currentAbilityVisuals?.timing?.animationDurationMs ?? COMBAT_EVENT_DURATION_MS}ms`,
            } as CSSProperties
          }
        />
        )}

      {combatState.enemies.map((enemy, index) => {
        const receivedDamage = getDamageImpactForTarget(
          appliedCombatEvent,
          enemy.instanceId,
        );

        if (!receivedDamage) {
          return null;
        }

        const formationPosition = enemyFormationPositions[index];
        const visuals = ENEMY_VISUALS[enemy.enemyId];

        return (
          <div
            key={`damage-${enemy.instanceId}`}
            className="battleScene__enemyDamageAnchor"
            style={{
              left: `${formationPosition.xPercent}%`,
              top: `calc(${formationPosition.yPercent}% + ${Math.round(37 * formationPosition.scale)}px)`,
              transform: `translate(${visuals.damageAnchorAdjustment?.x ?? "0px"}, ${visuals.damageAnchorAdjustment?.y ?? "0px"})`,
            }}
          >
            <DamageNumber
              amount={receivedDamage.amount}
              isCritical={receivedDamage.isCritical}
              absorbedByBarrier={
                "absorbedByBarrier" in receivedDamage
                  ? receivedDamage.absorbedByBarrier
                  : 0
              }
            />
          </div>
        );
      })}

      {projectilePath && (
        <img
          key={projectilePath.key}
          className={`battleScene__projectile battleScene__projectile--${projectilePath.variant}`}
          src={projectilePath.spriteSrc}
          alt=""
          style={
            {
              width: `${projectilePath.width}px`,
              "--projectile-duration": `${projectilePath.durationMs}ms`,
              "--projectile-start-x": `${projectilePath.startX}px`,
              "--projectile-start-y": `${projectilePath.startY}px`,
              "--projectile-travel-x": `${projectilePath.endX - projectilePath.startX}px`,
              "--projectile-travel-y": `${projectilePath.endY - projectilePath.startY}px`,
              "--projectile-angle": `${projectilePath.angle}deg`,
            } as CSSProperties
          }
        />
      )}

      {upgradeSelectionIsActive &&
        upgradeCharacter &&
        (!isRest || encounterIntroComplete) && (
        <UpgradeSelection
          mode={
            isRest
              ? combatState.restStage === "choice"
                ? "restChoice"
                : "restUpgrade"
              : "victory"
          }
          characterName={upgradeCharacter.name}
          itemRewards={(() => {
            if (isRest && combatState.restStage !== "choice") {
              return [];
            }

            const itemIds = upgradeCharacterId
              ? combatState.itemRewards?.[upgradeCharacterId] ?? []
              : [];

            return itemIds.flatMap((itemId) => {
              const item = ITEM_DEFINITIONS[itemId];
              return item ? [{
                  name: item.name,
                  icon: item.icon,
                  rarity: item.rarity,
                  description: item.description,
                  useTiming: item.useTiming,
                }] : [];
            });
          })()}
          choices={upgradeChoices}
          selectedChoiceId={upgradeSelectedChoiceId}
          submitting={upgradeSubmitting}
          waitingMessage={
            isMultiplayer && localUpgradeChoiceId
              ? "Waiting for the other player..."
              : otherPlayerUpgradeReady
                ? "Other player is ready."
                : null
          }
          onSelect={(choiceId) => void selectUpgrade(choiceId)}
        />
      )}

      {isRest &&
        encounterIntroComplete &&
        (combatState.restStage === "complete" ||
          (isMultiplayer &&
            combatState.restStage === "upgrade" &&
            !upgradeCharacter)) && (
          <section className="upgradeSelection" aria-live="polite">
            <div className="upgradeSelection__panel">
              <div className="upgradeSelection__victory">
                Boss Encounter Next
              </div>
              <h1 className="upgradeSelection__title">
                Prepare for the Orc Brothers.
              </h1>
              <p className="upgradeSelection__character">
                {combatState.restStage === "complete"
                  ? "Preparations complete."
                  : "Your preparation is complete. The other player is choosing an upgrade."}
              </p>
            </div>
          </section>
        )}

      {encounter.kind === "combat" && (
        <>
          <div className="battlePrompt">{prompt}</div>
          <CommandBar
        portraitSrc={
          getPortraitSource(
            commandCharacter?.portraitId ??
              combatState.characters["character-1"].portraitId,
          )
        }
        actionsDisabled={
          !activePlayerId || gameState.phase !== "selectingActions"
        }
        abilitiesAvailable={abilitiesAvailable}
        spiritAvailable={spiritAvailable}
        ghostMode={commandCharacter?.form === "ghost"}
        ghostBoltAvailable={
          commandCharacter?.form === "ghost" && commandCharacter.pp >= 4
        }
        canReform={
          commandCharacter?.form === "ghost" &&
          commandCharacter.hp >= GHOST_MAX_HP
        }
        abilities={knownAbilities}
        spirits={knownSpirits}
        items={inventoryItems}
        battleLog={
          <CombatLog
            events={gameState.lastRoundEvents}
            getCombatantName={getCombatantName}
          />
        }
        onAttackSelect={() => {
          if (activePlayerId) {
            setSelectedItemId(null);
            setSelectedAbilityId("autoAttack");
          }
        }}
        onAbilitySelect={(abilityId) => {
          if (!activePlayerId || !commandCharacter) {
            return;
          }

          setSelectedItemId(null);
          const rank = getKnownAbilityRank(
            commandCharacter.abilityRanks,
            abilityId,
          );
          const ability = rank ? resolveAbility(abilityId, rank) : null;

          if (ability?.target === "allEnemies") {
            void submitPlayerAction(abilityId, null);
            return;
          }

          setSelectedAbilityId(abilityId);
        }}
        onSpiritSelect={(abilityId) => {
          if (!activePlayerId) {
            return;
          }

          setSelectedItemId(null);
          const ability = resolveAbility(abilityId, 1);

          if (
            ability?.target === "singleEnemy" ||
            ability?.target === "singleAlly"
          ) {
            setSelectedAbilityId(abilityId);
          } else {
            void submitPlayerAction(abilityId, null);
          }
        }}
        onItemSelect={(itemId) => {
          if (!activePlayerId || !activeCharacterId) {
            return;
          }

          const item = ITEM_DEFINITIONS[itemId];

          if (!item) {
            return;
          }

          setSelectedAbilityId(null);

          if (item.target === "self") {
            void submitPlayerItem(itemId, activeCharacterId);
            return;
          }

          if (item.target === "allEnemies" || item.target === "allAllies") {
            void submitPlayerItem(itemId, null);
            return;
          }

          setSelectedItemId(itemId);
        }}
        onDefendSelect={() => {
          if (activePlayerId && activeCharacterId) {
            setSelectedItemId(null);
            void submitPlayerAction("defend", activeCharacterId);
          }
        }}
        onGhostStrikeSelect={() => {
          if (activePlayerId) {
            setSelectedItemId(null);
            setSelectedAbilityId("ghostStrike");
          }
        }}
        onGhostBoltSelect={() => {
          if (activePlayerId) {
            setSelectedItemId(null);
            setSelectedAbilityId("ghostBolt");
          }
        }}
        onGhostHealSelect={() => {
          if (activePlayerId && activeCharacterId) {
            setSelectedItemId(null);
            void submitPlayerAction("ghostHeal", activeCharacterId);
          }
        }}
        onReform={() => {
          void selectReform();
        }}
          />
        </>
      )}
    </div>
  );
}
