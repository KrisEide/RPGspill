import type { AbilityDefinition } from "../../game/types";

export const WATER_ABILITY_DEFINITIONS = {
  crashingWave: {
    id: "crashingWave",
    name: "Crashing Wave",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Water damage and weaken one enemy.",
        description:
          "Strike one enemy with water and reduce the damage of its next attack by 30%.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 11,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            statusOnHit: {
              statusId: "weakened",
              magnitude: 0.3,
            },
          },
        ],
      },
      2: {
        shortDescription: "Stronger Water damage and weakening.",
        description:
          "Strike one enemy with water and reduce the damage of its next attack by 40%.",
        newEffectDescription:
          "Base Power increases to 13 and Weakened reduces the target's next attack by 40%.",
        ppCost: 5,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 13,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            statusOnHit: {
              statusId: "weakened",
              magnitude: 0.4,
            },
          },
        ],
      },
    },
  },
  tidalDrain: {
    id: "tidalDrain",
    name: "Tidal Drain",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Water damage that restores HP to one hero.",
        description:
          "Deal 10 + 50% of Water Power as Water damage to one enemy. Restore HP to yourself equal to 50% of the HP damage actually dealt.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 10,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            healingFromDamage: {
              ratio: 0.5,
              target: "self",
            },
          },
        ],
      },
      2: {
        shortDescription: "Water damage with stronger life drain.",
        description:
          "Deal 10 + 50% of Water Power as Water damage to one enemy. Restore HP to yourself equal to 75% of the HP damage actually dealt.",
        newEffectDescription:
          "Healing increases from 50% to 75% of the HP damage actually dealt.",
        ppCost: 6,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 10,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            healingFromDamage: {
              ratio: 0.75,
              target: "self",
            },
          },
        ],
      },
    },
  },
  steamBurst: {
    id: "steamBurst",
    name: "Steam Burst",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Water damage that detonates Burn into steam.",
        description:
          "Deal 20 + 80% of Water Power as Water damage. If the target is Burning, remove Burn from every enemy and deal 17 + 70% of Water Power as Water damage to all other enemies.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 20,
            attackScaling: 0,
            elementalPowerScaling: 0.8,
            steamBurst: {
              consumeStatusId: "burn",
              damageAllOtherEnemies: true,
              explosionBasePower: 17,
              explosionElementalPowerScaling: 0.7,
              consumeStatusFromAllEnemies: true,
            },
          },
        ],
      },
      2: {
        shortDescription: "Stronger steam damage that Weakens every enemy hit.",
        description:
          "Deal 24 + 90% of Water Power as Water damage and apply Weak. If the target is Burning, remove Burn from every enemy and deal 20 + 80% of Water Power as Water damage and apply Weak to all other enemies.",
        newEffectDescription:
          "Damage increases. When the steam explosion triggers, every enemy hit deals 30% less damage with its next attack.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 24,
            attackScaling: 0,
            elementalPowerScaling: 0.9,
            statusOnHit: { statusId: "weakened", magnitude: 0.3 },
            steamBurst: {
              consumeStatusId: "burn",
              damageAllOtherEnemies: true,
              explosionBasePower: 20,
              explosionElementalPowerScaling: 0.8,
              consumeStatusFromAllEnemies: true,
            },
          },
        ],
      },
    },
  },
  restoringCurrent: {
    id: "restoringCurrent",
    name: "Restoring Current",
    category: "ability",
    resolutionPriority: 0,
    target: "singleAlly",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Charge, then restore a large amount of HP.",
        description:
          "Pay 9 PP and charge for one round. On your next turn, restore 30 + 50% of Water Power as HP to yourself or your partner. Dying or becoming Stunned interrupts the charge.",
        ppCost: 9,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "restoringCurrent",
          },
          {
            type: "healing",
            basePower: 30,
            elementalPowerScaling: 0.5,
          },
        ],
      },
      2: {
        shortDescription: "Charge, then restore even more HP.",
        description:
          "Pay 9 PP and charge for one round. On your next turn, restore 40 + 50% of Water Power as HP to yourself or your partner. Dying or becoming Stunned interrupts the charge.",
        newEffectDescription:
          "Base healing increases from 30 to 40. The PP cost and charge risk are unchanged.",
        ppCost: 9,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "restoringCurrent",
          },
          {
            type: "healing",
            basePower: 40,
            elementalPowerScaling: 0.5,
          },
        ],
      },
    },
  },
  healingTide: {
    id: "healingTide",
    name: "Healing Tide",
    category: "ability",
    resolutionPriority: 0,
    target: "singleAlly",
    element: "water",
    ranks: {
      1: {
        shortDescription: "Restore HP to yourself or your partner.",
        description:
          "Restore 9 + 50% of Water Power as HP to yourself or your partner.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 9,
            elementalPowerScaling: 0.5,
          },
        ],
      },
      2: {
        shortDescription: "Restore more HP and remove Burn.",
        description:
          "Restore 12 + 50% of Water Power as HP and remove Burn from yourself or your partner.",
        newEffectDescription:
          "Base Heal increases to 12 and Healing Tide removes Burn.",
        ppCost: 5,
        effects: [
          {
            type: "healing",
            basePower: 12,
            elementalPowerScaling: 0.5,
          },
          {
            type: "cleanse",
            statusId: "burn",
          },
        ],
      },
    },
  },
} satisfies Record<
  | "crashingWave"
  | "tidalDrain"
  | "steamBurst"
  | "restoringCurrent"
  | "healingTide",
  AbilityDefinition
>;
