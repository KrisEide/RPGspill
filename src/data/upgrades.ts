import type { StatRewardOffer, StatUpgradeId } from "../game/types";

export const STAT_UPGRADE_DEFINITIONS: Record<
  StatUpgradeId,
  StatRewardOffer
> = {
  vitality: {
    id: "vitality",
    type: "stat",
    icon: "❤️",
    title: "Vitality",
    description: "Permanently gain +10 Max HP and restore 10 HP.",
    tags: ["hp", "low_hp"],
    effect: {
      target: "maxHp",
      amount: 10,
      restoreHp: 10,
    },
  },
  power: {
    id: "power",
    type: "stat",
    icon: "⚔️",
    title: "Power",
    description: "Permanently gain +4 Attack.",
    tags: ["attack", "physical", "damage"],
    effect: {
      target: "attack",
      amount: 4,
    },
  },
  quickness: {
    id: "quickness",
    type: "stat",
    icon: "⚡",
    title: "Quickness",
    description: "Permanently gain +5 Agility.",
    tags: ["agility", "opener"],
    effect: {
      target: "agility",
      amount: 5,
    },
  },
  fortitude: {
    id: "fortitude",
    type: "stat",
    icon: "🛡️",
    title: "Fortitude",
    description: "Permanently gain +5 Defense.",
    tags: ["defense", "physical"],
    effect: {
      target: "defense",
      amount: 5,
    },
  },
  warding: {
    id: "warding",
    type: "stat",
    icon: "🔮",
    title: "Warding",
    description: "Permanently gain +5 Resistance.",
    tags: ["resistance", "magical"],
    effect: {
      target: "resistance",
      amount: 5,
    },
  },
  focus: {
    id: "focus",
    type: "stat",
    icon: "💠",
    title: "Focus",
    description: "Permanently gain +10 Max PP and restore 5 PP.",
    tags: ["pp", "high_cost"],
    effect: {
      target: "maxPp",
      amount: 10,
      restorePp: 5,
    },
  },
  precision: {
    id: "precision",
    type: "stat",
    icon: "🎯",
    title: "Precision",
    description: "Permanently gain +10% Critical Hit Chance.",
    tags: ["crit", "wind"],
    effect: {
      target: "criticalChance",
      amount: 0.1,
    },
  },
  "flame-affinity": {
    id: "flame-affinity",
    type: "stat",
    icon: "🔥",
    title: "Flame Affinity",
    description: "Permanently gain +4 Fire Power.",
    tags: ["fire", "burn", "damage"],
    effect: {
      target: "firePower",
      amount: 4,
    },
  },
  "tidal-affinity": {
    id: "tidal-affinity",
    type: "stat",
    icon: "💧",
    title: "Tidal Affinity",
    description: "Permanently gain +4 Water Power.",
    tags: ["water", "healing"],
    effect: {
      target: "waterPower",
      amount: 4,
    },
  },
  "stone-affinity": {
    id: "stone-affinity",
    type: "stat",
    icon: "🪨",
    title: "Stone Affinity",
    description: "Permanently gain +4 Earth Power.",
    tags: ["earth", "barrier"],
    effect: {
      target: "earthPower",
      amount: 4,
    },
  },
  "gale-affinity": {
    id: "gale-affinity",
    type: "stat",
    icon: "🌪️",
    title: "Gale Affinity",
    description: "Permanently gain +4 Wind Power.",
    tags: ["wind", "crit"],
    effect: {
      target: "windPower",
      amount: 4,
    },
  },
};

export const STAT_UPGRADE_POOL: StatRewardOffer[] = [
  STAT_UPGRADE_DEFINITIONS.vitality,
  STAT_UPGRADE_DEFINITIONS.power,
  STAT_UPGRADE_DEFINITIONS.quickness,
  STAT_UPGRADE_DEFINITIONS.fortitude,
  STAT_UPGRADE_DEFINITIONS.warding,
  STAT_UPGRADE_DEFINITIONS.focus,
  STAT_UPGRADE_DEFINITIONS.precision,
  STAT_UPGRADE_DEFINITIONS["flame-affinity"],
  STAT_UPGRADE_DEFINITIONS["tidal-affinity"],
  STAT_UPGRADE_DEFINITIONS["stone-affinity"],
  STAT_UPGRADE_DEFINITIONS["gale-affinity"],
];
