"use client";
import { useStore } from "@/context/store-provider";
import { money } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/ui/feedback";
export default function Reports() {
  const { data, ready } = useStore();
  if (!ready) return <LoadingSkeleton />;
  const rows = data.report;
  const gross = rows.reduce((n, r) => n + Number(r.gross_sales), 0);
  const shipping = rows.reduce((n, r) => n + Number(r.shipping_fees), 0);
  const orders = data.orders.filter((o) => o.status !== "Cancelled");
  const discount = orders.reduce((n, o) => n + o.discount_amount, 0);
  return (
    <div className="section merchant-section">
      <div className="page-heading">
        <span className="eyebrow">รายงานยอดขาย</span>
        <h1>สรุปยอดขายร้านค้า</h1>
        <p>รวมคำสั่งซื้อที่ไม่ถูกยกเลิก · อัปเดตข้อมูลจากฐานข้อมูล</p>
      </div>
      <div className="panel form-section">
        <div className="summary-row">
          <span>ยอดค่าสินค้าก่อนส่วนลด</span>
          <b>{money(gross)}</b>
        </div>
        <div className="summary-row">
          <span>ส่วนลดรวม</span>
          <b>{money(discount)}</b>
        </div>
        <div className="summary-row">
          <span>ค่าจัดส่ง</span>
          <b>{money(shipping)}</b>
        </div>
        <div className="summary-total">
          <span>มูลค่าคำสั่งซื้อ (รวมเก็บเงินปลายทางที่ยังไม่ชำระ)</span>
          <b>{money(gross - discount + shipping)}</b>
        </div>
        <p>{orders.length} คำสั่งซื้อ</p>
      </div>
      <div className="table-wrap panel mt-6">
        <table>
          <thead>
            <tr>
              <th>ร้านค้า</th>
              <th>หมวดหมู่</th>
              <th>คำสั่งซื้อ</th>
              <th>จำนวนชิ้น</th>
              <th>ยอดขายก่อนส่วนลด</th>
              <th>ค่าจัดส่ง</th>
              <th>สินค้าขายดี</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.merchant_id + "-" + r.category_id}>
                <td>{r.merchant_name}</td>
                <td>{r.category_name}</td>
                <td>{r.order_count}</td>
                <td>{r.units_sold}</td>
                <td>{money(Number(r.gross_sales))}</td>
                <td>{money(Number(r.shipping_fees))}</td>
                <td>
                  {r.best_product_name} ({r.best_product_units} ชิ้น)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p>ยังไม่มียอดขาย</p>}
      </div>
    </div>
  );
}

