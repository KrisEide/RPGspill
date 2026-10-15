import barrierFlaskIcon from "../../../assets/icons/barrierflask.png";
import blastBombIcon from "../../../assets/icons/blastbomb.png";
import cleanseTonicIcon from "../../../assets/icons/cleanstonic.png";
import elixirIcon from "../../../assets/icons/elixir.png";
import healingPotionIcon from "../../../assets/icons/healingpotion.png";
import mysteriousPotionIcon from "../../../assets/icons/mysteriouspotion.png";
import phoenixTonicIcon from "../../../assets/icons/pheonixtonic.png";
import powerTonicIcon from "../../../assets/icons/powertonic.png";
import razorBombIcon from "../../../assets/icons/razorbomb.png";
import steelDartIcon from "../../../assets/icons/steeldart.png";
import throwingKnifeIcon from "../../../assets/icons/throwingknife.png";
import bombBlastEffect from "../../../assets/Effect/bomblast.png";
import razorBombEffect from "../../../assets/Effect/razorbomb.png";
import type { ItemId } from "../../../game/types";

export const ITEM_ICONS: Readonly<Record<ItemId, string>> = {
  healingPotion: healingPotionIcon,
  mysteriousPotion: mysteriousPotionIcon,
  elixir: elixirIcon,
  throwingKnife: throwingKnifeIcon,
  blastBomb: blastBombIcon,
  razorBomb: razorBombIcon,
  barrierFlask: barrierFlaskIcon,
  powerTonic: powerTonicIcon,
  cleansingTonic: cleanseTonicIcon,
  steelDart: steelDartIcon,
  fuseDart: steelDartIcon,
  phoenixTonic: phoenixTonicIcon,
};

export const ITEM_BATTLEFIELD_EFFECTS: Readonly<
  Partial<
    Record<
      ItemId,
      {
        spriteSrc: string;
        width: number;
        variant: "blastBomb" | "razorBomb";
        durationMs: number;
        impactDelayMs: number;
        eventDurationMs: number;
        position?: {
          left: string;
          top: string;
        };
      }
    >
  >
> = {
  blastBomb: {
    spriteSrc: bombBlastEffect,
    width: 480,
    variant: "blastBomb",
    durationMs: 2400,
    impactDelayMs: 850,
    eventDurationMs: 3200,
  },
  razorBomb: {
    spriteSrc: razorBombEffect,
    width: 520,
    variant: "razorBomb",
    durationMs: 2600,
    impactDelayMs: 950,
    eventDurationMs: 3500,
  },
};

export type ItemProjectileVisualDefinition = {
  spriteSrc: string;
  width: number;
  variant: "throwingKnife" | "steelDart" | "fuseDart";
  durationMs: number;
  rotationOffsetDegrees: number;
};

export const ITEM_PROJECTILE_VISUALS: Readonly<
  Partial<Record<ItemId, ItemProjectileVisualDefinition>>
> = {
  throwingKnife: {
    spriteSrc: throwingKnifeIcon,
    width: 150,
    variant: "throwingKnife",
    durationMs: 1450,
    rotationOffsetDegrees: -135,
  },
  steelDart: {
    spriteSrc: steelDartIcon,
    width: 115,
    variant: "steelDart",
    durationMs: 950,
    rotationOffsetDegrees: -135,
  },
  fuseDart: {
    spriteSrc: steelDartIcon,
    width: 125,
    variant: "fuseDart",
    durationMs: 1100,
    rotationOffsetDegrees: -135,
  },
};
