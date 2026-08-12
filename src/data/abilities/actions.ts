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
} satisfies Record<
  "autoAttack" | "defend" | "gangStrike" | "darkBolt",
  AbilityDefinition
>;
