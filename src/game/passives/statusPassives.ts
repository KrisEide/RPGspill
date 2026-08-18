import { STATUS_DEFINITIONS } from "../../data/statuses";
import {
  getStatusDurationForSource,
  getStatusTickPowerForSource,
} from "./passiveSystem";
import type {
  ActiveStatus,
  CombatState,
  CombatantId,
  StatusId,
} from "../types";

export function createStatusFromSource(
  state: CombatState,
  sourceId: CombatantId,
  statusId: StatusId,
  options: {
    magnitude?: number;
    durationRounds?: number;
    tickBasePower?: number;
  } = {},
): ActiveStatus {
  const definition = STATUS_DEFINITIONS[statusId];
  const baseDuration =
    options.durationRounds ?? definition.durationRounds;
  const baseTickPower =
    options.tickBasePower ?? definition.endOfRoundDamage?.basePower;
  const fullDurationRounds =
    baseDuration === undefined
      ? undefined
      : getStatusDurationForSource(
          state,
          sourceId,
          statusId,
          baseDuration,
        );
  const tickBasePower =
    baseTickPower === undefined
      ? undefined
      : getStatusTickPowerForSource(
          state,
          sourceId,
          statusId,
          baseTickPower,
        );

  return {
    id: statusId,
    sourceId,
    appliedRound: state.round,
    magnitude: options.magnitude,
    remainingRounds: fullDurationRounds,
    fullDurationRounds,
    tickBasePower,
  };
}

function isIncomingStatusAtLeastAsStrong(
  existing: ActiveStatus,
  incoming: ActiveStatus,
) {
  const existingPower = existing.tickBasePower ?? 0;
  const incomingPower = incoming.tickBasePower ?? 0;

  if (incomingPower !== existingPower) {
    return incomingPower > existingPower;
  }

  return (
    (incoming.fullDurationRounds ?? incoming.remainingRounds ?? 0) >=
    (existing.fullDurationRounds ?? existing.remainingRounds ?? 0)
  );
}

export function refreshStatusWithoutDowngrade(
  existing: ActiveStatus | undefined,
  incoming: ActiveStatus,
): ActiveStatus {
  if (!existing || isIncomingStatusAtLeastAsStrong(existing, incoming)) {
    return incoming;
  }

  return {
    ...existing,
    appliedRound: incoming.appliedRound,
    remainingRounds:
      existing.fullDurationRounds ?? existing.remainingRounds,
  };
}
