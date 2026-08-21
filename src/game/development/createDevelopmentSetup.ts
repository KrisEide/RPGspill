import type {
  CharacterInstanceId,
  EncounterId,
  GameSetup,
  PassiveId,
} from "../types";
import { DEFAULT_PLAYER_CHARACTER_CONTROL } from "../playerControl";

export function createDevelopmentSetup(
  startingEncounterId: EncounterId,
  randomSeed: number,
  developmentPassives: Partial<
    Record<CharacterInstanceId, PassiveId[]>
  > = {},
  startInGhostForm = false,
): GameSetup {
  return {
    mode: "singlePlayer",
    initialLoadout: "development",
    randomSeed,
    startingEncounterId,
    developmentStartInGhostForm: startInGhostForm,
    developmentPassives,
    players: {
      player1: {
        id: "player1",
        controlledCharacterId: DEFAULT_PLAYER_CHARACTER_CONTROL.player1,
        character: {
          name: "Rowan",
          portraitId: "c1p1",
          presetId: "char1",
        },
      },
      player2: {
        id: "player2",
        controlledCharacterId: DEFAULT_PLAYER_CHARACTER_CONTROL.player2,
        character: {
          name: "Lyra",
          portraitId: "c2p1",
          presetId: "char2",
        },
      },
    },
  };
}
