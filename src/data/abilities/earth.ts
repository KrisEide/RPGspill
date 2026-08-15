import type { AbilityDefinition } from "../../game/types";

export const EARTH_ABILITY_DEFINITIONS = {
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
} satisfies Record<"stonebloom", AbilityDefinition>;
