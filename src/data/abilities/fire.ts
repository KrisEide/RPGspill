import type { AbilityDefinition } from "../../game/types";

export const FIRE_ABILITY_DEFINITIONS = {
  fireball: {
    id: "fireball",
    name: "Fireball",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Heavy Fire damage to one enemy.",
        description: "Deal heavy Fire damage to one enemy.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 18,
            attackScaling: 0,
            elementalPowerScaling: 1,
          },
        ],
      },
      2: {
        shortDescription: "Heavy Fire damage that applies Burn.",
        description:
          "Deal heavy Fire damage to one enemy and apply Burn for 2 rounds.",
        newEffectDescription:
          "Fireball applies Burn. Burn deals 4 damage at the end of the round for 2 rounds, ignores Resistance, and does not stack.",
        ppCost: 7,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 18,
            attackScaling: 0,
            elementalPowerScaling: 1,
            statusOnHit: {
              statusId: "burn",
            },
          },
        ],
      },
    },
  },
  cinderCurse: {
    id: "cinderCurse",
    name: "Cinder Curse",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Curse one enemy with lasting Fire damage.",
        description:
          "Curse one enemy. At the end of each round, it takes 8 + 20% of your Fire Power as Fire damage until it dies or combat ends.",
        ppCost: 8,
        effects: [
          {
            type: "applyStatus",
            statusId: "cinderCurse",
            tickBasePower: 8,
            elementalPowerScaling: 0.2,
          },
        ],
      },
      2: {
        shortDescription: "A stronger curse that reduces healing.",
        description:
          "Curse one enemy. At the end of each round, it takes 10 + 20% of your Fire Power as Fire damage. While cursed, it receives 50% less healing.",
        newEffectDescription:
          "Cinder Curse deals 10 base Fire damage per round and reduces healing received by 50%. Multiple Curses do not stack the healing reduction.",
        ppCost: 8,
        effects: [
          {
            type: "applyStatus",
            statusId: "cinderCurse",
            tickBasePower: 10,
            elementalPowerScaling: 0.2,
            healingReceivedMultiplier: 0.5,
          },
        ],
      },
    },
  },
  searingBrand: {
    id: "searingBrand",
    name: "Searing Brand",
    category: "ability",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "Cheap Fire damage that starts Burn.",
        description:
          "Deal 7 + 30% of Fire Power as Fire damage to one enemy and apply Burn.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0.3,
            statusOnHit: {
              statusId: "burn",
            },
          },
        ],
      },
      2: {
        shortDescription: "Stronger Fire damage that ignites new Burn at once.",
        description:
          "Deal 9 + 30% of Fire Power as Fire damage to one enemy and apply Burn. If the target was not already Burning, trigger one Burn tick immediately.",
        newEffectDescription:
          "Base Power increases to 9. Applying Burn to a target that was not already Burning immediately triggers one Burn tick.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 9,
            attackScaling: 0,
            elementalPowerScaling: 0.3,
            statusOnHit: {
              statusId: "burn",
              triggerTickIfNew: true,
            },
          },
        ],
      },
    },
  },
  twinFlames: {
    id: "twinFlames",
    name: "Twin Flames",
    category: "ability",
    resolutionPriority: 0,
    turnOrderRule: "absoluteLast",
    target: "singleEnemy",
    element: "fire",
    ranks: {
      1: {
        shortDescription: "A final Fire strike shaped by your partner's damage.",
        description:
          "Always acts last. Deal 12 + 50% of Fire Power as Fire damage. The most recent elemental damage dealt by your partner this round adds an effect: Fire strikes again, Water removes Burn and heals both heroes for 6 HP, Earth destroys up to 20 Barrier before the hit, and Wind strikes one additional enemy.",
        ppCost: 9,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 12,
            attackScaling: 0,
            elementalPowerScaling: 0.5,
            twinFlamesCombo: {
              fire: { basePower: 8, elementalPowerScaling: 0.3 },
              water: { partyHealing: 6, cleanseStatusId: "burn" },
              earth: { barrierRemoval: 20 },
              wind: { additionalEnemy: true },
              ghost: { healing: 10 },
            },
          },
        ],
      },
      2: {
        shortDescription: "A stronger final strike with improved reactions.",
        description:
          "Always acts last. Deal 14 + 60% of Fire Power as Fire damage. Fire strikes again for 10 + 40% of Fire Power, Water removes Burn and heals both heroes for 8 HP, Earth destroys up to 25 Barrier before the hit, and Wind strikes one additional enemy with the improved base hit.",
        newEffectDescription:
          "Base Power and scaling increase. The Fire follow-up, Water healing, and Earth Barrier removal also become stronger.",
        ppCost: 9,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 14,
            attackScaling: 0,
            elementalPowerScaling: 0.6,
            twinFlamesCombo: {
              fire: { basePower: 10, elementalPowerScaling: 0.4 },
              water: { partyHealing: 8, cleanseStatusId: "burn" },
              earth: { barrierRemoval: 25 },
              wind: { additionalEnemy: true },
              ghost: { healing: 10 },
            },
          },
        ],
      },
    },
  },
} satisfies Record<
  "fireball" | "cinderCurse" | "searingBrand" | "twinFlames",
  AbilityDefinition
>;
