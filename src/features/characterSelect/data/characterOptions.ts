import portrait1 from "../../../assets/portraits/Character1_1.png";
import portrait2 from "../../../assets/portraits/Character1_2.png";
import portrait3 from "../../../assets/portraits/Character1_3.png";
import portrait7 from "../../../assets/portraits/Character3_1.png";
import portrait8 from "../../../assets/portraits/Character3_2.png";
import portrait9 from "../../../assets/portraits/Character3_3.png";
import type {
  CharacterPresetId,
  PortraitId,
} from "../../../game/types";

export const PORTRAIT_SOURCES: Record<PortraitId, string> = {
  c1p1: portrait1,
  c1p2: portrait2,
  c1p3: portrait3,
  c2p1: portrait7,
  c2p2: portrait8,
  c2p3: portrait9,
};

type CharacterOption = {
  id: CharacterPresetId;
  selectPortraitId: PortraitId;
  portraitIds: PortraitId[];
};

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: "char1",
    selectPortraitId: "c1p1",
    portraitIds: ["c1p1", "c1p2", "c1p3"],
  },
  {
    id: "char2",
    selectPortraitId: "c2p1",
    portraitIds: ["c2p1", "c2p2", "c2p3"],
  },
];

export function getPortraitSource(portraitId: PortraitId) {
  return PORTRAIT_SOURCES[portraitId];
}
