import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import attackIcon from "../../../assets/icons/attackicon.png";
import defendIcon from "../../../assets/icons/defend_icon.png";
import magicIcon from "../../../assets/icons/magicicon.png";
import itemsIcon from "../../../assets/icons/inventoryicon.png";
import spiritIcon from "../../../assets/icons/spirit.png";
import portrait from "../../../assets/portraits/character1_1.png";
import type {
  AbilityId,
  AbilityRank,
  SpiritId,
} from "../../../game/types";

type CommandId =
  | "attack"
  | "abilities"
  | "defend"
  | "spirit"
  | "items"
  | "ghostStrike"
  | "ghostBolt"
  | "ghostHeal"
  | "reform";
type CommandPanelId = "abilities" | "spirit" | "items";

type CommandDefinition = {
  id: CommandId;
  title: string;
  desc: string;
  icon: string;
  glyph?: string;
  panelId: CommandPanelId | null;
};

const PANEL_CONTENT: Record<
  CommandPanelId,
  { title: string; emptyMessage: string }
> = {
  abilities: {
    title: "Abilities",
    emptyMessage: "No abilities learned yet.",
  },
  spirit: {
    title: "Spirit",
    emptyMessage: "No Spirit available yet.",
  },
  items: {
    title: "Inventory",
    emptyMessage: "Your inventory is empty.",
  },
};

type Props = {
  portraitSrc?: string;
  actionsDisabled?: boolean;
  abilitiesAvailable?: boolean;
  spiritAvailable?: boolean;
  ghostMode?: boolean;
  ghostBoltAvailable?: boolean;
  canReform?: boolean;
  abilities: {
    id: AbilityId;
    name: string;
    shortDescription: string;
    description: string;
    scalingDescription: string;
    ppCost: number;
    rank: AbilityRank;
    icon: string;
    available: boolean;
  }[];
  battleLog?: ReactNode;
  spirits: {
    id: SpiritId;
    name: string;
    icon: string;
    passiveName: string;
    passiveDescription: string;
    activeAbilityId: AbilityId;
    activeName: string;
    activeShortDescription: string;
    activeDescription: string;
    usesRemaining: number;
  }[];
  items: {
    id: string;
    name: string;
    menuName: string;
    icon: string;
    description: string;
    quantity: number;
    useTiming: "action" | "quickAction";
  }[];
  onAttackSelect: () => void;
  onAbilitySelect: (abilityId: AbilityId) => void;
  onSpiritSelect: (abilityId: AbilityId) => void;
  onItemSelect: (itemId: string) => void;
  onDefendSelect: () => void;
  onGhostStrikeSelect: () => void;
  onGhostBoltSelect: () => void;
  onGhostHealSelect: () => void;
  onReform: () => void;
};

