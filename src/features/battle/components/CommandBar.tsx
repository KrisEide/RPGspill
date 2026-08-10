import { useMemo, useState } from "react";

import attackIcon from "../../../assets/icons/attackicon.png";
import defendIcon from "../../../assets/icons/defend_icon.png";
import magicIcon from "../../../assets/icons/magicicon.png";
import itemsIcon from "../../../assets/icons/inventoryicon.png";
import spiritIcon from "../../../assets/icons/spirit.png";
import portrait from "../../../assets/portraits/character1_1.png";

type CommandId = "attack" | "abilities" | "defend" | "spirit" | "items";
type CommandPanelId = "abilities" | "spirit" | "items";

type CommandDefinition = {
  id: CommandId;
  title: string;
  desc: string;
  icon: string;
  panelId: CommandPanelId | null;
  unavailable?: boolean;
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
  attackDisabled?: boolean;
  onAttackSelect: () => void;
};

export default function CommandBar({
  portraitSrc,
  attackDisabled = false,
  onAttackSelect,
}: Props) {
  const [selected, setSelected] = useState<CommandId>("attack");
  const [hovered, setHovered] = useState<CommandId | null>(null);
  const [openPanel, setOpenPanel] = useState<CommandPanelId | null>(null);

  const commands = useMemo<CommandDefinition[]>(
    () => [
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
        desc: "Reduce incoming damage this round.",
        icon: defendIcon,
        panelId: null,
        unavailable: true,
      },
      {
        id: "items",
        title: "Items",
        desc: "Open your inventory and use an item.",
        icon: itemsIcon,
        panelId: "items",
      },
    ],
    [],
  );

  const activeId = hovered ?? selected;
  const active = commands.find((c) => c.id === activeId)!;

  const portraitToUse = portraitSrc ?? portrait;
  const panelContent = openPanel ? PANEL_CONTENT[openPanel] : null;

  return (
    <div className="cmdbar">
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
            <button
              type="button"
              className="cmdbar__backButton"
              onClick={() => {
                setOpenPanel(null);
                setHovered(null);
              }}
            >
              <span aria-hidden="true">←</span> Back
            </button>
            <div className="cmdbar__panelContent">
              <div className="cmdbar__panelTitle">{panelContent.title}</div>
              <div className="cmdbar__emptyMessage">
                {panelContent.emptyMessage}
              </div>
            </div>
          </section>
        ) : (
          <div className="cmdbar__centerRow">
            <div className="cmdbar__icons">
              {commands.map((c) => {
                const isSelected = c.id === selected;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`cmdbar__slot ${isSelected ? "cmdbar__slot--selected" : ""} ${c.unavailable ? "cmdbar__slot--unavailable" : ""}`}
                    disabled={c.id === "attack" && attackDisabled}
                    aria-disabled={c.unavailable || undefined}
                    onClick={() => {
                      if (c.unavailable) {
                        return;
                      }

                      setSelected(c.id);
                      setHovered(null);

                      if (c.id === "attack") {
                        onAttackSelect();
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
                    <img
                      className={`cmdbar__icon cmdbar__icon--${c.id}`}
                      src={c.icon}
                      alt=""
                    />
                  </button>
                );
              })}
            </div>

            <div className="cmdbar__text">
              <div className="cmdbar__title">{active.title}</div>
              <div className="cmdbar__desc">{active.desc}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
