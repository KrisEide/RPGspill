import type {
  KnownPassives,
  PassiveDefinition,
  PassiveId,
} from "../game/types";

export const PASSIVE_DEFINITIONS: Record<PassiveId, PassiveDefinition> = {
  bloodScent: {
    id: "bloodScent",
    name: "Blood Scent",
    icon: "🩸",
    category: "bleed",
    description: "Deal 25% more direct damage to Bleeding enemies.",
    unique: true,
  },
  serratedEdge: {
    id: "serratedEdge",
    name: "Serrated Edge",
    icon: "🪚",
    category: "bleed",
    description: "Bleed you apply lasts 1 additional round.",
    unique: true,
  },
  deepWounds: {
    id: "deepWounds",
    name: "Deep Wounds",
    icon: "🩸",
    category: "bleed",
    description: "Bleed you apply deals 1 additional damage per tick.",
    unique: true,
  },
  openWound: {
    id: "openWound",
    name: "Open Wound",
    icon: "⚔️",
    category: "bleed",
    description: "Your critical hits apply Bleed.",
    unique: true,
  },
  jaggedStrikes: {
    id: "jaggedStrikes",
    name: "Jagged Strikes",
    icon: "🗡️",
    category: "bleed",
    description: "Eligible Physical hits have a 20% chance to apply Bleed.",
    unique: true,
  },
  kindling: {
    id: "kindling",
    name: "Kindling",
    icon: "🔥",
    category: "burn",
    description: "Burn you apply lasts 1 additional round.",
    unique: true,
  },
  hotterFlames: {
    id: "hotterFlames",
    name: "Hotter Flames",
    icon: "🌋",
    category: "burn",
    description: "Burn you apply deals 1 additional damage per tick.",
    unique: true,
  },
  wildfire: {
    id: "wildfire",
    name: "Wildfire",
    icon: "🔥",
    category: "burn",
    description:
      "When an enemy dies with your Burn, its remaining Burn spreads to another enemy.",
    unique: true,
  },
  flashpoint: {
    id: "flashpoint",
    name: "Flashpoint",
    icon: "💥",
    category: "burn",
    description:
      "Applying Burn to an already Burning enemy immediately triggers one Burn tick.",
    unique: true,
  },
  thorns: {
    id: "thorns",
    name: "Thorns",
    icon: "🌵",
    category: "barrier",
    description:
      "While you have Barrier, enemies that hit you take 3 fixed Physical damage.",
    unique: true,
  },
  protectedCasting: {
    id: "protectedCasting",
    name: "Protected Casting",
    icon: "🛡️",
    category: "barrier",
    description:
      "While you have Barrier, your abilities cost 1 less PP, to a minimum of 1 PP.",
    unique: true,
  },
  shelteredRecovery: {
    id: "shelteredRecovery",
    name: "Sheltered Recovery",
    icon: "🏕️",
    category: "barrier",
    description:
      "Your healing abilities and Spirits restore 5 additional HP to targets with Barrier.",
    unique: true,
  },
  triage: {
    id: "triage",
    name: "Triage",
    icon: "❤️‍🩹",
    category: "healing",
    description:
      "Your healing abilities and Spirits restore 6 additional HP to targets below 30% HP.",
    unique: true,
  },
  sharedRecovery: {
    id: "sharedRecovery",
    name: "Shared Recovery",
    icon: "🤝",
    category: "healing",
    description:
      "When your healing ability or Spirit restores HP to your ally, you also restore 5 HP.",
    unique: true,
  },
  refreshingWaters: {
    id: "refreshingWaters",
    name: "Refreshing Waters",
    icon: "💧",
    category: "healing",
    description:
      "When your healing ability or Spirit restores HP to your ally, they restore 3 PP.",
    unique: true,
  },
  lifeCurrent: {
    id: "lifeCurrent",
    name: "Life Current",
    icon: "🌊",
    category: "healing",
    description:
      "Your first successful ability or Spirit heal each combat restores 30% more HP.",
    unique: true,
  },
  lastingCare: {
    id: "lastingCare",
    name: "Lasting Care",
    icon: "🫶",
    category: "healing",
    description:
      "Whenever your healing ability or Spirit restores HP, grant the target 3 Barrier.",
    unique: true,
  },
  shieldmate: {
    id: "shieldmate",
    name: "Shieldmate",
    icon: "🛡️",
    category: "coop",
    description: "When you grant Barrier to your ally, gain 5 Barrier yourself.",
    unique: true,
  },
  leaveItToMe: {
    id: "leaveItToMe",
    name: "Leave It to Me",
    icon: "💪",
    category: "coop",
    description:
      "Defend empowers your ally's next damaging ability by 25%. The effect expires at the end of the next round.",
    unique: true,
  },
  luckyHaul: {
    id: "luckyHaul",
    name: "Lucky Haul",
    icon: "🍀",
    category: "items",
    description: "After combat, gain a 25% chance to find an additional item.",
    unique: true,
  },
};

export const PASSIVE_REWARD_POOL = Object.values(PASSIVE_DEFINITIONS);

export function createKnownPassives(passiveIds: PassiveId[]): KnownPassives {
  return Object.fromEntries(passiveIds.map((passiveId) => [passiveId, true]));
}

export function hasPassive(
  passives: KnownPassives,
  passiveId: PassiveId,
): boolean {
  return passives[passiveId] === true;
}
