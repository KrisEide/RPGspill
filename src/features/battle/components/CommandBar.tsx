import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import attackIcon from "../../../assets/icons/attackicon.png";
import defendIcon from "../../../assets/icons/defend_icon.png";
import magicIcon from "../../../assets/icons/magicicon.png";
import itemsIcon from "../../../assets/icons/inventoryicon.png";
import spiritIcon from "../../../assets/icons/spirit.png";
import ghostAttackIcon from "../../../assets/icons/ghost_attack.png";
import ghostBoltIcon from "../../../assets/icons/ghost_ghostbolt.png";
import ghostHealIcon from "../../../assets/icons/ghost_ghostheal.png";
import ghostReformIcon from "../../../assets/icons/ghost_reform.png";
import mysteriousPotionIcon from "../../../assets/icons/mysteriouspotion.png";
import soulLinkIcon from "../../../assets/icons/soulink.png";
import soulLinkBrokenIcon from "../../../assets/icons/soulinkbroken.png";
import portrait from "../../../assets/portraits/character1_1.png";
import type {
  AbilityId,
  AbilityRank,
  SpiritId,
} from "../../../game/types";
import { useShiftHeld } from "../hooks/useShiftHeld";

type CommandId =
  | "attack"
  | "abilities"
  | "defend"
  | "spirit"
  | "items"
  | "ghostStrike"
  | "ghostHeal"
  | "mysteriousPotion"
  | "reform";
type CommandPanelId = "abilities" | "spirit" | "items";

type CommandDefinition = {
  id: CommandId;
  title: string;
  desc: string;
  icon: string;
  glyph?: string;
  panelId: CommandPanelId | null;
  quantity?: number;
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
  spiritUsed?: boolean;
  ghostMode?: boolean;
  ghostStrikeDamage: number;
  ghostHealPpCost: number;
  ghostHealAvailable: boolean;
  mysteriousPotionQuantity?: number;
  canReform?: boolean;
  soulLinkActive?: boolean;
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
    automatic?: boolean;
    available?: boolean;
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
  onGhostHealSelect: () => void;
  onMysteriousPotionSelect: () => void;
  onReform: () => void;
};