export default function CommandBar({
  portraitSrc,
  actionsDisabled = false,
  abilitiesAvailable = false,
  spiritAvailable = false,
  ghostMode = false,
  ghostBoltAvailable = false,
  canReform = false,
  abilities,
  spirits,
  items,
  battleLog,
  onAttackSelect,
  onAbilitySelect,
  onSpiritSelect,
  onItemSelect,
  onDefendSelect,
  onGhostStrikeSelect,
  onGhostBoltSelect,
  onGhostHealSelect,
  onReform,
}: Props) {
  const [selected, setSelected] = useState<CommandId>("attack");
  const [hovered, setHovered] = useState<CommandId | null>(null);
  const [openPanel, setOpenPanel] = useState<CommandPanelId | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const commands = useMemo<CommandDefinition[]>(
    () => ghostMode
      ? [
          {
            id: "ghostStrike",
            title: "Ghost Strike",
            desc: "Deal weak Physical damage to one enemy.",
            icon: attackIcon,
            glyph: "👻",
            panelId: null,
          },
          {
            id: "ghostBolt",
            title: "Ghost Bolt",
            desc: "Deal Dark damage to one enemy. Costs 4 Ghost PP.",
            icon: magicIcon,
            glyph: "🔮",
            panelId: null,
          },
          {
            id: "ghostHeal",
            title: "Ghost Heal",
            desc: "Restore 7 Ghost HP.",
            icon: spiritIcon,
            glyph: "💠",
            panelId: null,
          },
          {
            id: "reform",
            title: "Reform",
            desc: canReform
              ? "Return to Living Form with 30 HP."
              : "Requires 100 Ghost HP.",
            icon: defendIcon,
            glyph: "✨",
            panelId: null,
          },
        ]
      : [
      {
        id: "attack",
        title: "Attack",
        desc: "Attack with your equipped weapon.",
        icon: attackIcon,
        panelId: null,
      },
      {
        id: "abilities",
        title: "Abilities",
        desc: "Use your character's abilities.",
        icon: magicIcon,
        panelId: "abilities",
      },
      {
        id: "spirit",
        title: "Spirit",
        desc: "Call upon your elemental Spirit.",
        icon: spiritIcon,
        panelId: "spirit",
      },
      {
        id: "defend",
        title: "Defend",
        desc: "Take 50% less direct damage this round.",
        icon: defendIcon,
        panelId: null,
      },
      {
        id: "items",
        title: "Items",
        desc: "Open your inventory and use an item.",
        icon: itemsIcon,
        panelId: "items",
      },
    ],
    [canReform, ghostMode],
  );

  const activeId = hovered ?? selected;
  const active = commands.find((c) => c.id === activeId) ?? commands[0];

  const portraitToUse = portraitSrc ?? portrait;
  const panelContent = openPanel ? PANEL_CONTENT[openPanel] : null;
  const hoveredItem = items.find((item) => item.id === hoveredItemId) ?? null;

  return (
    <div
      className={`cmdbar${openPanel === "items" ? " cmdbar--inventoryOpen" : ""}${ghostMode ? " cmdbar--ghost" : ""}`}
    >
      <div className="cmdbar__inner">
        <div className="cmdbar__portrait">
          <img
            className="cmdbar__portraitImg"
            src={portraitToUse}
            alt="Character portrait"
          />
        </div>
        {panelContent ? (
          <section
            className="cmdbar__panel"
            aria-label={panelContent.title}
          >
            <div className="cmdbar__panelNavigation">
              <div className="cmdbar__panelTitle">{panelContent.title}</div>
              <button
                type="button"
                className="cmdbar__backButton"
                onClick={() => {
                  setOpenPanel(null);
                  setHovered(null);
                  setHoveredItemId(null);
                }}
              >
                <span aria-hidden="true">←</span> Back
              </button>
            </div>
            <div className="cmdbar__panelContent">
              {openPanel === "abilities" && abilities.length > 0 ? (
                <div className="cmdbar__abilityList cmdbar__abilityList--compact">
                  {abilities.map((ability) => {
                    const tooltipId = `ability-tooltip-${ability.id}`;

                    return (
                      <div
                        key={ability.id}
                        className="cmdbar__abilityEntry cmdbar__abilityEntry--compact"
                      >
                        <button
                          type="button"
                          className="cmdbar__abilityButton cmdbar__abilityButton--compact"
                          disabled={!ability.available || actionsDisabled}
                          aria-describedby={tooltipId}
                          onClick={() => {
                            onAbilitySelect(ability.id);
                            setOpenPanel(null);
                            setSelected("abilities");
                            setHovered(null);
                          }}
                        >
                          <span className="cmdbar__abilityIcon" aria-hidden="true">
                            {ability.icon}
                          </span>
                          <span className="cmdbar__abilityDetails">
                            <span className="cmdbar__abilityName">
                              {ability.name}
                            </span>
                            <span className="cmdbar__abilityRank">
                              Rank {ability.rank}
                            </span>
                          </span>
                          <span className="cmdbar__abilityCost">
                            {ability.ppCost} PP
                          </span>
                        </button>
                        <div
                          id={tooltipId}
                          className="cmdbar__abilityTooltip"
                          role="tooltip"
                        >
                          <div className="cmdbar__abilityTooltipTitle">
                            {ability.name} · Rank {ability.rank}
                          </div>
                          <div>{ability.description}</div>
                          {ability.scalingDescription && (
                            <div className="cmdbar__abilityTooltipScaling">
                              Scaling: {ability.scalingDescription}
                            </div>
                          )}
                          <div className="cmdbar__abilityTooltipMeta">
                            Cost: {ability.ppCost} PP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : openPanel === "spirit" && spirits.length > 0 ? (
                <div className="cmdbar__abilityList">
                  {spirits.map((spirit) => {
                    const tooltipId = `spirit-tooltip-${spirit.id}`;

                    return (
                      <div
                        key={spirit.id}
                        className="cmdbar__abilityEntry"
                      >
                        <button
                          type="button"
                          className="cmdbar__abilityButton"
                          disabled={
                            spirit.usesRemaining <= 0 || actionsDisabled
                          }
                          aria-describedby={tooltipId}
                          onClick={() => {
                            onSpiritSelect(spirit.activeAbilityId);
                            setOpenPanel(null);
                            setSelected("spirit");
                            setHovered(null);
                          }}
                        >
                          <span className="cmdbar__abilityIcon" aria-hidden="true">
                            {spirit.icon}
                          </span>
                          <span className="cmdbar__abilityDetails">
                            <span className="cmdbar__abilityName">
                              {spirit.name}
                            </span>
                            <span className="cmdbar__abilityDescription">
                              {spirit.activeShortDescription}
                            </span>
                          </span>
                          <span className="cmdbar__abilityCost">
                            {spirit.usesRemaining > 0
                              ? `${spirit.usesRemaining} use`
                              : "Used"}
                          </span>
                        </button>
                        <div
                          id={tooltipId}
                          className="cmdbar__abilityTooltip"
                          role="tooltip"
                        >
                          <div className="cmdbar__abilityTooltipTitle">
                            {spirit.name}
                          </div>
                          <div>
                            <strong>Active:</strong> {spirit.activeDescription}
                          </div>
                          <div>
                            <strong>Passive — {spirit.passiveName}:</strong>{" "}
                            {spirit.passiveDescription}
                          </div>
                          <div className="cmdbar__abilityTooltipMeta">
                            {spirit.usesRemaining > 0
                              ? "Available once this encounter."
                              : "Already used this encounter."}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : openPanel === "items" && items.length > 0 ? (
                <>
                  <div className="cmdbar__abilityList cmdbar__abilityList--compact cmdbar__itemList">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="cmdbar__abilityEntry cmdbar__abilityEntry--compact cmdbar__itemSlot"
                      >
                        <button
                          type="button"
                          className="cmdbar__abilityButton cmdbar__abilityButton--compact cmdbar__itemEntry"
                          aria-describedby="item-tooltip"
                          disabled={actionsDisabled || item.quantity <= 0}
                          onMouseEnter={() => setHoveredItemId(item.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          onFocus={() => setHoveredItemId(item.id)}
                          onBlur={() => setHoveredItemId(null)}
                          onClick={() => {
                            onItemSelect(item.id);
                            setOpenPanel(null);
                            setSelected("items");
                            setHovered(null);
                            setHoveredItemId(null);
                          }}
                        >
                          <span className="cmdbar__abilityIcon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span className="cmdbar__abilityDetails">
                            <span className="cmdbar__abilityName">
                              {item.menuName}
                            </span>
                          </span>
                          <span className="cmdbar__abilityCost cmdbar__itemQuantity">
                            ×{item.quantity}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {hoveredItem && (
                    <div
                      id="item-tooltip"
                      className="cmdbar__abilityTooltip cmdbar__itemTooltip"
                      role="tooltip"
                    >
                      <div className="cmdbar__abilityTooltipTitle">
                        {hoveredItem.name}
                      </div>
                      <div>{hoveredItem.description}</div>
                      {hoveredItem.useTiming === "quickAction" && (
                        <div className="cmdbar__abilityTooltipMeta">
                          Quick Action
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="cmdbar__emptyMessage">
                  {panelContent.emptyMessage}
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="cmdbar__mainLayout">
            <div className="cmdbar__centerRow">
              <div className="cmdbar__icons">
              {commands.map((c) => {
                const isSelected = c.id === selected;
                const isLocked =
                  (c.id === "abilities" && !abilitiesAvailable) ||
                  (c.id === "spirit" && !spiritAvailable) ||
                  (c.id === "ghostBolt" && !ghostBoltAvailable) ||
                  (c.id === "reform" && !canReform);
                const isActionUnavailable =
                  (c.id === "attack" ||
                    c.id === "defend" ||
                    c.id === "ghostStrike" ||
                    c.id === "ghostBolt" ||
                    c.id === "ghostHeal" ||
                    c.id === "reform") &&
                  actionsDisabled;

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`cmdbar__slot ${isSelected ? "cmdbar__slot--selected" : ""} ${isLocked ? "cmdbar__slot--locked" : ""}`}
                    disabled={isLocked && c.id !== "reform"}
                    aria-disabled={isLocked || isActionUnavailable}
                    onClick={() => {
                      if (isLocked || isActionUnavailable) {
                        return;
                      }

                      setSelected(c.id);
                      setHovered(null);

                      if (c.id === "attack") {
                        onAttackSelect();
                        return;
                      }

                      if (c.id === "defend") {
                        onDefendSelect();
                        return;
                      }

                      if (c.id === "ghostStrike") {
                        onGhostStrikeSelect();
                        return;
                      }

                      if (c.id === "ghostBolt") {
                        onGhostBoltSelect();
                        return;
                      }

                      if (c.id === "ghostHeal") {
                        onGhostHealSelect();
                        return;
                      }

                      if (c.id === "reform") {
                        onReform();
                        return;
                      }

                      if (c.panelId) {
                        setOpenPanel(c.panelId);
                      }
                    }}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    aria-label={c.title}
                  >
                    {c.glyph ? (
                      <span className="cmdbar__ghostIcon" aria-hidden="true">
                        {c.glyph}
                      </span>
                    ) : (
                      <img
                        className={`cmdbar__icon cmdbar__icon--${c.id}`}
                        src={c.icon}
                        alt=""
                      />
                    )}
                  </button>
                );
              })}
              </div>

              <div className="cmdbar__text">
                <div className="cmdbar__title">{active.title}</div>
                <div className="cmdbar__desc">{active.desc}</div>
              </div>
            </div>
            {battleLog}
          </div>
        )}
      </div>
    </div>
  );
}
