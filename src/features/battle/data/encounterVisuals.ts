import forestBackground from "../../../assets/backgrounds/bakgrunn1.png";
import darkForestBackground from "../../../assets/backgrounds/bakgrunn4.png";
import forestCampBackground from "../../../assets/backgrounds/background_forest_camp.png";
import forestBossBackground from "../../../assets/backgrounds/background_forest_boss.png";
import type { EncounterId } from "../../../game/types";
import type { EnemyFormationPosition } from "../layout/enemyFormation";

type EncounterVisualDefinition = {
  backgroundImageSrc: string;
  enemyFormation?: EnemyFormationPosition[];
};

export const ENCOUNTER_VISUALS: Record<
  EncounterId,
  EncounterVisualDefinition
> = {
  slimeTrail: {
    backgroundImageSrc: forestBackground,
    enemyFormation: [
      { xPercent: 61, yPercent: 39, scale: 0.84, zIndex: 9 },
      { xPercent: 78, yPercent: 39, scale: 0.84, zIndex: 9 },
    ],
  },
  growingThreat: {
    backgroundImageSrc: forestBackground,
    enemyFormation: [
      { xPercent: 61, yPercent: 39, scale: 0.84, zIndex: 9 },
      { xPercent: 78, yPercent: 39, scale: 0.88, zIndex: 9 },
    ],
  },
  poisonedTrail: {
    backgroundImageSrc: forestBackground,
    enemyFormation: [
      { xPercent: 61, yPercent: 39, scale: 0.88, zIndex: 9 },
      { xPercent: 79, yPercent: 39, scale: 0.88, zIndex: 9 },
    ],
  },
  forestAmbush: {
    backgroundImageSrc: forestBackground,
  },
  orcReinforcements: {
    backgroundImageSrc: forestBackground,
  },
  spiritCamp: {
    backgroundImageSrc: forestCampBackground,
  },
  raiderPatrol: {
    backgroundImageSrc: forestBackground,
  },
  darkMage: {
    backgroundImageSrc: forestBackground,
  },
  raiderWarband: {
    backgroundImageSrc: forestBackground,
  },
  guardPatrol: {
    backgroundImageSrc: forestBackground,
    enemyFormation: [
      { xPercent: 53, yPercent: 38.5, scale: 0.84, zIndex: 9 },
      { xPercent: 70, yPercent: 38.5, scale: 0.78, zIndex: 9 },
      { xPercent: 86, yPercent: 38.5, scale: 0.78, zIndex: 9 },
    ],
  },
  dreadflameRitual: {
    backgroundImageSrc: darkForestBackground,
    enemyFormation: [
      { xPercent: 76, yPercent: 39.5, scale: 0.74, zIndex: 8 },
      { xPercent: 67, yPercent: 53.5, scale: 0.86, zIndex: 10 },
    ],
  },
  mightAndMending: {
    backgroundImageSrc: darkForestBackground,
    enemyFormation: [
      { xPercent: 61, yPercent: 48, scale: 0.76, zIndex: 9 },
      { xPercent: 83, yPercent: 48, scale: 0.8, zIndex: 9 },
    ],
  },
  forestRest: {
    backgroundImageSrc: forestCampBackground,
  },
  orcBrothers: {
    backgroundImageSrc: forestBossBackground,
    enemyFormation: [
      { xPercent: 50, yPercent: 37, scale: 0.81, zIndex: 9 },
      { xPercent: 86, yPercent: 37, scale: 0.74, zIndex: 9 },
    ],
  },
};
