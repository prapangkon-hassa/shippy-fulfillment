import { money, shipping_fee } from "@/lib/utils";
import { LockKeyhole } from "lucide-react";

export function OrderSummary({
  subtotal,
  discount = 0,
  children,
}: {
  subtotal: number;
  discount?: number;
  children?: React.ReactNode;
}) {
  return (
    <aside className="panel summary">
      <h2>สรุปยอดคำสั่งซื้อ</h2>
      <div className="summary-row">
        <span>ราคาสินค้ารวม</span>
        <span>{money(subtotal)}</span>
      </div>
      <div className="summary-row">
        <span>ค่าจัดส่ง</span>
        <span>
          {shipping_fee(subtotal) ? money(shipping_fee(subtotal)) : "ฟรี"}
        </span>
      </div>
      <div className="summary-row">
        <span>ส่วนลด</span>
        <span>{money(discount)}</span>
      </div>
      <div className="summary-total">
        <b>ยอดรวมสุทธิ</b>
        <b>{money(subtotal + shipping_fee(subtotal) - discount)}</b>
      </div>
      {children}
      <p className="summary-note">
        <LockKeyhole size={14} /> ระบบสาธิต ไม่มีการเรียกเก็บเงินจริง
      </p>
    </aside>
  );
}
