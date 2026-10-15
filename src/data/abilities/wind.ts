import type { AbilityDefinition } from "../../game/types";

export const WIND_ABILITY_DEFINITIONS = {
  windSlash: {
    id: "windSlash",
    name: "Wind Slash",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Wind damage with a high critical hit chance.",
        description:
          "Slash one enemy with wind. This ability has a high critical hit chance.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 12,
            attackScaling: 0.4,
            elementalPowerScaling: 0.3,
            criticalHit: {
              chance: 0.25,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
      2: {
        shortDescription:
          "High critical hit chance. Critical hits also Expose the enemy.",
        description:
          "Slash one enemy with wind with a high critical hit chance. Critical hits Expose the target for your partner.",
        newEffectDescription:
          "Critical hits apply Exposed. Your partner's next attack against that target deals 25% more damage.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 14,
            attackScaling: 0.4,
            elementalPowerScaling: 0.3,
            criticalHit: {
              chance: 0.35,
              damageMultiplier: 1.5,
            },
            statusOnCriticalHit: "exposed",
          },
        ],
      },
    },
  },
  razorGale: {
    id: "razorGale",
    name: "Razor Gale",
    category: "ability",
    resolutionPriority: 0,
    target: "allEnemies",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Wind damage to all enemies. Can critically hit.",
        description:
          "Strike all enemies for 7 + 40% of Wind Power as Wind damage. Each target can be critically hit independently.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
      2: {
        shortDescription:
          "Strike all enemies twice. Every hit can critically hit.",
        description:
          "Strike all enemies twice for 7 + 40% of Wind Power as Wind damage per hit. Every hit rolls damage variance and critical chance independently.",
        newEffectDescription:
          "Razor Gale now strikes twice. Each hit can critically hit independently.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.4,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
    },
  },
  cyclone: {
    id: "cyclone",
    name: "Cyclone",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Strike three times and continue onto new enemies.",
        description:
          "Strike three times for 6 + 40% of Wind Power as Wind damage per hit. Each hit can critically hit. If a target dies, remaining hits move to another random living enemy.",
        ppCost: 8,
        effects: [0, 1, 2].map((multiHitIndex) => ({
          type: "damage" as const,
          damageType: "elemental" as const,
          basePower: 6,
          attackScaling: 0,
          elementalPowerScaling: 0.4,
          criticalHit: {
            chance: 0.05,
            damageMultiplier: 1.5,
          },
          retargetOnDefeat: true,
          multiHitIndex,
        })),
      },
      2: {
        shortDescription: "Strike three times with greater Wind damage.",
        description:
          "Strike three times for 8 + 50% of Wind Power as Wind damage per hit. Each hit can critically hit. If a target dies, remaining hits move to another random living enemy.",
        newEffectDescription:
          "Each hit increases to 8 base damage and 50% Wind Power scaling.",
        ppCost: 8,
        effects: [0, 1, 2].map((multiHitIndex) => ({
          type: "damage" as const,
          damageType: "elemental" as const,
          basePower: 8,
          attackScaling: 0,
          elementalPowerScaling: 0.5,
          criticalHit: {
            chance: 0.05,
            damageMultiplier: 1.5,
          },
          retargetOnDefeat: true,
          multiHitIndex,
        })),
      },
    },
  },
  backwind: {
    id: "backwind",
    name: "Backwind",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "wind",
    ranks: {
      1: {
        shortDescription: "Wind damage empowered by your partner's Wind damage.",
        description:
          "Deal 12 + 60% of Wind Power as Wind damage. If your partner dealt Wind damage earlier this round, deal 50% more damage. This ability can critically hit.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 12,
            attackScaling: 0,
            elementalPowerScaling: 0.6,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
            partnerElementDamageBonus: {
              element: "wind",
              multiplier: 1.5,
            },
          },
        ],
      },
      2: {
        shortDescription: "Partner Wind damage grants a much stronger attack.",
        description:
          "Deal 12 + 60% of Wind Power as Wind damage. If your partner dealt Wind damage earlier this round, deal 75% more damage. This ability can critically hit.",
        newEffectDescription:
          "The coordinated Wind damage bonus increases from 50% to 75%.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 12,
            attackScaling: 0,
            elementalPowerScaling: 0.6,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
            partnerElementDamageBonus: {
              element: "wind",
              multiplier: 1.75,
            },
          },
        ],
      },
    },
  },
} satisfies Record<
  "windSlash" | "razorGale" | "cyclone" | "backwind",
  AbilityDefinition
>;
