# Steam Burst Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Steam Burst as a Water damage ability that converts the battlefield's Burn effects into one strong steam explosion.

**Architecture:** Define both ranks and reward tags in the existing ability data. Extend damage resolution with a narrowly scoped Steam Burst combo that removes ordinary Burn from all enemies and emits a separate multi-target explosion event. Present the primary hit and explosion as two paced events using the supplied sprites.

**Tech Stack:** TypeScript, React, Node test runner, CSS.

**Spec:** User-approved Steam Burst design in the active conversation.

## Global Constraints

- Rank 1 costs 7 PP, deals `20 + 80% Water Power` to the selected enemy, and deals `17 + 70% Water Power` to every other enemy if the selected enemy is Burning.
- The explosion removes ordinary Burn from every enemy without producing additional explosions or Burn ticks.
- Rank 2 increases the selected hit to `24 + 90% Water Power`, the explosion to `20 + 80% Water Power`, and applies Weak to every enemy hit.
- Ordinary Burn deals 4 fixed damage per tick and ignores Resistance.
- Use `steamburst.png` for the primary hit and `steamburstburnexplosion.png` for the explosion.

## Review Focus

- No explosion and no Burn removal when the selected enemy is not Burning.
- The selected enemy must not take explosion damage.
- Every other living enemy must take one explosion hit.
- Rank 2 Weak must affect every enemy hit.
- Damage/status events must remain deterministic in multiplayer.

---

### Task 1: Mechanics and presentation

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/data/abilities/water.ts`
- Modify: `src/data/abilityRewards.ts`
- Modify: `src/game/combat/resolveRound.ts`
- Modify: `src/features/battle/data/abilityVisuals.ts`
- Modify: `src/styles/game.css`
- Create: `tests/steamBurst.test.ts`

- [x] Write failing tests for ranks, rewards, conditional Burn consumption, explosion targets, and Rank 2 Weak.
- [x] Run the focused test and confirm it fails because Steam Burst does not exist.
- [x] Implement the smallest combat-data and resolver change that passes the mechanics tests.
- [x] Add and test the two-stage supplied-sprite presentation.
- [x] Run the focused tests, complete suite, lint, and production build.
