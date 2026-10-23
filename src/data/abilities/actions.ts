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
    turnOrderRule: "absoluteFirst",
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
        shortDescription: "Physical damage and Ghost recovery.",
        description:
          "Deal 7 raw Physical damage to one enemy and restore 1 Ghost HP and 2 Ghost PP.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 7,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
          { type: "ghostRecoveryOnHit", amount: 1, ppAmount: 2 },
        ],
      },
    },
  },
  ghostBolt: {
    id: "ghostBolt",
    name: "Ghost Bolt",
    category: "ghostAbility",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    ranks: {
      1: {
        shortDescription: "Dark damage and Ghost recovery.",
        description:
          "Deal 14 raw Magical damage to one enemy and restore 3 Ghost HP.",
        ppCost: 4,
        effects: [
          {
            type: "damage",
            damageType: "magical",
            basePower: 14,
            attackScaling: 0,
            elementalPowerScaling: 0,
          },
          { type: "ghostRecoveryOnHit", amount: 3 },
        ],
      },
    },
  },
  possession: {
    id: "possession",
    name: "Possession",
    category: "ghostAbility",
    resolutionPriority: 1000,
    target: "singleAlly",
    element: null,
    ranks: {
      1: {
        shortDescription: "Give your living ally another action.",
        description:
          "Lose 10 Ghost HP. Your living ally immediately gains 1 additional action. Uses your action.",
        ppCost: 0,
        effects: [
          { type: "ghostHpCost", amount: 10 },
          { type: "grantAdditionalAction" },
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
        shortDescription: "Restore 12 Ghost HP.",
        description:
          "Restore 12 Ghost HP. Costs 4 Ghost PP. This is fixed Ghost recovery.",
        ppCost: 4,
        effects: [{ type: "ghostHealing", amount: 12 }],
      },
    },
  },
  greenSlimeStrongAttack: {
    id: "greenSlimeStrongAttack",
    name: "Strong Attack",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Lower Physical damage to both heroes.",
        description: "Strike both heroes for lower Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 6,
            attackScaling: 0.25,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  greenSlimeBuff: {
    id: "greenSlimeBuff",
    name: "Buff",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Gain +25% damage, up to +100%.",
        description:
          "Gain +25% damage for the rest of combat, stacking up to +100%.",
        ppCost: 0,
        effects: [
          {
            type: "applyStatus",
            statusId: "empowered",
            tickBasePower: 0,
            elementalPowerScaling: 0,
            magnitude: 0.25,
          },
        ],
      },
    },
  },
  blueSlimePoisonAttack: {
    id: "blueSlimePoisonAttack",
    name: "Poison Attack",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Damage and Poison both heroes.",
        description:
          "Deal light Magical damage to both heroes and apply Poison.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "magical",
            basePower: 6,
            attackScaling: 0,
            elementalPowerScaling: 0,
            statusOnHit: {
              statusId: "poison",
            },
          },
        ],
      },
    },
  },
  prepareSweep: {
    id: "prepareSweep",
    name: "Prepare Sweep",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Prepare a sweeping attack against both heroes.",
        description:
          "Charge Multi Attack. It will strike both living heroes next round unless interrupted.",
        ppCost: 0,
        effects: [
          {
            type: "charge",
            readiesAbilityId: "orcGruntMultiAttack",
          },
        ],
      },
    },
  },
  orcGruntMultiAttack: {
    id: "orcGruntMultiAttack",
    name: "Multi Attack",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Physical damage to both heroes.",
        description: "Slowly sweep across both heroes for Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 7,
            attackScaling: 0.25,
            elementalPowerScaling: 0,
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
  shatterWard: {
    id: "shatterWard",
    name: "Shatter Ward",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Remove all Barrier from both heroes.",
        description: "Shatter every hero's Barrier.",
        ppCost: 0,
        effects: [{ type: "removeBarrier" }],
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
        shortDescription: "Deal 15 raw Physical damage.",
        description: "Strike one random hero for 15 raw Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 15,
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
        shortDescription: "Deal 19 raw Physical damage and Stun on HP damage.",
        description:
          "Strike one random hero for 19 raw Physical damage. If the hit damages HP, Stun them for their next action.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 19,
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
        shortDescription: "Deal 17 raw Physical damage to both heroes.",
        description:
          "Deal 17 raw Physical damage to both heroes. HP damage always applies Bleed.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 17,
            attackScaling: 0,
            elementalPowerScaling: 0,
            statusOnHpDamage: { statusId: "bleed", chance: 1 },
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
        shortDescription: "Deal 28 raw Physical damage.",
        description: "Smash one random hero for 28 raw Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 28,
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
    resolutionPriority: 500,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Rest.",
        description: "Brakk rests and sheds ongoing damage effects.",
        ppCost: 0,
        effects: [{ type: "wait", cleansesDamageStatuses: true }],
      },
    },
  },
  goatStomp: {
    id: "goatStomp",
    name: "Stomp",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Mark one hero for the next Charge.",
        description:
          "Mark one random living hero for the next Charge and reduce their Defense by 5 until it hits.",
        ppCost: 0,
        effects: [{ type: "goatStompMark" }],
      },
    },
  },
  goatCharge: {
    id: "goatCharge",
    name: "Charge",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Heavy Physical damage to the Focused hero.",
        description: "Charge the hero made Focused by the other goat's Stomp.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 13,
            attackScaling: 1,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  rockwhistlerAttack: {
    id: "rockwhistlerAttack", name: "Bite", category: "action", resolutionPriority: 0,
    target: "singleEnemy", element: null, aiTargeting: "randomLivingCharacter",
    ranks: { 1: { shortDescription: "Physical damage.", description: "Bite one hero.", ppCost: 0,
      effects: [{ type: "damage", damageType: "physical", basePower: 6, attackScaling: 0.5, elementalPowerScaling: 0 }] } },
  },
  rockwhistlerPackAttack: {
    id: "rockwhistlerPackAttack", name: "Pack Attack", category: "action", resolutionPriority: 0,
    target: "singleEnemy", element: null,
    ranks: { 1: { shortDescription: "The pack focuses one hero.", description: "Attack the pack's marked hero. Defend is especially effective.", ppCost: 0,
      effects: [{ type: "damage", damageType: "physical", basePower: 6, attackScaling: 0.5, elementalPowerScaling: 0 }] } },
  },
  rockwhistlerBurrow: {
    id: "rockwhistlerBurrow", name: "Burrow", category: "action", resolutionPriority: 900,
    target: "self", element: null,
    ranks: { 1: { shortDescription: "Disappear underground.", description: "Become untargetable and prepare an Ambush.", ppCost: 0,
      effects: [{ type: "charge", readiesAbilityId: "rockwhistlerAmbush", actorStatusId: "burrowed" }] } },
  },
  rockwhistlerAmbush: {
    id: "rockwhistlerAmbush", name: "Ambush", category: "action", resolutionPriority: 900,
    target: "singleEnemy", element: null, aiTargeting: "randomLivingCharacter",
    ranks: { 1: { shortDescription: "Erupt from below.", description: "Return from underground and strike a random hero.", ppCost: 0,
      effects: [{ type: "damage", damageType: "physical", basePower: 23, attackScaling: 0.6, elementalPowerScaling: 0 }] } },
  },
  rockwhistlerCall: {
    id: "rockwhistlerCall", name: "Call", category: "action", resolutionPriority: 950,
    target: "self", element: null,
    ranks: { 1: { shortDescription: "Call two packmates.", description: "Summon two Rockwhistlers. Can happen once.", ppCost: 0,
      effects: [{ type: "summonEnemies", enemyId: "rockwhistler", count: 2 }] } },
  },
  stonejawBite: {
    id: "stonejawBite",
    name: "Stonejaw Bite",
    category: "action",
    resolutionPriority: 0,
    target: "singleEnemy",
    element: null,
    aiTargeting: "randomLivingCharacter",
    ranks: {
      1: {
        shortDescription: "Heavy Physical damage to one hero.",
        description: "Bite one random living hero for heavy Physical damage.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 12,
            attackScaling: 1,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  groundSlam: {
    id: "groundSlam",
    name: "Ground Slam",
    category: "action",
    resolutionPriority: 0,
    target: "allEnemies",
    element: null,
    ranks: {
      1: {
        shortDescription: "Moderate Physical damage to both heroes.",
        description: "Slam the ground and deal moderate Physical damage to both heroes.",
        ppCost: 0,
        effects: [
          {
            type: "damage",
            damageType: "physical",
            basePower: 8,
            attackScaling: 0.75,
            elementalPowerScaling: 0,
          },
        ],
      },
    },
  },
  rockScrape: {
    id: "rockScrape",
    name: "Rock Scrape",
    category: "action",
    resolutionPriority: 0,
    target: "self",
    element: null,
    ranks: {
      1: {
        shortDescription: "Restore 20 HP, cleanse debuffs, and shed 4 Defense.",
        description: "Restore 20 HP, remove all debuffs, and permanently lose 4 Defense, down to 8.",
        ppCost: 0,
        effects: [
          {
            type: "wait",
            cleansesNegativeStatuses: true,
            healingAmount: 20,
            defenseReduction: 4,
            minimumDefense: 8,
          },
        ],
      },
    },
  },
} satisfies Record<
  | "autoAttack"
  | "defend"
  | "ghostStrike"
  | "ghostBolt"
  | "ghostHeal"
  | "possession"
  | "greenSlimeStrongAttack"
  | "greenSlimeBuff"
  | "blueSlimePoisonAttack"
  | "prepareSweep"
  | "orcGruntMultiAttack"
  | "gangStrike"
  | "darkBolt"
  | "shatterWard"
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
  | "catchBreath"
  | "goatStomp"
  | "goatCharge"
  | "rockwhistlerAttack"
  | "rockwhistlerPackAttack"
  | "rockwhistlerBurrow"
  | "rockwhistlerAmbush"
  | "rockwhistlerCall"
  | "stonejawBite"
  | "groundSlam"
  | "rockScrape",
  AbilityDefinition
>;
