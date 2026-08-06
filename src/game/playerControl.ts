import type {
  CharacterInstanceId,
  CombatantId,
  PlayerId,
} from "./types";

export const PLAYER_ORDER: PlayerId[] = ["player1", "player2"];

export const CHARACTER_ORDER: CharacterInstanceId[] = [
  "character-1",
  "character-2",
];

export const DEFAULT_PLAYER_CHARACTER_CONTROL: Record<
  PlayerId,
  CharacterInstanceId
> = {
  player1: "character-1",
  player2: "character-2",
};

export function isCharacterInstanceId(
  id: CombatantId,
): id is CharacterInstanceId {
  return id === "character-1" || id === "character-2";
}
