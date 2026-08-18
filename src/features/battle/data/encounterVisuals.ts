import forestBackground from "../../../assets/backgrounds/bakgrunn1.png";
import darkForestBackground from "../../../assets/backgrounds/bakgrunn4.png";
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
  forestAmbush: {
    backgroundImageSrc: forestBackground,
  },
  orcReinforcements: {
    backgroundImageSrc: forestBackground,
  },
  darkMage: {
    backgroundImageSrc: forestBackground,
  },
  raiderWarband: {
    backgroundImageSrc: forestBackground,
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
};
