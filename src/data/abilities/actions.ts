import type { AbilityDefinition } from "../../game/types";

export const ACTION_ABILITY_DEFINITIONS = {
  autoAttack: {
    id: "autoAttack",
    name: "Auto Attack",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Physical damage to one enemy.",
        description: "Attack one enemy with the equipped weapon.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 10,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
            criticalHit: {
              chance: 0.05,
              damageMultiplier: 1.5,
            },
          },
        ],
      },
    },
  },
  defend: {
    id: "defend",
    name: "Defend",
    category: "action",
    resolutionPriority: 100,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Take 50% less direct damage this round.",
        description: "Take 50% less direct damage this round.",
        ppCost: 0,
        effects: [
          {
            type: "defend",
            damageReduction: 0.5,
            duration: "round",
          },
        ],
      },
    },
  },
  gangStrike: {
    id: "gangStrike",
    name: "Gang Strike",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Physical damage that grows with the raider pack.",
        description:
          "Strike one random hero. Deals +1 damage for each other living Orc Raider.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 2,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
            damagePerOtherLivingSameEnemy: 1,
          },
        ],
      },
    },
  },
  darkBolt: {
    id: "darkBolt",
    name: "Dark Bolt",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Elemental damage to one random hero.",
        description: "Launch a bolt of dark energy at one random hero.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "elemental",
            basePower: 10,
            attackScaling: 0.5,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  gatherDreadflame: {
    id: "gatherDreadflame",
    name: "Gather Dreadflame",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Charge Dreadflame for the next round.",
        description:
          "Gather black flame. Dreadflame is unleashed on both heroes next round.",
        ppCost: 0,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "dreadflame",
          },
        ],
      },
    },
  },
  dreadflame: {
    id: "dreadflame",
    name: "Dreadflame",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Heavy magical damage to both heroes.",
        description:
          "Engulf all living heroes in black flame. Damage is reduced by Resistance.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "magical",
            basePower: 24,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  mendWounds: {
    id: "mendWounds",
    name: "Mend Wounds",
    category: "action",
    resolutionPriority: 0,
    target: "singleAlly",
    element: null,
    aiTargeting: "lowestHpPercentageLivingAlly",
    ranks: {
      1: {
        shortDescription: "Restore HP to the most wounded living ally.",
        description:
          "Restore 18 HP to the living allied orc with the lowest percentage of HP.",
        ppCost: 0,
        effects: [
          {
            type: "healing",
            basePower: 18,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
} satisfies Record<
  | "autoAttack"
  | "defend"
  | "gangStrike"
  | "darkBolt"
  | "gatherDreadflame"
  | "dreadflame"
  | "mendWounds",
  AbilityDefinition
>;
