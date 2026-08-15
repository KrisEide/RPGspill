import forestBackground from "../../../assets/backgrounds/bakgrunn1.png";
import darkForestBackground from "../../../assets/backgrounds/bakgrunn2_2.png";
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
      { xPercent: 77, yPercent: 38, scale: 0.74, zIndex: 8 },
      { xPercent: 68, yPercent: 55, scale: 0.86, zIndex: 10 },
    ],
  },
};
