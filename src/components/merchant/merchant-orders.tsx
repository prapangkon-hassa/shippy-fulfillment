"use client";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/display";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { ShipmentActions } from "@/components/shipments/shipment-actions";
import { useStore } from "@/context/store-provider";
import { date, money } from "@/lib/utils";

const status_labels: Record<string, string> = { All: "ทั้งหมด", Pending: "รอจัดเตรียม", Processing: "แพ็กแล้ว", Shipped: "จัดส่งแล้ว", Delivered: "ส่งถึงแล้ว", Cancelled: "ยกเลิก" };
const payment_labels: Record<string,string> = { "QR Payment": "ชำระด้วย QR", "Credit/Debit Card": "บัตรเครดิต / เดบิต", "Cash on Delivery": "เก็บเงินปลายทาง" };

export default function MerchantOrders() {
  const { data, ready } = useStore();
  const [merchant, set_merchant] = useState("all");
  const [filter, set_filter] = useState("All");
  const [search, set_search] = useState("");
  const [limit, set_limit] = useState(24);
  const [selected, set_selected] = useState<string | null>(null);
  const all_shipments = data.orders.flatMap((order) => order.shipments.map((shipment) => ({
    order, shipment,
    merchant_name: data.merchants.find((m) => m.merchant_id === shipment.merchant_id)?.merchant_name ?? "ร้านค้า",
    items: order.items.filter((item) => item.merchant_id === shipment.merchant_id),
  })));
  const scoped = all_shipments.filter(({order, shipment, merchant_name}) =>
    (merchant === "all" || shipment.merchant_id === merchant) &&
    [order.order_id, shipment.tracking_number, merchant_name, order.address.full_name].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const matches = (entry: (typeof scoped)[number], status: string) => status === "All" ||
    (entry.order.status === "Cancelled" ? status === "Cancelled" : entry.shipment.shipping_status === status);
  const visible = scoped.filter((entry) => matches(entry,filter));
  const active = all_shipments.find(({shipment}) => shipment.shipment_id === selected);
  function payment_text(status: string, method: string) {
    if (status === "Pending") return method === "Cash on Delivery" ? "รอเก็บเงินปลายทาง" : "รอชำระเงิน";
    return null;
  }
  return <div className="section merchant-section seller-shipping">
    <div className="page-heading">
      <span className="eyebrow">สำหรับผู้ขาย</span>
      <h1>จัดการพัสดุ</h1>
      <p>หนึ่งแถวต่อหนึ่งพัสดุของแต่ละร้าน · เปิดจัดการเพื่ออัปเดตสินค้าทั้งพัสดุ</p>
    </div>
    <div className="tabs" aria-label="กรองสถานะพัสดุ">{Object.entries(status_labels).map(([status,label])=><button key={status} aria-pressed={filter===status} className={filter===status?"selected":""} onClick={()=>{set_filter(status);set_limit(24);}}>{label} <span className="muted">({ready ? scoped.filter((entry)=>matches(entry,status)).length : "—"})</span></button>)}</div>
    <div className="filter-bar">
      <label className="search-input"><Search size={17} /><input aria-label="ค้นหาพัสดุ" placeholder="ค้นหาเลขคำสั่งซื้อ, Shipping Tag หรือชื่อผู้รับ…" value={search} onChange={(e)=>{set_search(e.target.value);set_limit(24);}} /></label>
      <label className="filter-select">ร้านค้า<select aria-label="เลือกร้านค้า" value={merchant} onChange={(e)=>{set_merchant(e.target.value);set_limit(24);set_selected(null);}}>
        <option value="all">ทุกร้านค้า</option>{data.merchants.map((m)=><option key={m.merchant_id} value={m.merchant_id}>{m.merchant_name}</option>)}
      </select></label>
    </div>
    {!ready ? <LoadingSkeleton /> : <>
      <p className="muted shipping-count" aria-live="polite">พบ {visible.length} พัสดุ{visible.length>limit ? ` · แสดง ${limit} พัสดุแรก` : ""}</p>
      {!visible.length ? <EmptyState title="ไม่พบพัสดุในรายการนี้" description="ลองเปลี่ยนสถานะ ร้านค้า หรือคำค้น"><button className="button secondary" onClick={()=>{set_merchant("all");set_filter("All");set_search("");set_limit(24);}}>แสดงพัสดุทั้งหมด</button></EmptyState> : <div className="table-wrap panel shipment-list">
        <table>
          <thead><tr><th scope="col">คำสั่งซื้อ / วันที่</th><th scope="col">ร้านค้า / Shipping Tag</th><th scope="col">ผู้รับ</th><th scope="col">สินค้า</th><th scope="col">การชำระเงิน</th><th scope="col">สถานะพัสดุ</th><th scope="col">จัดการ</th></tr></thead>
          <tbody>{visible.slice(0,limit).map(({order,shipment,merchant_name,items})=><tr key={shipment.shipment_id}>
            <td><b>#{order.order_id}</b><small className="block muted mt-1">{date(order.order_date)}</small></td>
            <td><span>{merchant_name}</span><small className="block muted mt-1">{shipment.tracking_number}</small></td>
            <td>{order.address.full_name}</td>
            <td><span>{items.reduce((n,item)=>n+item.quantity,0)} ชิ้น</span><small className="block muted mt-1">{items.length} รายการ</small></td>
            <td>{payment_text(order.payment.payment_status,order.payment.payment_method) ? <span className="badge badge-pending">{payment_text(order.payment.payment_status,order.payment.payment_method)}</span> : <StatusBadge status={order.payment.payment_status} />}</td>
            <td><StatusBadge status={order.status==="Cancelled"?"Cancelled":shipment.shipping_status} shipment /></td>
            <td><button className="text-link" aria-label={`จัดการพัสดุ ${shipment.tracking_number}`} onClick={()=>set_selected(shipment.shipment_id)}>{["Completed","Cancelled"].includes(order.status)||shipment.shipping_status==="Delivered"?"ดูรายละเอียด":"จัดการพัสดุ"}<ArrowRight size={15} /></button></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {visible.length>limit&&<button className="button secondary mt-6" onClick={()=>set_limit(limit+24)}>ดูพัสดุเพิ่มเติม</button>}
    </>}
    {active&&<Modal title="รายละเอียดพัสดุ" on_close={()=>set_selected(null)}>
      <div className="shipping-modal-tag"><span>Shipping Tag</span><h3>{active.shipment.tracking_number}</h3><p>{active.merchant_name} · คำสั่งซื้อ #{active.order.order_id}</p><StatusBadge status={active.order.status==="Cancelled"?"Cancelled":active.shipment.shipping_status} shipment /></div>
      <section className="shipping-modal-section"><h3>ผู้รับและที่อยู่จัดส่ง</h3><p>{active.order.address.full_name} · {active.order.address.phone}</p><p className="muted">{active.order.address.address_line}</p></section>
      <section className="shipping-modal-section"><h3>สินค้าในพัสดุนี้ ({active.items.reduce((n,item)=>n+item.quantity,0)} ชิ้น)</h3><p className="muted text-sm">ทุกรายการด้านล่างใช้สถานะพัสดุเดียวกัน</p>{active.items.map(item=><div className="summary-row" key={item.order_item_id}><span>{item.product_name}<small className="block muted">{item.variant_name} × {item.quantity} ชิ้น</small></span><b>{money(item.subtotal)}</b></div>)}<div className="summary-row"><span>รวมค่าสินค้าในพัสดุ</span><b>{money(active.items.reduce((n,item)=>n+item.subtotal,0))}</b></div></section>
      <section className="shipping-modal-section"><h3>การชำระเงินของทั้งออเดอร์</h3><div className="row between wrap gap-3"><span>{payment_labels[active.order.payment.payment_method]??active.order.payment.payment_method}</span>{payment_text(active.order.payment.payment_status,active.order.payment.payment_method) ?? <StatusBadge status={active.order.payment.payment_status} />}</div><p className="muted text-sm">ยอดทั้งออเดอร์ {money(active.order.total_amount)} รวมทุกร้าน ค่าส่ง และส่วนลด</p></section>
      {!["Cancelled","Completed"].includes(active.order.status)&&<ShipmentActions shipment={active.shipment} />}
      {active.order.status==="Completed"&&<p className="notice">ส่งถึงครบทุกพัสดุแล้ว คำสั่งซื้อนี้เสร็จสมบูรณ์</p>}
      {active.order.status==="Cancelled"&&<p className="notice">คำสั่งซื้อถูกยกเลิกแล้ว · คืนสต็อก {active.order.stock_restored_units} ชิ้นทั้งออเดอร์ · เหตุผล: {active.order.cancel_reason}</p>}
    </Modal>}
  </div>;
}
