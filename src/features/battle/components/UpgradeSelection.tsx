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
  const hasDetailedChoices = choices.some(
    (choice) =>
      choice.type === "newAbility" ||
      choice.type === "abilityRank" ||
      choice.type === "newGhostAbility" ||
      choice.type === "newSpirit",
  );
  const isSpiritChoice =
    choices.length > 0 &&
    choices.every((choice) => choice.type === "newSpirit");
  const isSpiritRank =
    choices.length > 0 &&
    choices.every((choice) => choice.type === "spiritRank");
  const isGhostChoice =
    choices.length > 0 &&
    choices.every(
      (choice) =>
        choice.type === "newGhostAbility" || choice.type === "ghostUpgrade",
    );

  return (
    <section
      className={`upgradeSelection ${isGhostChoice ? "upgradeSelection--ghost" : ""}${isSpiritRank ? " upgradeSelection--spiritRank" : ""}`}
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
        {!isGhostChoice && (
          <div className="upgradeSelection__victory">
            {isRest ? restEyebrow : isSpiritRank ? "Act I Complete" : "Victory"}
          </div>
        )}
        <h1 id="upgrade-title" className="upgradeSelection__title">
          {isRest
            ? restTitle
            : isSpiritRank
              ? "Spirit Rank 2"
            : isSpiritChoice
              ? "Choose a Spirit"
              : isGhostChoice
                ? "Choose a Ghost Upgrade"
                : "Choose an Upgrade"}
        </h1>
        <p className="upgradeSelection__character">
          {mode === "restChoice"
            ? `Choose how ${characterName} prepares.`
            : `For ${characterName}${hasDetailedChoices ? " · Hold Shift for details" : ""}`}
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
              <img
                className="upgradeSelection__itemRewardIcon"
                src={itemReward.icon}
                alt=""
              />
              <strong>{itemReward.name}</strong> found
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

        <div className={`upgradeSelection__choices${isSpiritRank ? " upgradeSelection__choices--single" : ""}`}>
          {choices.map((choice, index) => {
            const isSelected = choice.id === selectedChoiceId;
            const isAbilityChoice =
              choice.type === "newAbility" ||
              choice.type === "abilityRank" ||
              choice.type === "newGhostAbility";
            const hasShiftDetails =
              isAbilityChoice || choice.type === "newSpirit";
            const detailsId = hasShiftDetails
              ? `reward-ability-details-${index}`
              : undefined;
            const displayTitle =
              choice.type === "abilityRank"
                ? `Rank ${choice.rank} · ${choice.title}`
                : choice.title;

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
                {choice.type !== "newSpirit" && choice.type !== "spiritRank" && (
                  <span className="upgradeSelection__cardType">
                    {choice.type === "newAbility"
                      ? "New Ability"
                      : choice.type === "abilityRank"
                        ? "Ability Upgrade"
                        : choice.type === "newGhostAbility"
                          ? "Ghost Ability"
                          : choice.type === "ghostUpgrade"
                            ? "Ghost Upgrade"
                            : choice.type === "passive"
                              ? "Passive"
                              : choice.type === "rest"
                                ? "Preparation"
                                : "Stat Upgrade"}
                  </span>
                )}
                <strong className="upgradeSelection__cardTitle">
                  {displayTitle}
                </strong>
                {choice.type === "newSpirit" ? (
                  <span className="upgradeSelection__cardDescription upgradeSelection__cardDescription--spirit">
                    <span>
                      <strong>Passive</strong>
                      {choice.passiveShortDescription}
                    </span>
                    <span>
                      <strong>{choice.automaticActive ? "Automatic" : "Active"}</strong>
                      {choice.activeDescription}
                    </span>
                  </span>
                ) : choice.type === "spiritRank" ? (
                  <span className="upgradeSelection__cardDescription upgradeSelection__cardDescription--spiritRank">
                    <span>
                      <strong>Passive</strong>
                      {choice.passiveDescription}
                    </span>
                    <span>
                      <strong>{choice.automaticActive ? "Automatic" : "Active"} — {choice.activeName}</strong>
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
                      {displayTitle}
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
                {choice.type === "newSpirit" && shiftHeld && (
                  <span
                    id={detailsId}
                    className="cmdbar__abilityTooltip upgradeSelection__abilityTooltip upgradeSelection__spiritTooltip"
                    role="tooltip"
                  >
                    <span className="cmdbar__abilityTooltipTitle">
                      {choice.title}
                    </span>
                    <span>
                      <strong>Passive</strong>
                      {choice.passiveDescription}
                    </span>
                    <span>
                      <strong>{choice.automaticActive ? "Automatic" : "Active"} — {choice.activeName}</strong>
                      {choice.activeDetailedDescription}
                    </span>
                    <span className="cmdbar__abilityTooltipMeta">
                      {choice.automaticActive ? "Once per run" : "Once per encounter"}
                    </span>
                  </span>
                )}
                <span className="upgradeSelection__cardAction">
                  {isSelected ? "Selected" : isSpiritRank ? "Continue" : "Choose"}
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