export default function CommandBar({
  portraitSrc,
  actionsDisabled = false,
  abilitiesAvailable = false,
  spiritAvailable = false,
  spiritUsed = false,
  ghostMode = false,
  ghostStrikeDamage,
  ghostHealPpCost,
  ghostHealAvailable,
  mysteriousPotionQuantity = 0,
  canReform = false,
  soulLinkActive = false,
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
  onGhostHealSelect,
  onMysteriousPotionSelect,
  onReform,
}: Props) {
  const [selected, setSelected] = useState<CommandId>("attack");
  const [hovered, setHovered] = useState<CommandId | null>(null);
  const [openPanel, setOpenPanel] = useState<CommandPanelId | null>(null);
  const [hoveredAbilityId, setHoveredAbilityId] = useState<AbilityId | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [soulLinkHovered, setSoulLinkHovered] = useState(false);
  const shiftHeld = useShiftHeld();

  const commands = useMemo<CommandDefinition[]>(
    () => ghostMode
      ? [
          {
            id: "ghostStrike",
            title: "Ghost Strike",
            desc: `Deal ${ghostStrikeDamage} raw Physical damage and restore 1 Ghost HP and 2 Ghost PP.`,
            icon: ghostAttackIcon,
            panelId: null,
          },
          {
            id: "abilities",
            title: "Ghost Abilities",
            desc: "Use your Ghost abilities.",
            icon: ghostBoltIcon,
            panelId: "abilities",
          },
          {
            id: "ghostHeal",
            title: "Ghost Heal",
            desc: `Restore 12 Ghost HP. Costs ${ghostHealPpCost} Ghost PP.`,
            icon: ghostHealIcon,
            panelId: null,
          },
          ...(mysteriousPotionQuantity > 0
            ? [{
                id: "mysteriousPotion" as const,
                title: "Mysterious Potion",
                desc: "Quick · Restore 10 Ghost HP and gain 10 Barrier.",
                icon: mysteriousPotionIcon,
                panelId: null,
                quantity: mysteriousPotionQuantity,
              }]
            : []),
          {
            id: "reform",
            title: "Reform",
            desc: canReform
              ? "Ready. Return to Living Form with 30 HP."
              : "Reach 100 Ghost HP to unlock Reform.",
            icon: ghostReformIcon,
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
    [
      canReform,
      ghostHealPpCost,
      ghostMode,
      ghostStrikeDamage,
      mysteriousPotionQuantity,
    ],
  );

  const activeId = hovered ?? selected;
  const active = soulLinkHovered
    ? {
        title: soulLinkActive ? "Soullink aktive" : "Soullink broken",
        desc: "",
      }
    : (commands.find((c) => c.id === activeId) ?? commands[0]);

  const portraitToUse = portraitSrc ?? portrait;
  const panelContent = openPanel ? PANEL_CONTENT[openPanel] : null;
  const hoveredAbility = abilities.find(
    (ability) => ability.id === hoveredAbilityId,
  ) ?? null;
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
        {ghostMode && !panelContent && (
          <div
            className={`cmdbar__soulLinkStatus ${soulLinkActive ? "cmdbar__soulLinkStatus--active" : "cmdbar__soulLinkStatus--broken"}`}
            role="status"
            aria-label={`Soul Link ${soulLinkActive ? "Active" : "Broken"}`}
            tabIndex={0}
            onMouseEnter={() => setSoulLinkHovered(true)}
            onMouseLeave={() => setSoulLinkHovered(false)}
            onFocus={() => setSoulLinkHovered(true)}
            onBlur={() => setSoulLinkHovered(false)}
          >
            <img
              className="cmdbar__soulLinkIcon"
              src={soulLinkActive ? soulLinkIcon : soulLinkBrokenIcon}
              alt=""
            />
          </div>
        )}
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
                  setHoveredAbilityId(null);
                  setHoveredItemId(null);
                }}
              >
                <span aria-hidden="true">←</span> Back
              </button>
            </div>
            <div className="cmdbar__panelContent">
              {openPanel === "abilities" && abilities.length > 0 ? (
                <>
                  <div
                    className="cmdbar__abilityList cmdbar__abilityList--compact cmdbar__abilityList--scrollable"
                    onScroll={() => setHoveredAbilityId(null)}
                  >
                    {abilities.map((ability) => (
                      <div
                        key={ability.id}
                        className="cmdbar__abilityEntry cmdbar__abilityEntry--compact"
                        onMouseEnter={() => setHoveredAbilityId(ability.id)}
                        onMouseLeave={() => setHoveredAbilityId(null)}
                      >
                        <button
                          type="button"
                          className="cmdbar__abilityButton cmdbar__abilityButton--compact"
                          disabled={!ability.available || actionsDisabled}
                          aria-describedby="ability-tooltip"
                          onFocus={() => setHoveredAbilityId(ability.id)}
                          onBlur={() => setHoveredAbilityId(null)}
                          onClick={() => {
                            onAbilitySelect(ability.id);
                            setOpenPanel(null);
                            setSelected("abilities");
                            setHovered(null);
                            setHoveredAbilityId(null);
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
                      </div>
                    ))}
                  </div>
                  {hoveredAbility && (
                    <div
                      id="ability-tooltip"
                      className="cmdbar__abilityTooltip cmdbar__abilityTooltip--shared"
                      role="tooltip"
                    >
                      <div className="cmdbar__abilityTooltipTitle">
                        {hoveredAbility.name} · Rank {hoveredAbility.rank}
                      </div>
                      <div>
                        {shiftHeld
                          ? hoveredAbility.description
                          : hoveredAbility.shortDescription}
                      </div>
                      {shiftHeld && hoveredAbility.scalingDescription && (
                        <div className="cmdbar__abilityTooltipScaling">
                          Scaling: {hoveredAbility.scalingDescription}
                        </div>
                      )}
                      <div className="cmdbar__abilityTooltipMeta">
                        Cost: {hoveredAbility.ppCost} PP
                      </div>
                      {!shiftHeld && (
                        <div className="cmdbar__abilityTooltipHint">
                          Hold Shift for more info
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                          className={`cmdbar__abilityButton${spirit.automatic ? " cmdbar__abilityButton--automatic" : ""}${spirit.automatic && spirit.usesRemaining <= 0 ? " cmdbar__abilityButton--automaticSpent" : ""}`}
                          disabled={
                            actionsDisabled ||
                            (!spirit.automatic &&
                              (spirit.usesRemaining <= 0 || spirit.available === false))
                          }
                          aria-disabled={spirit.automatic || undefined}
                          aria-describedby={tooltipId}
                          onClick={() => {
                            if (spirit.automatic) {
                              return;
                            }
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
                            {spirit.automatic
                              ? spirit.usesRemaining > 0
                                ? "Ready"
                                : "Spent"
                              : spirit.usesRemaining > 0
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
                            <strong>{spirit.automatic ? "Automatic:" : "Active:"}</strong>{" "}
                            {spirit.activeDescription}
                          </div>
                          <div>
                            <strong>Passive — {spirit.passiveName}:</strong>{" "}
                            {spirit.passiveDescription}
                          </div>
                          <div className="cmdbar__abilityTooltipMeta">
                            {spirit.automatic
                              ? spirit.usesRemaining > 0
                                ? "Rebirth is ready. Once per run."
                                : "Rebirth has been spent. Warm Embers remains active."
                              : spirit.usesRemaining > 0
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
                            <img src={item.icon} alt="" />
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
                  (c.id === "ghostHeal" && !ghostHealAvailable) ||
                  (c.id === "reform" && !canReform);
                const isActionUnavailable =
                  (c.id === "attack" ||
                    c.id === "defend" ||
                    c.id === "ghostStrike" ||
                    c.id === "ghostHeal" ||
                    c.id === "mysteriousPotion" ||
                    c.id === "reform") &&
                  actionsDisabled;

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`cmdbar__slot ${isSelected ? "cmdbar__slot--selected" : ""} ${isLocked ? "cmdbar__slot--locked" : ""} ${c.id === "spirit" && spiritUsed ? "cmdbar__slot--spirit-used" : ""}`}
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

                      if (c.id === "ghostHeal") {
                        onGhostHealSelect();
                        return;
                      }

                      if (c.id === "mysteriousPotion") {
                        onMysteriousPotionSelect();
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
                    {c.quantity !== undefined && (
                      <span className="cmdbar__slotQuantity">×{c.quantity}</span>
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
