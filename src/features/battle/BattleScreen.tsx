import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import background from "../../assets/backgrounds/bakgrunn1.png";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import { ENEMY_DEFINITIONS } from "../../data/monsters";
import { PLACEHOLDER_UPGRADE_CHOICES } from "../../data/upgrades";
import CommandBar from "./components/CommandBar";
import DamageNumber from "./components/DamageNumber";
import PartyStatusPanel from "./components/PartyStatusPanel";
import UpgradeSelection from "./components/UpgradeSelection";
import { CHARACTER_VISUALS } from "./data/characterVisuals";
import { ABILITY_VISUALS } from "./data/abilityVisuals";
import { ENEMY_VISUALS } from "./data/enemyVisuals";
import { getEnemyFormationPositions } from "./layout/enemyFormation";
import {
  createClientBattleState,
  createInitialGameState,
} from "../../game/state/initialState";
import { gameReducer } from "../../game/state/gameReducer";
import { startEncounter } from "../../game/state/encounterState";
import {
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
  submitMultiplayerUpgrade,
  subscribeToEncounterStarted,
  subscribeToPlayerReadiness,
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
  PlayerId,
  UpgradeChoiceId,
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
  variant: "fire" | "dark";
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
    return event.targetId === targetId ? event : null;
  }

  if (event?.type === "multiTargetDamage") {
    return (
      event.impacts.find((impact) => impact.targetId === targetId) ?? null
    );
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

export default function BattleScreen(props: Props) {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    props,
    createBattleScreenState,
  );
  const [selectedAbilityId, setSelectedAbilityId] =
    useState<AbilityId | null>(null);
  const [playerReadiness, setPlayerReadiness] =
    useState<PlayerReadinessState | null>(null);
  const [upgradeReadiness, setUpgradeReadiness] =
    useState<UpgradeReadinessState | null>(null);
  const [localUpgradeChoiceId, setLocalUpgradeChoiceId] =
    useState<UpgradeChoiceId | null>(null);
  const [singlePlayerUpgradeSelections, setSinglePlayerUpgradeSelections] =
    useState<Record<CharacterInstanceId, UpgradeChoiceId | null>>({
      "character-1": null,
      "character-2": null,
    });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [encounterIntroPhase, setEncounterIntroPhase] =
    useState<EncounterIntroPhase>("background");
  const [projectilePath, setProjectilePath] =
    useState<ProjectilePath | null>(null);
  const battleSceneRef = useRef<HTMLDivElement>(null);
  const combatantElementRefs = useRef(
    new Map<CombatantId, HTMLDivElement>(),
  );
  const isMultiplayer = "localPlayerId" in props;
  const localPlayerId = isMultiplayer ? props.localPlayerId : null;
  const combatState = gameState.combat;
  const encounter = ENCOUNTER_DEFINITIONS[combatState.encounterId];
  const nextEncounterId = encounter.nextEncounterId;
  const localCharacterId = localPlayerId
    ? combatState.players[localPlayerId].controlledCharacterId
    : null;
  const localCharacter = localCharacterId
    ? combatState.characters[localCharacterId]
    : null;
  const upgradeSelectionIsActive =
    gameState.phase === "victory" && nextEncounterId !== null;
  const singlePlayerUpgradePlayerId = !isMultiplayer
    ? (PLAYER_ORDER.find((playerId) => {
        const characterId =
          combatState.players[playerId].controlledCharacterId;
        return singlePlayerUpgradeSelections[characterId] === null;
      }) ?? null)
    : null;
  const upgradeCharacterId = isMultiplayer
    ? localCharacterId
    : singlePlayerUpgradePlayerId
      ? combatState.players[singlePlayerUpgradePlayerId].controlledCharacterId
      : null;
  const upgradeCharacter = upgradeCharacterId
    ? combatState.characters[upgradeCharacterId]
    : null;
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
                gameState.roundSelections[characterId] === null
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
    ? hasKnownAbilityInCategory(commandCharacter.abilityRanks, "ability")
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

          return ability?.category === "ability"
            ? [
                {
                  id: ability.id,
                  name: ability.name,
                  description: ability.description,
                  ppCost: ability.ppCost,
                  rank: ability.rank,
                  icon: visuals?.icon ?? "✦",
                  available: commandCharacter.pp >= ability.ppCost,
                },
              ]
            : [];
        },
      )
    : [];
  const spiritAvailable = commandCharacter
    ? hasKnownAbilityInCategory(commandCharacter.abilityRanks, "spirit")
    : false;
  const currentCombatEvent = gameState.pendingRound
    ? gameState.pendingRound.result.events[
        gameState.pendingRound.nextEventIndex
      ]
    : null;
  const currentAbilityVisuals =
    currentCombatEvent?.type === "damage" ||
    currentCombatEvent?.type === "multiTargetDamage"
      ? ABILITY_VISUALS[currentCombatEvent.abilityId]
      : null;
  const projectileOrigin = getProjectileOrigin(
    currentCombatEvent,
    combatState,
  );
  const appliedCombatEvent = gameState.pendingRound?.currentEventApplied
    ? currentCombatEvent
    : null;
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
  const enemyFormationPositions = getEnemyFormationPositions(
    combatState.enemies,
  );
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
      const startX =
        actorRect.left - sceneRect.left + actorRect.width * origin.xRatio;
      const startY =
        actorRect.top - sceneRect.top + actorRect.height * origin.yRatio;
      const endX =
        targetRect.left - sceneRect.left + targetRect.width * 0.5;
      const endY =
        targetRect.top - sceneRect.top + targetRect.height * 0.62;

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
    combatState.round,
    currentCombatEvent,
    gameState.pendingRound?.nextEventIndex,
    projectileOrigin,
  ]);

  useEffect(() => {
    const backgroundImage = new Image();
    const finishLoading = () => {
      setBackgroundReady(true);
    };

    backgroundImage.addEventListener("load", finishLoading);
    backgroundImage.addEventListener("error", finishLoading);
    backgroundImage.src = background;

    if (backgroundImage.complete) {
      finishLoading();
    }

    return () => {
      backgroundImage.removeEventListener("load", finishLoading);
      backgroundImage.removeEventListener("error", finishLoading);
    };
  }, []);

  useEffect(() => {
    if (!backgroundReady) {
      return;
    }

    const announcementTimer = window.setTimeout(() => {
      setEncounterIntroPhase("announcement");
    }, BACKGROUND_REVEAL_DURATION_MS);
    const entranceTimer = window.setTimeout(
      () => {
        setEncounterIntroPhase("entering");
      },
      BACKGROUND_REVEAL_DURATION_MS + ENCOUNTER_ANNOUNCEMENT_DURATION_MS,
    );
    const readyTimer = window.setTimeout(
      () => {
        setEncounterIntroPhase("ready");
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
    const impactDelay = isDefendEvent
      ? DEFEND_EFFECT_DELAY_MS
      : (currentAbilityVisuals?.timing?.impactDelayMs ??
        COMBAT_IMPACT_DELAY_MS);
    const eventDuration = isDefendEvent
      ? DEFEND_EVENT_DURATION_MS
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
      dispatch({ type: "receiveRoundResult", result });
    });
    const unsubscribeFromUpgradeReadiness = subscribeToUpgradeReadiness(
      setUpgradeReadiness,
    );
    const unsubscribeFromEncounter = subscribeToEncounterStarted(
      (nextCombatState) => {
        setEncounterIntroPhase("background");
        setPlayerReadiness(null);
        setUpgradeReadiness(null);
        setLocalUpgradeChoiceId(null);
        setSelectedAbilityId(null);
        dispatch({
          type: "startEncounter",
          combatState: nextCombatState,
        });
      },
    );

    return () => {
      unsubscribeFromReadiness();
      unsubscribeFromRound();
      unsubscribeFromUpgradeReadiness();
      unsubscribeFromEncounter();
    };
  }, [isMultiplayer]);

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

  const selectEnemyTarget = async (targetId: EnemyInstanceId) => {
    if (!selectedAbilityId || !commandCharacter) {
      return;
    }

    const selectedRank = getKnownAbilityRank(
      commandCharacter.abilityRanks,
      selectedAbilityId,
    );
    const selectedAbility = selectedRank
      ? resolveAbility(selectedAbilityId, selectedRank)
      : null;

    if (selectedAbility?.target !== "singleEnemy") {
      return;
    }

    await submitPlayerAction(selectedAbilityId, targetId);
  };

  const selectUpgrade = async (choiceId: UpgradeChoiceId) => {
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
    const bothCharactersSelected = Object.values(nextSelections).every(
      (selection) => selection !== null,
    );

    if (!bothCharactersSelected) {
      setSinglePlayerUpgradeSelections(nextSelections);
      return;
    }

    if (!nextEncounterId) {
      return;
    }

    setEncounterIntroPhase("background");
    setSinglePlayerUpgradeSelections({
      "character-1": null,
      "character-2": null,
    });
    dispatch({
      type: "startEncounter",
      combatState: startEncounter(combatState, nextEncounterId),
    });
  };

  const selectedRank =
    selectedAbilityId && commandCharacter
      ? getKnownAbilityRank(
          commandCharacter.abilityRanks,
          selectedAbilityId,
        )
      : null;
  const selectedAbility =
    selectedAbilityId && selectedRank
      ? resolveAbility(selectedAbilityId, selectedRank)
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
          ? currentCombatEvent?.type === "defend"
            ? `${getCombatantName(currentCombatEvent.actorId)} defends...`
            : currentCombatEvent
              ? `${getCombatantName(currentCombatEvent.actorId)} uses ${resolveAbility(currentCombatEvent.abilityId, currentCombatEvent.abilityRank)?.name ?? "an ability"}...`
              : "Combat..."
        : isMultiplayer && localPlayerReady
          ? `${commandCharacter?.name}: Waiting for the other player...`
          : selectedAbility?.target === "singleEnemy"
            ? `${commandCharacter?.name}: Select an enemy for ${selectedAbility.name}`
            : otherPlayerReady
              ? `Other player is ready. ${commandCharacter?.name}: Select an action`
              : `${commandCharacter?.name}: Select an action`;

  return (
    <div
      ref={battleSceneRef}
      className={`battleScene ${interfaceIsVisible ? "battleScene--interface-visible" : ""}`}
      style={{ backgroundImage: `url(${background})` }}
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
              Encounter {encounter.number}
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

      <div className="battleRound">Round {combatState.round}</div>

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

      {gameState.lastRoundEvents.length > 0 && (
        <div className="combatLog" aria-live="polite">
          {gameState.lastRoundEvents.map((event, index) => (
            <div key={`${event.actorId}-${event.abilityId}-${index}`}>
              {event.type === "defend" ? (
                <>{getCombatantName(event.actorId)} is defending.</>
              ) : event.type === "multiTargetDamage" ? (
                <>
                  {getCombatantName(event.actorId)} used{" "}
                  {resolveAbility(event.abilityId, event.abilityRank)?.name} and
                  hit {event.impacts.length} enemies.
                </>
              ) : (
                <>
                  {event.isCritical ? "Critical hit! " : ""}
                  {getCombatantName(event.actorId)} dealt {event.amount} damage
                  to {getCombatantName(event.targetId)}.
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="battle__content">{/* her kommer sprites/targets */}</div>
      {PLAYER_ORDER.map((playerId, index) => {
        const characterId =
          combatState.players[playerId].controlledCharacterId;
        const character = combatState.characters[characterId];
        const visuals = CHARACTER_VISUALS[character.presetId];
        const isAttacking =
          (currentCombatEvent?.type === "damage" ||
            currentCombatEvent?.type === "multiTargetDamage") &&
          currentCombatEvent.actorId === characterId;
        const activeAbilityVisuals = isAttacking
          ? ABILITY_VISUALS[currentCombatEvent.abilityId]
          : null;
        const isCasting = activeAbilityVisuals?.animation === "cast";
        const isReleasingProjectile = Boolean(
          isCasting && activeAbilityVisuals?.projectile,
        );
        const isUsingWhirlwind =
          activeAbilityVisuals?.animation === "whirlwind";
        const actionSpriteSrc = isAttacking
          ? (visuals.abilitySpriteSrcs[currentCombatEvent.abilityId] ??
            visuals.autoAttackSpriteSrc)
          : visuals.autoAttackSpriteSrc;
        const actionSpriteAdjustment = isAttacking
          ? visuals.abilitySpriteAdjustments[currentCombatEvent.abilityId]
          : null;
        const isDefending = defendingCombatantIds.has(characterId);
        const receivedDamage = getDamageImpactForTarget(
          appliedCombatEvent,
          characterId,
        );
        const receivedImpactVisuals =
          receivedDamage &&
          appliedCombatEvent &&
          appliedCombatEvent.type !== "defend"
            ? ABILITY_VISUALS[appliedCombatEvent.abilityId]
            : null;
        const isDarkImpact = receivedImpactVisuals?.impact === "dark";

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
            className={`battleScene__playerUnit battleScene__playerUnit--${index === 0 ? "one" : "two"} ${unitEntranceClass} ${isAttacking ? "battleScene__playerUnit--acting" : ""} ${isAttacking && !isCasting && !isUsingWhirlwind ? "battleScene__playerUnit--attacking" : ""} ${isCasting ? "battleScene__playerUnit--casting" : ""} ${isReleasingProjectile ? "battleScene__playerUnit--projectile-casting" : ""} ${isUsingWhirlwind ? "battleScene__playerUnit--whirlwind" : ""} ${isDefending ? "battleScene__playerUnit--defending" : ""} ${isDarkImpact ? "battleScene__playerUnit--darkImpact" : ""}`}
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
              src={visuals.idleSpriteSrc}
              alt=""
            />
            <img
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
            {receivedDamage && (
              <DamageNumber
                amount={receivedDamage.amount}
                isCritical={receivedDamage.isCritical}
              />
            )}
          </div>
        );
      })}
      {combatState.enemies.map((enemy, index) => {
        const hpPercent = Math.max(
          0,
          Math.min(100, (enemy.hp / enemy.stats.maxHp) * 100),
        );
        const canTarget =
          gameState.phase === "selectingActions" &&
          Boolean(activePlayerId) &&
          selectedAbility?.target === "singleEnemy" &&
          !actionSubmitting &&
          enemy.hp > 0;
        const isAttacking =
          (currentCombatEvent?.type === "damage" ||
            currentCombatEvent?.type === "multiTargetDamage") &&
          currentCombatEvent.actorId === enemy.instanceId;
        const visuals = ENEMY_VISUALS[enemy.enemyId];
        const enemyDefinition = ENEMY_DEFINITIONS[enemy.enemyId];
        const passiveTooltipId = enemyDefinition.passive
          ? `enemy-passive-${enemy.instanceId}`
          : undefined;
        const receivedDamage = getDamageImpactForTarget(
          appliedCombatEvent,
          enemy.instanceId,
        );
        const impactVisuals =
          receivedDamage &&
          appliedCombatEvent &&
          appliedCombatEvent.type !== "defend"
            ? ABILITY_VISUALS[appliedCombatEvent.abilityId]
            : null;
        const isFireImpact = impactVisuals?.impact === "fire";
        const activeAbilityVisuals = isAttacking
          ? ABILITY_VISUALS[currentCombatEvent.abilityId]
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
            className={`battleScene__enemyUnit ${unitEntranceClass} ${canTarget ? "battleScene__enemyUnit--selectable" : ""} ${enemy.hp <= 0 ? "battleScene__enemyUnit--defeated" : ""} ${isAttacking ? "battleScene__enemyUnit--attacking" : ""} ${isProjectileCasting ? "battleScene__enemyUnit--projectile-casting" : ""} ${projectileVariant ? `battleScene__enemyUnit--projectile-${projectileVariant}` : ""} ${isFireImpact ? "battleScene__enemyUnit--fireImpact" : ""}`}
            style={
              {
                left: `${formationPosition.xPercent}%`,
                top: `${formationPosition.yPercent}%`,
                "--enemy-scale": formationPosition.scale,
                "--enemy-sprite-scale": visuals.spriteScale ?? 1,
                "--enemy-status-top": visuals.statusTop,
                "--action-animation-duration": `${activeAbilityVisuals?.timing?.animationDurationMs ?? COMBAT_EVENT_DURATION_MS}ms`,
                zIndex: formationPosition.zIndex,
              } as CSSProperties
            }
          >
            <div className="enemyStatus">
              <div className="enemyStatus__heading">
                Lv. {enemy.level} {enemy.name}
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
                src={visuals.idleSpriteSrc}
                alt=""
                style={visuals.idleSpriteAdjustment}
              />
              <img
                className="battleScene__enemySprite battleScene__enemySprite--attack"
                src={visuals.autoAttackSpriteSrc}
                alt=""
                style={visuals.attackSpriteAdjustment}
              />
            </div>
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

      {combatState.enemies.map((enemy, index) => {
        const receivedDamage = getDamageImpactForTarget(
          appliedCombatEvent,
          enemy.instanceId,
        );

        if (!receivedDamage) {
          return null;
        }

        const formationPosition = enemyFormationPositions[index];

        return (
          <div
            key={`damage-${enemy.instanceId}`}
            className="battleScene__enemyDamageAnchor"
            style={{
              left: `${formationPosition.xPercent}%`,
              top: `calc(${formationPosition.yPercent}% + ${Math.round(37 * formationPosition.scale)}px)`,
            }}
          >
            <DamageNumber
              amount={receivedDamage.amount}
              isCritical={receivedDamage.isCritical}
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

      {upgradeSelectionIsActive && upgradeCharacter && (
        <UpgradeSelection
          characterName={upgradeCharacter.name}
          choices={PLACEHOLDER_UPGRADE_CHOICES}
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
        abilities={knownAbilities}
        onAttackSelect={() => {
          if (activePlayerId) {
            setSelectedAbilityId("autoAttack");
          }
        }}
        onAbilitySelect={(abilityId) => {
          if (!activePlayerId || !commandCharacter) {
            return;
          }

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
        onDefendSelect={() => {
          if (activePlayerId && activeCharacterId) {
            void submitPlayerAction("defend", activeCharacterId);
          }
        }}
      />
    </div>
  );
}
