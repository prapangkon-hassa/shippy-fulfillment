import { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="panel metric">
      <div className="row between">
        <span className="muted">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <h2>{value}</h2>
      <p>{detail}</p>
    </div>
  );
}
