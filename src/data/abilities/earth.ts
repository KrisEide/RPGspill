import type { AbilityDefinition } from "../../game/types";

export const EARTH_ABILITY_DEFINITIONS = {
  stonebreaker: {
    id: "stonebreaker",
    name: "Stonebreaker",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "earth",
    ranks: {
      1: {
        shortDescription: "Charge, then unleash massive Earth damage.",
        description:
          "Pay 10 PP and charge for one round. On your next turn, deal 28 + 120% of Earth Power as Earth damage to the chosen enemy. The attack cannot critically hit. Dying or becoming Stunned interrupts the charge.",
        ppCost: 10,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "stonebreaker",
          },
          {
            type: "damage",
            damageType: "elemental",
            basePower: 28,
            attackScaling: 0,
            elementalPowerScaling: 1.2,
          },
        ],
      },
      2: {
        shortDescription: "The charged hit can Stun its target.",
        description:
          "Pay 10 PP and charge for one round. On your next turn, deal 28 + 120% of Earth Power as Earth damage to the chosen enemy. If the hit deals HP damage, it has a 30% chance to Stun the target for 1 turn. The attack cannot critically hit. Dying or becoming Stunned interrupts the charge.",
        newEffectDescription:
          "If Stonebreaker deals HP damage, it has a 30% chance to Stun the target for 1 turn.",
        ppCost: 10,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "stonebreaker",
          },
          {
            type: "damage",
            damageType: "elemental",
            basePower: 28,
            attackScaling: 0,
            elementalPowerScaling: 1.2,
            statusOnHpDamage: {
              statusId: "stunned",
              chance: 0.3,
            },
          },
        ],
      },
    },
  },
  earthquake: {
    id: "earthquake",
    name: "Earthquake",
    category: "ability",
    resolutionPriority: 0,
    turnOrderRule: "alwaysLast",
    target: "allEnemies",
    element: "earth",
    ranks: {
      1: {
        shortDescription: "Heavy Earth damage to all enemies. Always acts last.",
        description:
          "Deal 13 + 100% of Earth Power as Earth damage to all enemies. Earthquake always acts last and cannot critically hit.",
        ppCost: 12,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 13,
            attackScaling: 0,
            elementalPowerScaling: 1,
          },
        ],
      },
      2: {
        shortDescription:
          "Heavy Earth damage to all enemies and leave them Cracked.",
        description:
          "Deal 13 + 100% of Earth Power as Earth damage to all enemies. Enemies hit become Cracked, reducing their Defense and Resistance by 5 until the end of the next round. Earthquake always acts last and cannot critically hit.",
        newEffectDescription:
          "Enemies hit become Cracked: -5 Defense and -5 Resistance until the end of the next round.",
        ppCost: 12,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 13,
            attackScaling: 0,
            elementalPowerScaling: 1,
            statusOnHit: {
              statusId: "cracked",
              durationRounds: 2,
            },
          },
        ],
      },
    },
  },
  rootseed: {
    id: "rootseed",
    name: "Rootseed",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "earth",
    ranks: {
      1: {
        shortDescription: "Plant a lasting damaging seed.",
        description:
          "Plant a seed in one enemy. At the end of each round, deal 6 + 10% of Earth Power as Earth damage and restore 3 HP to the caster. Lasts until the enemy dies or combat ends.",
        ppCost: 7,
        effects: [
          {
            type: "applyStatus",
            statusId: "rootseed",
            tickBasePower: 6,
            elementalPowerScaling: 0.1,
            sourceHealingPerTick: 3,
          },
        ],
      },
      2: {
        shortDescription: "The seed takes deep root in long fights.",
        description:
          "Plant a seed in one enemy. At the end of each round, deal 6 + 10% of Earth Power as Earth damage and restore 3 HP to the caster. After 3 triggers, deal 8 + 10% of Earth Power and restore 4 HP instead. Lasts until the enemy dies or combat ends.",
        newEffectDescription:
          "After Rootseed has triggered 3 times, its base damage increases to 8 and its healing increases to 4 for the rest of combat.",
        ppCost: 7,
        effects: [
          {
            type: "applyStatus",
            statusId: "rootseed",
            tickBasePower: 6,
            elementalPowerScaling: 0.1,
            sourceHealingPerTick: 3,
            empowerAfterTicks: 3,
            empoweredTickBasePower: 8,
            empoweredSourceHealingPerTick: 4,
          },
        ],
      },
    },
  },
  stonebloom: {
    id: "stonebloom",
    name: "Stonebloom",
    category: "ability",
    resolutionPriority: 0,
    target: "singleAlly",
    element: "earth",
    ranks: {
      1: {
        shortDescription: "Restore HP and grant Barrier.",
        description:
          "Restore 7 + 30% of Earth Power as HP and grant 6 Barrier to yourself or your partner.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 7,
            elementalPowerScaling: 0.3,
          },
          {
            type: "barrier",
            amount: 6,
          },
        ],
      },
      2: {
        shortDescription: "Restore HP, grant Barrier, and remove Cracked.",
        description:
          "Restore 9 + 30% of Earth Power as HP, grant 8 Barrier, and remove Cracked from yourself or your partner.",
        newEffectDescription:
          "Base Heal increases to 9, Barrier increases to 8, and Stonebloom removes Cracked.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 9,
            elementalPowerScaling: 0.3,
          },
          {
            type: "barrier",
            amount: 8,
          },
          {
            type: "cleanse",
            statusId: "cracked",
          },
        ],
      },
    },
  },
} satisfies Record<
  "earthquake" | "rootseed" | "stonebreaker" | "stonebloom",
  AbilityDefinition
>;
