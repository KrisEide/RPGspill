import type { AbilityDefinition } from "../../game/types";

export const PHYSICAL_ABILITY_DEFINITIONS = {
  sacrificialStrike: {
    id: "sacrificialStrike",
    name: "Sacrificial Strike",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "A powerful strike that costs 10 HP.",
        description:
          "Deal heavy Physical damage to one enemy, then lose 10 HP. The HP loss bypasses Barrier and can send you into Ghost Form. This ability can critically hit.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 17,
            attackScaling: 0.7,
            elementalPowerScaling: 0,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
          {
            type: "selfHpDamage",
            amount: 10,
            timing: "afterDamage",
          },
        ],
      },
    },
  },
  lacerate: {
    id: "lacerate",
    name: "Lacerate",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Physical damage that applies Bleed. Can critically hit.",
        description:
          "Deal Physical damage to one enemy and apply Bleed for 3 rounds. This ability can critically hit.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 11,
            attackScaling: 1,
            elementalPowerScaling: 0,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
            statusOnHit: { statusId: "bleed" },
          },
        ],
      },
      2: {
        shortDescription:
          "Stronger damage that tears open an existing Bleed. Can critically hit.",
        description:
          "Deal Physical damage to one enemy and apply Bleed. If the target was already Bleeding, trigger one Bleed tick immediately. This ability can critically hit.",
        newEffectDescription:
          "Base Power increases to 14. Hitting an already Bleeding target triggers one Bleed tick immediately.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 14,
            attackScaling: 1,
            elementalPowerScaling: 0,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
            statusOnHit: {
              statusId: "bleed",
              triggerTickIfAlreadyActive: true,
            },
          },
        ],
      },
    },
  },
  whirlwind: {
    id: "whirlwind",
    name: "Whirlwind",
    category: "ability",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Physical damage to all enemies.",
        description: "Deal physical damage to all enemies.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 5,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
          },
        ],
      },
      2: {
        shortDescription: "Stronger physical damage that can spread Burn.",
        description:
          "Deal physical damage to all enemies. If an enemy is Burning, spread Burn to one additional enemy.",
        newEffectDescription:
          "Base Power increases to 6. If at least one enemy is Burning, Whirlwind spreads Burn to one random living enemy that is not already Burning.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 6,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
            spreadStatus: {
              statusId: "burn",
              maxAdditionalTargets: 1,
            },
          },
        ],
      },
    },
  },
} satisfies Record<
  "sacrificialStrike" | "lacerate" | "whirlwind",
  AbilityDefinition
>;
