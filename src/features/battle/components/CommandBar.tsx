import { useMemo, useState } from "react";

import attackIcon from "../../../assets/commandBarUi/attackicon.png";
import magicIcon from "../../../assets/commandBarUi/Magicicon.png";
import itemsIcon from "../../../assets/commandBarUi/inventoryicon.png";
import portrait from "../../../assets/portraits/Character1_1.png";

type CommandId = "attack" | "abilities" | "items";

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

  const commands = useMemo(
    () => [
      {
        id: "attack" as const,
        title: "Attack",
        desc: "Angrip med våpenet ditt.",
        icon: attackIcon,
      },
      {
        id: "abilities" as const,
        title: "Abilities",
        desc: "Spells/skills (kommer senere).",
        icon: magicIcon,
      },
      {
        id: "items" as const,
        title: "Items",
        desc: "Åpne inventory og bruk items.",
        icon: itemsIcon,
      },
    ],
    [],
  );

  const activeId = hovered ?? selected;
  const active = commands.find((c) => c.id === activeId)!;

  const portraitToUse = portraitSrc ?? portrait;

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
        <div className="cmdbar__centerRow">
          <div className="cmdbar__icons">
            {commands.map((c) => {
              const isSelected = c.id === selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cmdbar__slot ${isSelected ? "cmdbar__slot--selected" : ""}`}
                  disabled={c.id === "attack" && attackDisabled}
                  onClick={() => {
                    setSelected(c.id);
                    if (c.id === "attack") {
                      onAttackSelect();
                    }
                  }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={c.title}
                >
                  <img className="cmdbar__icon" src={c.icon} alt="" />
                </button>
              );
            })}
          </div>

          <div className="cmdbar__text">
            <div className="cmdbar__title">{active.title}</div>
            <div className="cmdbar__desc">{active.desc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
