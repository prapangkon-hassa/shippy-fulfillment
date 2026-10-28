import { PackageOpen } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <PackageOpen size={38} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading"
      role="status"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton">
          <div />
          <p />
          <p />
        </div>
      ))}
    </div>
  );
}
