import damageBox from "../../../assets/icons/damage_box.png";
import criticalHitBox from "../../../assets/icons/critical_hit_box.png";

type Props = {
  amount: number;
  isCritical: boolean;
  absorbedByBarrier?: number;
  durationMs?: number;
};

export default function DamageNumber({
  amount,
  isCritical,
  absorbedByBarrier = 0,
  durationMs,
}: Props) {
  return (
    <div
      className="damageNumberGroup"
      aria-hidden="true"
      style={
        durationMs
          ? ({ "--damage-number-duration": `${durationMs}ms` } as React.CSSProperties)
          : undefined
      }
    >
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
