"use client";
import { StatusBadge } from "@/components/ui/display";
import { date, money } from "@/lib/utils";
import { order_record } from "@/types";
import { ArrowRight, Package } from "lucide-react";
import Link from "next/link";

export function OrderCard({ order }: { order: order_record }) {
  return (
    <article className="panel order-card">
      <div className="row between wrap">
        <div className="row gap-3">
          <span className="order-icon">
            <Package size={21} />
          </span>
          <div>
            <h3>คำสั่งซื้อ #{order.order_id}</h3>
            <p className="muted text-sm">
              {date(order.order_date)} ·{" "}
              {order.items.reduce((n, i) => n + i.quantity, 0)} ชิ้น
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="order-card-body">
        <div className="order-thumbnails">
          {order.items.map((i) => (
            <span key={i.order_item_id}>
              {i.product_name} × {i.quantity}
            </span>
          ))}
        </div>
        <div>
          <span className="muted text-xs block mb-1">การชำระเงิน</span>
          <StatusBadge status={order.payment.payment_status} />
        </div>
        <div>
          <span className="muted text-xs block mb-1">ยอดรวม</span>
          <b>{money(order.total_amount)}</b>
        </div>
        <Link className="button secondary" href={"/orders/" + order.order_id}>
          ดูรายละเอียด / ติดตามพัสดุ <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
