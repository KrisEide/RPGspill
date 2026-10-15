import portrait1 from "../../../assets/portraits/character1_1.png";
import portrait2 from "../../../assets/portraits/character1_2.png";
import portrait3 from "../../../assets/portraits/character1_3.png";
import portrait7 from "../../../assets/portraits/character3_1.png";
import portrait8 from "../../../assets/portraits/character3_2.png";
import portrait9 from "../../../assets/portraits/character3_3.png";
import rowanGhostPortrait from "../../../assets/portraits/rowan_ghost.png";
import lyraGhostPortrait from "../../../assets/portraits/lyra_ghost.png";
import type {
  CharacterState,
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

const GHOST_PORTRAIT_SOURCES: Record<CharacterPresetId, string> = {
  char1: rowanGhostPortrait,
  char2: lyraGhostPortrait,
};

export function getCharacterPortraitSource(
  character: Pick<CharacterState, "form" | "portraitId" | "presetId">,
) {
  return character.form === "ghost"
    ? GHOST_PORTRAIT_SOURCES[character.presetId]
    : getPortraitSource(character.portraitId);
}
