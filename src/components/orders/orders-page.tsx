"use client";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { useStore } from "@/context/store-provider";
import { get_orders } from "@/services/orders.service";
import Link from "next/link";
import { useState } from "react";
import { OrderCard } from "./order-card";

export function OrdersPage() {
  const { data, ready } = useStore();
  const [filter, set_filter] = useState("All");
  const orders = get_orders(data).filter(
    (o) => filter === "All" || o.status === filter,
  );
  return (
    <div className="container section">
      <div className="page-heading">
        <span className="eyebrow">ติดตามสถานะหลังสั่งซื้อ</span>
        <h1>
          คำสั่งซื้อของฉัน<span className="heading-dot">.</span>
        </h1>
        <p>กด “ดูรายละเอียด / ติดตามพัสดุ” เพื่อดูแต่ละพัสดุ ออเดอร์จะเสร็จสมบูรณ์เมื่อส่งครบทุกชิ้น</p>
      </div>
      <div className="tabs">
        {["All", "Pending", "Paid", "Processing", "Shipped", "Completed", "Cancelled"].map((s) => (
          <button
            key={s}
            className={filter === s ? "selected" : ""}
            aria-pressed={filter === s}
            onClick={() => set_filter(s)}
          >
            {{ All: "ทั้งหมด", Pending: "รอชำระเงิน", Paid: "ชำระเงินแล้ว", Processing: "แพ็กแล้ว", Shipped: "จัดส่งแล้ว", Completed: "สำเร็จ", Cancelled: "ยกเลิก" }[s]}
          </button>
        ))}
      </div>
      {!ready ? (
        <LoadingSkeleton />
      ) : orders.length ? (
        <div className="space-y-5">
          {orders.map((o) => (
            <OrderCard order={o} key={o.order_id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีคำสั่งซื้อในสถานะนี้"
          description="เลือกสถานะอื่น หรือเริ่มเลือกสินค้าเพื่อสร้างคำสั่งซื้อแรก"
        >
          <Link className="button" href="/">
            เลือกซื้อสินค้า
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
