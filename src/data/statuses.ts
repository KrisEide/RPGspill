import type { StatusDefinition, StatusId } from "../game/types";

export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  burn: {
    id: "burn",
    name: "Burn",
    stackingRule: "refresh",
    maxStacks: 1,
    durationRounds: 2,
    endOfRoundDamage: {
      basePower: 3,
      damageType: "elemental",
      element: "fire",
    },
  },
  bleed: {
    id: "bleed",
    name: "Bleed",
    stackingRule: "refresh",
    maxStacks: 1,
    durationRounds: 3,
    endOfRoundDamage: {
      basePower: 2,
      damageType: "physical",
      element: null,
      ignoresMitigation: true,
    },
  },
  cracked: {
    id: "cracked",
    name: "Cracked",
    stackingRule: "refresh",
    maxStacks: 1,
  },
  wet: {
    id: "wet",
    name: "Wet",
    stackingRule: "refresh",
    maxStacks: 1,
  },
  exposed: {
    id: "exposed",
    name: "Exposed",
    stackingRule: "refresh",
    maxStacks: 1,
    incomingDamageModifier: {
      multiplier: 1.25,
      triggeringAttacker: "sourcePartner",
      consumeOnTrigger: true,
    },
  },
  weakened: {
    id: "weakened",
    name: "Weakened",
    stackingRule: "refresh",
    maxStacks: 1,
    outgoingDamageModifier: {
      consumeOnNextDamageAction: true,
    },
  },
  stunned: {
    id: "stunned",
    name: "Stunned",
    stackingRule: "refresh",
    maxStacks: 1,
  },
  sleeping: {
    id: "sleeping",
    name: "Sleeping",
    stackingRule: "refresh",
    maxStacks: 1,
  },
};
