# Act One Spirit Rank 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Spirit Rank 2 and the complete post-Act-1 reward sequence.

**Architecture:** Spirit state stores its rank, while rank-aware helpers resolve passive and active values. The existing reward offer and multiplayer selection pipeline carries a single Spirit Rank confirmation offer, followed by a synchronized restoration stage.

**Tech Stack:** TypeScript, React, Node test runner, Socket.IO.

**Spec:** `docs/superpowers/specs/2026-10-17-act-one-spirit-rank-two.md`

## Global Constraints

- Preserve one active use per encounter and existing timing.
- Preserve spent Phoenix state.
- Keep singleplayer and multiplayer authoritative flows equivalent.
- Do not disturb unrelated working-tree changes.

## Review Focus

- No eligible Rank 1 ability: normal boss rewards still contain three valid offers.
- A permanently dead hero does not block reward progression.
- Both players can confirm Spirit Rank 2 independently in multiplayer.
- Spirit Rank persists when Act 2 starts and encounter refresh preserves Phoenix use state.
- Restoration is visible before Act 2 begins.

---

### Task 1: Rank-aware Spirits

**Files:** Modify `src/game/types.ts`, `src/data/spirits.ts`, `src/data/abilities/spirits.ts`, Spirit consumers under `src/game`; test `tests/spiritRankTwo.test.ts`.

- [ ] Write failing tests for all nine Rank 2 values and representative combat behavior.
- [ ] Add Spirit rank state, rank-aware passive helpers, active Rank 2 definitions, and combat integration.
- [ ] Run the focused Spirit tests.

### Task 2: Act 1 reward state machine

**Files:** Modify `src/game/rewards/rewardSystem.ts`, `src/game/types.ts`, `src/features/battle/BattleScreen.tsx`, `server/src/server.ts`; test `tests/actOneCompletionRewards.test.ts`.

- [ ] Write failing tests for the guaranteed random Rank 2 offer, Spirit confirmation stage, full restoration, and preserved spent Phoenix.
- [ ] Implement the two-stage reward transition and delayed encounter start for singleplayer and multiplayer.
- [ ] Run focused progression tests.

### Task 3: Presentation and verification

**Files:** Modify `src/features/battle/components/UpgradeSelection.tsx`, add a restoration presentation component if needed, and modify `src/styles/game.css`; test `tests/actOneTransitionVisual.test.ts`.

- [ ] Write a failing presentation test.
- [ ] Show concise Spirit improvements, confirmation copy, and visible full HP/PP recovery.
- [ ] Run all tests, lint, and production build.

