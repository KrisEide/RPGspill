import { useEffect, useReducer, useState } from "react";
import background from "../../assets/backgrounds/Bakgrunn1.png";
import CommandBar from "./components/CommandBar";
import DamageNumber from "./components/DamageNumber";
import PartyStatusPanel from "./components/PartyStatusPanel";
import { CHARACTER_VISUALS } from "./data/characterVisuals";
import { ENEMY_VISUALS } from "./data/enemyVisuals";
import { createInitialGameState } from "../../game/state/initialState";
import { gameReducer } from "../../game/state/gameReducer";
import type {
  AbilityId,
  CombatantId,
  EnemyInstanceId,
  GameSetup,
  PlayerId,
} from "../../game/types";

type Props = { setup: GameSetup };

const PLAYER_ORDER: PlayerId[] = ["player1", "player2"];
const COMBAT_IMPACT_DELAY_MS = 650;
const COMBAT_EVENT_DURATION_MS = 1450;

export default function BattleScreen({ setup }: Props) {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    setup,
    createInitialGameState,
  );
  const [selectedAbilityId, setSelectedAbilityId] =
    useState<AbilityId | null>(null);
  const activePlayerId =
    gameState.phase === "selectingActions"
      ? (PLAYER_ORDER.find(
          (playerId) =>
            gameState.characters[playerId].hp > 0 &&
            gameState.roundSelections[playerId] === null,
        ) ?? null)
      : null;
  const activeCharacter = activePlayerId
    ? gameState.characters[activePlayerId]
    : null;
  const currentCombatEvent = gameState.pendingRound
    ? gameState.pendingRound.events[gameState.pendingRound.nextEventIndex]
    : null;
  const appliedCombatEvent = gameState.pendingRound?.currentEventApplied
    ? currentCombatEvent
    : null;

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

  const getCombatantName = (combatantId: CombatantId) => {
    if (combatantId === "player1" || combatantId === "player2") {
      return gameState.characters[combatantId].name;
    }

    return (
      gameState.enemies.find((enemy) => enemy.instanceId === combatantId)
        ?.name ?? "Enemy"
    );
  };

  const selectEnemyTarget = (targetId: EnemyInstanceId) => {
    if (!activePlayerId || selectedAbilityId !== "autoAttack") {
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

  const prompt =
    gameState.phase === "victory"
      ? "Victory!"
      : gameState.phase === "defeat"
        ? "Defeat"
        : gameState.phase === "animating"
          ? `${currentCombatEvent ? getCombatantName(currentCombatEvent.actorId) : "Combat"} attacks...`
        : selectedAbilityId === "autoAttack"
          ? `${activeCharacter?.name}: Select an enemy`
          : `${activeCharacter?.name}: Select an action`;

  return (
    <div
      className="battleScene"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="battleScene__overlay" />
      <PartyStatusPanel
        characters={gameState.characters}
        activePlayerId={activePlayerId}
      />

      <div className="battleRound">Round {gameState.round}</div>

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
        const character = gameState.characters[playerId];
        const visuals = CHARACTER_VISUALS[character.characterId];
        const isAttacking = currentCombatEvent?.actorId === playerId;

        return (
          <div
            key={playerId}
            className={`battleScene__playerUnit battleScene__playerUnit--${index === 0 ? "one" : "two"} ${isAttacking ? "battleScene__playerUnit--attacking" : ""}`}
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
            {appliedCombatEvent?.targetId === playerId && (
              <DamageNumber
                amount={appliedCombatEvent.amount}
                isCritical={appliedCombatEvent.isCritical}
              />
            )}
          </div>
        );
      })}
      {gameState.enemies.map((enemy) => {
        const hpPercent = Math.max(
          0,
          Math.min(100, (enemy.hp / enemy.stats.maxHp) * 100),
        );
        const canTarget =
          gameState.phase === "selectingActions" &&
          selectedAbilityId === "autoAttack" &&
          enemy.hp > 0;
        const isAttacking = currentCombatEvent?.actorId === enemy.instanceId;
        const visuals = ENEMY_VISUALS[enemy.enemyId];

        return (
          <div
            key={enemy.instanceId}
            className={`battleScene__enemyUnit ${canTarget ? "battleScene__enemyUnit--selectable" : ""} ${enemy.hp <= 0 ? "battleScene__enemyUnit--defeated" : ""} ${isAttacking ? "battleScene__enemyUnit--attacking" : ""}`}
          >
            <div className="enemyStatus">
              <div className="enemyStatus__heading">
                Lv. {enemy.level} {enemy.name}
              </div>
              <div className="enemyStatus__value">
                HP {enemy.hp} / {enemy.stats.maxHp}
              </div>
              <div className="enemyStatus__bar">
                <div
                  className="enemyStatus__barFill"
                  style={{ width: `${hpPercent}%` }}
                />
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
              onClick={() => selectEnemyTarget(enemy.instanceId)}
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
          activeCharacter?.portraitSrc ??
          gameState.characters.player1.portraitSrc
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
