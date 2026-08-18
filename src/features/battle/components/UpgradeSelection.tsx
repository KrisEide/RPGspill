import type {
  RewardChoiceId,
  RewardOffer,
} from "../../../game/types";

type Props = {
  characterName: string;
  itemRewards: {
    name: string;
    icon: string;
    rarity: "common" | "uncommon" | "rare";
    description: string;
    useTiming: "action" | "quickAction";
  }[];
  choices: RewardOffer[];
  selectedChoiceId: RewardChoiceId | null;
  waitingMessage: string | null;
  submitting: boolean;
  onSelect: (choiceId: RewardChoiceId) => void;
};

export default function UpgradeSelection({
  characterName,
  itemRewards,
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
        {itemRewards.map((itemReward, index) => (
          <div
            key={`${itemReward.name}-${index}`}
            className="upgradeSelection__itemRewardWrap"
            tabIndex={0}
            aria-describedby={`item-reward-tooltip-${index}`}
          >
            <div
              className={`upgradeSelection__itemReward upgradeSelection__itemReward--${itemReward.rarity}`}
            >
              <span aria-hidden="true">{itemReward.icon}</span>
              Item found: <strong>{itemReward.name}</strong>
            </div>
            <div
              id={`item-reward-tooltip-${index}`}
              className="cmdbar__abilityTooltip upgradeSelection__itemTooltip"
              role="tooltip"
            >
              <div className="cmdbar__abilityTooltipTitle">
                {itemReward.name}
              </div>
              <div>{itemReward.description}</div>
              {itemReward.useTiming === "quickAction" && (
                <div className="cmdbar__abilityTooltipMeta">
                  Quick Action
                </div>
              )}
            </div>
          </div>
        ))}

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
                <span className="upgradeSelection__cardIcon" aria-hidden="true">
                  {choice.icon}
                </span>
                <span className="upgradeSelection__cardType">
                  {choice.type === "newAbility"
                    ? "New Ability"
                    : choice.type === "passive"
                      ? "Passive"
                    : "Stat Upgrade"}
                </span>
                <strong className="upgradeSelection__cardTitle">
                  {choice.title}
                </strong>
                {choice.type === "newAbility" && (
                  <span className="upgradeSelection__cardMeta">
                    Rank {choice.rank} · {choice.ppCost} PP
                  </span>
                )}
                <span className="upgradeSelection__cardDescription">
                  {choice.description}
                </span>
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
