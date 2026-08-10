import damageBox from "../../../assets/icons/damage_box.png";
import criticalHitBox from "../../../assets/icons/critical_hit_box.png";

type Props = {
  amount: number;
  isCritical: boolean;
};

export default function DamageNumber({ amount, isCritical }: Props) {
  return (
    <div
      className={`damageNumber ${isCritical ? "damageNumber--critical" : ""}`}
      aria-hidden="true"
    >
      <img
        className="damageNumber__frame"
        src={isCritical ? criticalHitBox : damageBox}
        alt=""
      />
      <span className="damageNumber__value">{amount}</span>
    </div>
  );
}
