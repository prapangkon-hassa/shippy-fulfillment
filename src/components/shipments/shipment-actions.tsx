"use client";
import { useState } from "react";
import { Truck } from "lucide-react";
import { useStore } from "@/context/store-provider";
import type { shipment, shipping_status } from "@/types/shipment";

export function ShipmentActions({ shipment }: { shipment: shipment }) {
  const { update_shipment } = useStore();
  const [error, set_error] = useState("");
  const [busy, set_busy] = useState(false);
  const next = ({ Pending: "Processing", Processing: "Shipped", Shipped: "Delivered" } as Partial<Record<shipping_status, shipping_status>>)[shipment.shipping_status];
  const labels = { Processing: "แพ็กแล้ว", Shipped: "จัดส่งแล้ว", Delivered: "ส่งถึงแล้ว" };
  async function change() {
    if (busy || !next) return;
    set_busy(true);
    set_error("");
    try { await update_shipment(shipment.shipment_id, next); }
    catch (e) { set_error((e as Error).message); }
    finally { set_busy(false); }
  }
  return <section className="shipment-actions">
    <h3 className="row gap-2"><Truck size={18} /> อัปเดตสถานะพัสดุ</h3>
    <p className="muted text-sm my-3">อัปเดตครั้งเดียวสำหรับสินค้าทุกชิ้นใน Shipping Tag นี้</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    {next ? <button className="button" disabled={busy} onClick={change}>
      {busy ? "กำลังอัปเดต…" : `อัปเดตสถานะ → ${labels[next as keyof typeof labels]}`}
    </button> : <p className="notice">ส่งพัสดุนี้สำเร็จแล้ว ออเดอร์จะเสร็จสมบูรณ์เมื่อส่งครบทุกพัสดุ</p>}
  </section>;
}
