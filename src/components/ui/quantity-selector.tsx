"use client";
import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  max,
  on_change,
}: {
  value: number;
  max: number;
  on_change: (n: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => on_change(value - 1)}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => on_change(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
