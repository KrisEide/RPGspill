import type {
  RewardChoiceId,
  RewardOffer,
} from "../../../game/types";
import { useShiftHeld } from "../hooks/useShiftHeld";

type Props = {
  mode?: "victory" | "restChoice" | "restUpgrade";
  restEyebrow?: string;
  restTitle?: string;
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
  mode = "victory",
  restEyebrow = "Boss Encounter Next",
  restTitle = "Prepare for the Orc Brothers.",
  characterName,
  itemRewards,
  choices,
  selectedChoiceId,
  waitingMessage,
  submitting,
  onSelect,
}: Props) {
  const isRest = mode !== "victory";
  const shiftHeld = useShiftHeld();
  const hasAbilityChoices = choices.some(
    (choice) =>
      choice.type === "newAbility" ||
      choice.type === "abilityRank" ||
      choice.type === "newGhostAbility",
  );
  const isSpiritChoice =
    choices.length > 0 &&
    choices.every((choice) => choice.type === "newSpirit");
  const isGhostChoice =
    choices.length > 0 &&
    choices.every(
      (choice) =>
        choice.type === "newGhostAbility" || choice.type === "ghostUpgrade",
    );

  return (
    <section
      className={`upgradeSelection ${isGhostChoice ? "upgradeSelection--ghost" : ""}`}
      aria-labelledby="upgrade-title"
    >
      <div className="upgradeSelection__panel">
        <span
          className="upgradeSelection__panelOrnament upgradeSelection__panelOrnament--top"
          aria-hidden="true"
        >
          ◆
        </span>
        <span
          className="upgradeSelection__panelOrnament upgradeSelection__panelOrnament--bottom"
          aria-hidden="true"
        >
          ◆
        </span>
        <div className="upgradeSelection__victory">
          {isRest
            ? restEyebrow
            : isGhostChoice
              ? "Ghost Reward"
              : "Victory"}
        </div>
        <h1 id="upgrade-title" className="upgradeSelection__title">
          {isRest
            ? restTitle
            : isSpiritChoice
              ? "Choose a Spirit"
              : isGhostChoice
                ? "Choose a Ghost Upgrade"
                : "Choose an Upgrade"}
        </h1>
        <p className="upgradeSelection__character">
          {mode === "restChoice"
            ? `Choose how ${characterName} prepares.`
            : isSpiritChoice
              ? `Choose one Spirit for ${characterName}`
              : `Choose one reward for ${characterName}`}
        </p>
        {hasAbilityChoices && (
          <div className="upgradeSelection__detailsHint">
            Hold Shift while hovering for more info
          </div>
        )}
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
              <img
                className="upgradeSelection__itemRewardIcon"
                src={itemReward.icon}
                alt=""
              />
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
            const isAbilityChoice =
              choice.type === "newAbility" ||
              choice.type === "abilityRank" ||
              choice.type === "newGhostAbility";
            const detailsId = isAbilityChoice
              ? `reward-ability-details-${index}`
              : undefined;

            return (
              <button
                key={choice.id}
                type="button"
                className={`upgradeSelection__card ${isSelected ? "upgradeSelection__card--selected" : ""}`}
                disabled={selectedChoiceId !== null || submitting}
                onClick={() => onSelect(choice.id)}
                aria-label={`Choose upgrade option ${index + 1}`}
                aria-describedby={detailsId}
              >
                <span className="upgradeSelection__cardIcon" aria-hidden="true">
                  {choice.icon}
                </span>
                <span className="upgradeSelection__cardType">
                  {choice.type === "newAbility"
                    ? "New Ability"
                    : choice.type === "abilityRank"
                      ? "Ability Upgrade"
                    : choice.type === "newGhostAbility"
                      ? "Ghost Ability"
                    : choice.type === "ghostUpgrade"
                      ? "Ghost Upgrade"
                    : choice.type === "newSpirit"
                      ? "New Spirit"
                    : choice.type === "passive"
                      ? "Passive"
                      : choice.type === "rest"
                        ? "Preparation"
                        : "Stat Upgrade"}
                </span>
                <strong className="upgradeSelection__cardTitle">
                  {choice.title}
                </strong>
                {(choice.type === "newAbility" ||
                  choice.type === "abilityRank" ||
                  choice.type === "newGhostAbility") && (
                  <span className="upgradeSelection__cardMeta">
                    Rank {choice.rank} · {choice.type === "newGhostAbility"
                      ? choice.costLabel
                      : `${choice.ppCost} PP`}
                  </span>
                )}
                {choice.type === "newSpirit" ? (
                  <span className="upgradeSelection__cardDescription upgradeSelection__cardDescription--spirit">
                    <span>
                      <strong>Passive — {choice.passiveName}</strong>
                      {choice.passiveDescription}
                    </span>
                    <span>
                      <strong>Active — {choice.activeName}</strong>
                      {choice.activeDescription}
                    </span>
                  </span>
                ) : (
                  <span className="upgradeSelection__cardDescription">
                    {choice.description}
                  </span>
                )}
                {isAbilityChoice && shiftHeld && (
                  <span
                    id={detailsId}
                    className="cmdbar__abilityTooltip upgradeSelection__abilityTooltip"
                    role="tooltip"
                  >
                    <span className="cmdbar__abilityTooltipTitle">
                      {choice.title} · Rank {choice.rank}
                    </span>
                    <span>{choice.detailedDescription}</span>
                    {choice.scalingDescription && (
                      <span className="cmdbar__abilityTooltipScaling">
                        Scaling: {choice.scalingDescription}
                      </span>
                    )}
                    <span className="cmdbar__abilityTooltipMeta">
                      Cost: {choice.type === "newGhostAbility"
                        ? choice.costLabel
                        : `${choice.ppCost} PP`}
                    </span>
                  </span>
                )}
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
