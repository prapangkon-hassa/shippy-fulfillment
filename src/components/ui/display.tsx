import { money } from "@/lib/utils";
import { Star } from "lucide-react";

export function PriceDisplay({ amount }: { amount: number }) {
  return <span>{money(amount)}</span>;
}

export function RatingStars({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  return (
    <span className="rating" aria-label={rating + " out of 5 stars"}>
      <Star size={13} fill="currentColor" />
      <b>{rating ? rating.toFixed(1) : "ใหม่"}</b>
      {count !== undefined && <span className="muted">({count})</span>}
    </span>
  );
}

export function StatusBadge({ status, shipment = false }: { status: string; shipment?: boolean }) {
  return (
    <span
      className={"badge badge-" + status.toLowerCase().replaceAll(" ", "-")}
    >
      {shipment && status === "Pending" ? "รอจัดเตรียม" : ({ Active: "เปิดขาย", Inactive: "ปิดการขาย", Pending: "รอดำเนินการ", Paid: "ชำระเงินแล้ว", Processing: "แพ็กแล้ว", Shipped: "จัดส่งแล้ว", Delivered: "ส่งถึงแล้ว", Completed: "สำเร็จ", Cancelled: "ยกเลิก", Failed: "ไม่สำเร็จ", Refunded: "คืนเงินจำลองแล้ว", Void: "ยกเลิกการชำระเงิน" } as Record<string, string>)[status] ?? status}
    </span>
  );
}
