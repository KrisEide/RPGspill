import { useEffect, useReducer, useState } from "react";
import type { CSSProperties } from "react";
import background from "../../assets/backgrounds/bakgrunn1.png";
import { ENCOUNTER_DEFINITIONS } from "../../data/encounters";
import CommandBar from "./components/CommandBar";
import DamageNumber from "./components/DamageNumber";
import PartyStatusPanel from "./components/PartyStatusPanel";
import { CHARACTER_VISUALS } from "./data/characterVisuals";
import { ENEMY_VISUALS } from "./data/enemyVisuals";
import { getEnemyFormationPositions } from "./layout/enemyFormation";
import {
  createClientBattleState,
  createInitialGameState,
} from "../../game/state/initialState";
import { gameReducer } from "../../game/state/gameReducer";
import { PLAYER_ORDER } from "../../game/playerControl";
import { getPortraitSource } from "../characterSelect/data/characterOptions";
import {
  submitMultiplayerAction,
  subscribeToPlayerReadiness,
  subscribeToRoundResolved,
} from "../../network/socket";
import type { PlayerReadinessState } from "../../network/protocol";
import type {
  AbilityId,
  ClientBattleState,
  CombatState,
  CombatantId,
  EnemyInstanceId,
  GameSetup,
  PlayerId,
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
const COMBAT_EVENT_DURATION_MS = 1750;
const BACKGROUND_REVEAL_DURATION_MS = 600;
const ENCOUNTER_ANNOUNCEMENT_DURATION_MS = 3600;
const COMBAT_ENTRANCE_DURATION_MS = 2600;

type EncounterIntroPhase =
  | "background"
  | "announcement"
  | "entering"
  | "ready";

function createBattleScreenState(props: Props): ClientBattleState {
  return "setup" in props
    ? createInitialGameState(props.setup)
    : createClientBattleState(props.initialCombatState);
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
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [encounterIntroPhase, setEncounterIntroPhase] =
    useState<EncounterIntroPhase>("background");
  const isMultiplayer = "localPlayerId" in props;
  const localPlayerId = isMultiplayer ? props.localPlayerId : null;
  const combatState = gameState.combat;
  const localCharacterId = localPlayerId
    ? combatState.players[localPlayerId].controlledCharacterId
    : null;
  const localCharacter = localCharacterId
    ? combatState.characters[localCharacterId]
    : null;
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
  const currentCombatEvent = gameState.pendingRound
    ? gameState.pendingRound.result.events[
        gameState.pendingRound.nextEventIndex
      ]
    : null;
  const appliedCombatEvent = gameState.pendingRound?.currentEventApplied
    ? currentCombatEvent
    : null;
  const enemyFormationPositions = getEnemyFormationPositions(
    combatState.enemies,
  );
  const encounter = ENCOUNTER_DEFINITIONS[combatState.encounterId];
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
  }, [backgroundReady]);

  useEffect(() => {
    if (!currentCombatEvent || gameState.phase !== "animating") {
      return;
    }

    const impactTimer = window.setTimeout(() => {
      dispatch({ type: "applyCurrentCombatEvent" });
    }, COMBAT_IMPACT_DELAY_MS);
    const completeTimer = window.setTimeout(() => {
      dispatch({ type: "advanceCombatEvent" });
    }, COMBAT_EVENT_DURATION_MS);

    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(completeTimer);
    };
  }, [currentCombatEvent, gameState.phase]);

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

    return () => {
      unsubscribeFromReadiness();
      unsubscribeFromRound();
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

  const selectEnemyTarget = async (targetId: EnemyInstanceId) => {
    if (
      !activePlayerId ||
      selectedAbilityId !== "autoAttack" ||
      actionSubmitting
    ) {
      return;
    }

    if (isMultiplayer) {
      setActionSubmitting(true);
      const accepted = await submitMultiplayerAction({
        round: combatState.round,
        abilityId: selectedAbilityId,
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
      abilityId: selectedAbilityId,
      targetId,
    });
    setSelectedAbilityId(null);
  };

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
          ? `${currentCombatEvent ? getCombatantName(currentCombatEvent.actorId) : "Combat"} attacks...`
        : isMultiplayer && localPlayerReady
          ? `${commandCharacter?.name}: Waiting for the other player...`
          : selectedAbilityId === "autoAttack"
            ? `${commandCharacter?.name}: Select an enemy`
            : otherPlayerReady
              ? `Other player is ready. ${commandCharacter?.name}: Select an action`
              : `${commandCharacter?.name}: Select an action`;

  return (
    <div
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

      {gameState.lastRoundEvents.length > 0 && (
        <div className="combatLog" aria-live="polite">
          {gameState.lastRoundEvents.map((event, index) => (
            <div key={`${event.actorId}-${event.targetId}-${index}`}>
              {event.isCritical ? "Critical hit! " : ""}
              {getCombatantName(event.actorId)} dealt {event.amount} damage to{" "}
              {getCombatantName(event.targetId)}.
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
        const isAttacking = currentCombatEvent?.actorId === characterId;

        return (
          <div
            key={characterId}
            className={`battleScene__playerUnit battleScene__playerUnit--${index === 0 ? "one" : "two"} ${unitEntranceClass} ${isAttacking ? "battleScene__playerUnit--attacking" : ""}`}
          >
            <img
              className="battleScene__playerSprite battleScene__playerSprite--idle"
              src={visuals.idleSpriteSrc}
              alt=""
            />
            <img
              className="battleScene__playerSprite battleScene__playerSprite--attack"
              src={visuals.autoAttackSpriteSrc}
              alt=""
            />
            {appliedCombatEvent?.targetId === characterId && (
              <DamageNumber
                amount={appliedCombatEvent.amount}
                isCritical={appliedCombatEvent.isCritical}
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
          selectedAbilityId === "autoAttack" &&
          !actionSubmitting &&
          enemy.hp > 0;
        const isAttacking = currentCombatEvent?.actorId === enemy.instanceId;
        const visuals = ENEMY_VISUALS[enemy.enemyId];
        const formationPosition = enemyFormationPositions[index];

        return (
          <div
            key={enemy.instanceId}
            className={`battleScene__enemyUnit ${unitEntranceClass} ${canTarget ? "battleScene__enemyUnit--selectable" : ""} ${enemy.hp <= 0 ? "battleScene__enemyUnit--defeated" : ""} ${isAttacking ? "battleScene__enemyUnit--attacking" : ""}`}
            style={
              {
                left: `${formationPosition.xPercent}%`,
                top: `${formationPosition.yPercent}%`,
                "--enemy-scale": formationPosition.scale,
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
              />
              <img
                className="battleScene__enemySprite battleScene__enemySprite--attack"
                src={visuals.autoAttackSpriteSrc}
                alt=""
              />
            </div>
            <button
              type="button"
              className="battleScene__enemyHitbox"
              disabled={!canTarget}
              onClick={() => void selectEnemyTarget(enemy.instanceId)}
              aria-label={`Target level ${enemy.level} ${enemy.name}`}
            />
            {appliedCombatEvent?.targetId === enemy.instanceId && (
              <DamageNumber
                amount={appliedCombatEvent.amount}
                isCritical={appliedCombatEvent.isCritical}
              />
            )}
          </div>
        );
      })}

      <div className="battlePrompt">{prompt}</div>
      <CommandBar
        portraitSrc={
          getPortraitSource(
            commandCharacter?.portraitId ??
              combatState.characters["character-1"].portraitId,
          )
        }
        attackDisabled={
          !activePlayerId || gameState.phase !== "selectingActions"
        }
        onAttackSelect={() => {
          if (activePlayerId) {
            setSelectedAbilityId("autoAttack");
          }
        }}
      />
    </div>
  );
}
