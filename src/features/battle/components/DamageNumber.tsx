import damageBox from "../../../assets/icons/damage_box.png";
import criticalHitBox from "../../../assets/icons/critical_hit_box.png";

type Props = {
  amount: number;
  isCritical: boolean;
  absorbedByBarrier?: number;
};

export default function DamageNumber({
  amount,
  isCritical,
  absorbedByBarrier = 0,
}: Props) {
  return (
    <div className="damageNumberGroup" aria-hidden="true">
      {absorbedByBarrier > 0 && (
        <div className="barrierNumber">🛡 −{absorbedByBarrier}</div>
      )}
      {amount > 0 && (
        <div
          className={`damageNumber ${isCritical ? "damageNumber--critical" : ""}`}
        >
          <img
            className="damageNumber__frame"
            src={isCritical ? criticalHitBox : damageBox}
            alt=""
          />
          <span className="damageNumber__value">{amount}</span>
        </div>
      )}
    </div>
  );
}
