import { useEffect, useRef } from "react";
import { CHARACTER_ORDER } from "../../../game/playerControl";
import type { CharacterInstanceId, CombatState } from "../../../game/types";
import { getPortraitSource } from "../../characterSelect/data/characterOptions";

type Props = {
  state: CombatState;
  ownerId: CharacterInstanceId;
  canChoose: boolean;
  submitting: boolean;
  error: string | null;
  onChoose: (sacrificeId: CharacterInstanceId) => void;
};

export default function BloodpactSelection({ state, ownerId, canChoose, submitting, error, onChoose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="bloodpactSelection" aria-labelledby="bloodpact-title"
      onCancel={(event) => event.preventDefault()}>
      <p className="bloodpactSelection__eyebrow">🩸 Bloodpact · {state.characters[ownerId].name}</p>
      <h2 id="bloodpact-title">Choose Sacrifice</h2>
      {canChoose ? (
        <div className="bloodpactSelection__choices">
          {CHARACTER_ORDER.map((id) => {
            const otherId = id === "character-1" ? "character-2" : "character-1";
            return (
              <button key={id} type="button" disabled={submitting} onClick={() => onChoose(id)}>
                <img src={getPortraitSource(state.characters[id].portraitId)} alt="" />
                <strong>{state.characters[id].name}</strong>
                <span className="bloodpactSelection__sacrifice">Sacrifice</span>
                <span>Protected: {state.characters[otherId].name}</span>
              </button>
            );
          })}
        </div>
      ) : <p role="status">Waiting for {state.characters[ownerId].name} to choose the pact…</p>}
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
