import { order_record } from "@/types";
import { Check } from "lucide-react";

export function OrderStatusTimeline({ order }: { order: order_record }) {
  const shipments = order.shipments;
  const all = (states: string[]) =>
    shipments.length > 0 &&
    shipments.every((s) => states.includes(s.shipping_status));
  const steps = [
    { label: "รับคำสั่งซื้อ", done: order.status !== "Cancelled" },
    { label: "ชำระเงิน", done: order.payment.payment_status === "Paid" },
    { label: "แพ็กแล้ว", done: all(["Processing", "Shipped", "Delivered"]) },
    { label: "จัดส่งแล้ว", done: all(["Shipped", "Delivered"]) },
    { label: "ส่งถึงแล้ว", done: all(["Delivered"]) },
    { label: "สำเร็จ", done: order.status === "Completed" },
  ];
  return (
    <ol className="timeline">
      {steps.map((step, i) => (
        <li key={step.label} className={step.done ? "done" : ""}>
          <span>{step.done ? <Check size={15} /> : i + 1}</span>
          <small>{step.label}</small>
        </li>
      ))}
    </ol>
  );
}
