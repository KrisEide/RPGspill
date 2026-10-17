import damageBox from "../../../assets/icons/damage_box.png";
import criticalHitBox from "../../../assets/icons/critical_hit_box.png";

type Props = {
  amount: number;
  isCritical: boolean;
  absorbedByBarrier?: number;
  durationMs?: number;
  isBlocked?: boolean;
  variant?: "embertail";
};

export default function DamageNumber({
  amount,
  isCritical,
  absorbedByBarrier = 0,
  durationMs,
  isBlocked = false,
  variant,
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
      {isBlocked && (
        <div className="bodyguardNumber">🐕 BLOCKED</div>
      )}
      {amount > 0 && (
        <div
          className={`damageNumber ${isCritical ? "damageNumber--critical" : ""}${variant ? ` damageNumber--${variant}` : ""}`}
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
