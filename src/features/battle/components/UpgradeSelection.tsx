import type { UpgradeChoiceDefinition } from "../../../data/upgrades";
import type { UpgradeChoiceId } from "../../../game/types";

type Props = {
  characterName: string;
  choices: UpgradeChoiceDefinition[];
  selectedChoiceId: UpgradeChoiceId | null;
  waitingMessage: string | null;
  submitting: boolean;
  onSelect: (choiceId: UpgradeChoiceId) => void;
};

export default function UpgradeSelection({
  characterName,
  choices,
  selectedChoiceId,
  waitingMessage,
  submitting,
  onSelect,
}: Props) {
  return (
    <section className="upgradeSelection" aria-labelledby="upgrade-title">
      <div className="upgradeSelection__panel">
        <div className="upgradeSelection__victory">Victory</div>
        <h1 id="upgrade-title" className="upgradeSelection__title">
          Choose an Upgrade
        </h1>
        <p className="upgradeSelection__character">
          Choose one reward for {characterName}
        </p>

        <div className="upgradeSelection__choices">
          {choices.map((choice, index) => {
            const isSelected = choice.id === selectedChoiceId;

            return (
              <button
                key={choice.id}
                type="button"
                className={`upgradeSelection__card ${isSelected ? "upgradeSelection__card--selected" : ""}`}
                disabled={selectedChoiceId !== null || submitting}
                onClick={() => onSelect(choice.id)}
                aria-label={`Choose upgrade option ${index + 1}`}
              >
                <span className="upgradeSelection__cardEmpty" aria-hidden="true" />
                <span className="upgradeSelection__cardAction">
                  {isSelected ? "Selected" : "Choose"}
                </span>
              </button>
            );
          })}
        </div>

        {waitingMessage && (
          <div className="upgradeSelection__waiting" role="status">
            {waitingMessage}
          </div>
        )}
      </div>
    </section>
  );
}
