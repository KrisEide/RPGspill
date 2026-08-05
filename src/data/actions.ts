import type { AbilityDefinition, AbilityId } from "../game/types";

export const ABILITIES = {
  autoAttack: {
    id: "autoAttack",
    name: "Auto Attack",
    description: "Attack one enemy with the equipped weapon.",
    ppCost: 0,
    target: "singleEnemy",
    element: null,
    effects: [
      {
        type: "damage",
        damageType: "physical",
        basePower: 5,
        attackScaling: 1,
        elementalPowerScaling: 0,
        criticalHit: {
          chance: 0.05,
          damageMultiplier: 1.5,
        },
      },
    ],
  },
} satisfies Record<AbilityId, AbilityDefinition>;
