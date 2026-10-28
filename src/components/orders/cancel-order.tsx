"use client";
import { useState } from "react";
import { useStore } from "@/context/store-provider";
import { Modal } from "@/components/ui/dialog";
import { date, money } from "@/lib/utils";
import type { order_record } from "@/types/order";
export function CancelOrder({order}: {order:order_record}) {
  const {cancel_order} = useStore();
  const [open,set_open]=useState(false), [busy,set_busy]=useState(false);
  const [reason,set_reason]=useState(""), [error,set_error]=useState("");
  if(order.status==="Cancelled") return <section className="notice mt-4"><b>คำสั่งซื้อถูกยกเลิกแล้ว</b><p>เหตุผล: {order.cancel_reason ?? "—"}</p><p>คืนสต็อก {order.stock_restored_units} ชิ้น · {order.cancelled_at ? date(order.cancelled_at) : ""}</p><p>ผู้ยกเลิก: {order.cancelled_by ?? "—"}</p><p>คืนเงินจำลอง {money(order.payments.reduce((n,p)=>n+p.refunded_amount,0))} · สินค้าไม่ถูกเพิ่มกลับเข้าตะกร้า</p></section>;
  const eligible=!['Shipped','Completed'].includes(order.status)&&order.shipments.every(s=>!s.shipped_at&&!s.delivered_at&&!['Shipped','Delivered'].includes(s.shipping_status));
  if(!eligible) return <p className="muted mt-4">ไม่สามารถยกเลิกทั้งออเดอร์ได้ เนื่องจากมีพัสดุที่จัดส่งแล้ว</p>;
  async function submit(e:React.FormEvent) {
    e.preventDefault(); if(busy)return;
    if(!reason.trim()){set_error("กรุณาระบุเหตุผลการยกเลิก");return;}
    set_busy(true);set_error("");
    try {await cancel_order(order.order_id,reason.trim());set_open(false);}
    catch(e){set_error((e as Error).message);}finally{set_busy(false);}
  }
  return <div className="mt-4"><button className="button danger" onClick={()=>set_open(true)}>ยกเลิกคำสั่งซื้อ</button>
    {open&&<Modal title="ยืนยันยกเลิกทั้งคำสั่งซื้อ" on_close={()=>{if(!busy)set_open(false);}}><form onSubmit={submit}>
      <p>ยกเลิกคำสั่งซื้อ #{order.order_id} ของทุกร้าน รวม {order.items.reduce((n,i)=>n+i.quantity,0)} ชิ้น และคืนสต็อกทั้งหมด</p>
      <p className="muted my-3">ชำระแล้วจะคืนเงินจำลอง ส่วนที่ยังไม่ชำระจะยกเลิกการชำระเงิน สินค้าจะไม่กลับเข้าตะกร้า</p>
      <label className="field">เหตุผลการยกเลิก<textarea aria-label="เหตุผลการยกเลิก" maxLength={500} required value={reason} onChange={e=>set_reason(e.target.value)} /></label>
      {error&&<p role="alert" className="field-error">{error}</p>}
      <div className="actions mt-4"><button type="button" className="button secondary" disabled={busy} onClick={()=>set_open(false)}>เก็บคำสั่งซื้อไว้</button><button className="button danger" disabled={busy}>{busy?"กำลังยกเลิก…":"ยืนยันยกเลิกคำสั่งซื้อ"}</button></div>
    </form></Modal>}
  </div>;
}
