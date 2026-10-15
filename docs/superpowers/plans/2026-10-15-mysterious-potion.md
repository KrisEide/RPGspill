# Mysterious Potion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Increase Ghost Heal to 12 and add a rare Mysterious Potion that behaves differently for living and Ghost characters.

**Architecture:** Keep the potion in the normal inventory and reward pool. Give item definitions an optional Ghost-use profile so ordinary items remain unavailable in Ghost Form while Mysterious Potion becomes an immediate Quick command backed by the owner's real inventory quantity.

**Tech Stack:** TypeScript, React, CSS, Node test runner.

**Spec:** User requirements in the active conversation on 2026-10-15.

## Global Constraints

- Ghost Heal restores 12 Ghost HP for 4 PP.
- Living use consumes an action, deals 5 direct HP damage, ignores Barrier, and reveals no effect in its inventory tooltip.
- Ghost use is Quick, restores 10 fixed Ghost HP, grants 10 Barrier, and consumes one owned potion.
- Mysterious Potion is rare but has twice Phoenix Tonic's reward weight.
- Other items remain unavailable in Ghost Form.
- Use `mysteriouspotion.png` for the inventory icon, Ghost command, and activation animation.

## Review Focus

- A Ghost cannot use ordinary inventory items.
- Repeated potion use cannot exceed inventory quantity.
- Living damage can cause the normal Ghost transition.
- Ghost healing can unlock Reform and respects the 120 HP cap.
- Singleplayer and multiplayer use the same form-specific timing rules.

---

### Task 1: Mechanics and reward frequency

**Files:** Modify `src/game/types.ts`, `src/data/items.ts`, `src/game/items/itemSystem.ts`, `src/game/combat/playerActions.ts`, `src/game/combat/resolveRound.ts`, `server/src/server.ts`, and `src/data/abilities/actions.ts`. Test `tests/mysteriousPotion.test.ts`.

- [x] Write failing tests for Ghost Heal 12, living damage, Ghost recovery and Barrier, quantity consumption, ordinary-item rejection, and reward weight.
- [x] Implement form-specific item profiles and effects.
- [x] Run the focused mechanics tests.

### Task 2: Command and animation

**Files:** Modify `src/features/battle/components/CommandBar.tsx`, `src/features/battle/BattleScreen.tsx`, `src/features/battle/data/itemVisuals.ts`, `src/features/battle/data/characterVisuals.ts`, and `src/styles/game.css`. Test `tests/mysteriousPotionVisual.test.ts`.

- [x] Write failing source-level visual tests.
- [x] Add the conditional Ghost command, quantity, icon mappings, and paced living/Ghost animations.
- [x] Run visual tests, then the complete test, lint, build, and diff checks.
