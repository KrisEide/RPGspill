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
  ghostStrike: {
    id: "ghostStrike",
    name: "Ghost Strike",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "A weak spectral strike.",
        description: "Deal 5 raw Physical damage to one enemy.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 5,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  ghostBolt: {
    id: "ghostBolt",
    name: "Ghost Bolt",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Dark damage to one enemy.",
        description: "Deal 10 raw Magical damage to one enemy.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "magical",
            basePower: 10,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  ghostHeal: {
    id: "ghostHeal",
    name: "Ghost Heal",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Restore 7 Ghost HP.",
        description: "Restore 7 Ghost HP. This is fixed Ghost recovery.",
        ppCost: 0,
        effects: [{ type: "ghostHealing", amount: 7 }],
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
  guardRally: {
    id: "guardRally",
    name: "Rally",
    category: "action",
    resolutionPriority: 0,
    target: "allAllies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Grant 10 Barrier to all enemies.",
        description: "Grant 10 Barrier to all living enemies, including the Orc Guard.",
        ppCost: 0,
        effects: [{ type: "barrier", amount: 10 }],
      },
    },
  },
  guardShieldCharge: {
    id: "guardShieldCharge",
    name: "Shield Charge",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Deal 16 raw Physical damage with a chance to Stun.",
        description:
          "Deal 16 raw Physical damage to one random hero. HP damage has a 25% chance to Stun.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 16,
            attackScaling: 0,
            elementalPowerScaling: 0,
            statusOnHpDamage: { statusId: "stunned", chance: 0.25 },
          },
        ],
      },
    },
  },
  gorakAutoAttack: {
    id: "gorakAutoAttack",
    name: "Auto Attack",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Deal 14 raw Physical damage.",
        description: "Strike one random hero for 14 raw Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 14,
            attackScaling: 0,
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
  shieldCharge: {
    id: "shieldCharge",
    name: "Shield Charge",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Deal 18 raw Physical damage and Stun on HP damage.",
        description:
          "Strike one random hero for 18 raw Physical damage. If the hit damages HP, Stun them for their next action.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 18,
            attackScaling: 0,
            elementalPowerScaling: 0,
            statusOnHpDamage: { statusId: "stunned" },
          },
        ],
      },
    },
  },
  wakeUp: {
    id: "wakeUp",
    name: "Wake Up",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Wake Brakk.",
        description: "Wake Brakk from his sleep.",
        ppCost: 0,
        effects: [{ type: "wakeEnemy", enemyId: "brakkBoss" }],
      },
    },
  },
  bloodCleave: {
    id: "bloodCleave",
    name: "Blood Cleave",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Deal 16 raw Physical damage to both heroes.",
        description:
          "Deal 16 raw Physical damage to both heroes. HP damage applies Bleed.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 16,
            attackScaling: 0,
            elementalPowerScaling: 0,
            statusOnHpDamage: { statusId: "bleed" },
          },
        ],
      },
    },
  },
  smash: {
    id: "smash",
    name: "Smash",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Deal 27 raw Physical damage.",
        description: "Smash one random hero for 27 raw Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 27,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  catchBreath: {
    id: "catchBreath",
    name: "Catch Breath",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Take no offensive action this turn.",
        description: "Brakk pauses to catch his breath.",
        ppCost: 0,
        effects: [{ type: "wait" }],
      },
    },
  },
} satisfies Record<
  | "autoAttack"
  | "defend"
  | "ghostStrike"
  | "ghostBolt"
  | "ghostHeal"
  | "gangStrike"
  | "darkBolt"
  | "gatherDreadflame"
  | "dreadflame"
  | "mendWounds"
  | "guardRally"
  | "guardShieldCharge"
  | "gorakAutoAttack"
  | "shieldCharge"
  | "wakeUp"
  | "bloodCleave"
  | "smash"
  | "catchBreath",
  AbilityDefinition
>;
