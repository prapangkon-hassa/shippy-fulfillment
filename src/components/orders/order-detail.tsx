"use client";
import { CancelOrder } from "./cancel-order";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { ReviewForm } from "@/components/reviews/review-form";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/display";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { useStore } from "@/context/store-provider";
import { date, money } from "@/lib/utils";
import { ArrowLeft, Pencil, Star, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function OrderDetail({ id }: { id: string }) {
  const { data, ready, delete_review } = useStore();
  const { merchants } = data;
  const current_customer = { customer_id: data.current_customer_id };
  const [review_product, set_review_product] = useState<string | null>(null);
  const [deleting, set_deleting] = useState<string | null>(null);
  const order = data.orders.find(
    (o) => o.order_id === id && o.customer_id === current_customer.customer_id,
  );
  if (!ready)
    return (
      <div className="container section">
        <LoadingSkeleton />
      </div>
    );
  if (!order)
    return (
      <EmptyState
        title="ไม่พบคำสั่งซื้อ"
        description="ไม่พบคำสั่งซื้อนี้ในบัญชีทดลองของคุณ"
      >
        <Link className="button" href="/orders">
          คำสั่งซื้อของฉัน
        </Link>
      </EmptyState>
    );
  return (
    <div className="container section">
      <Link href="/orders" className="back-link">
        <ArrowLeft size={15} /> คำสั่งซื้อทั้งหมด
      </Link>
      <div className="page-heading row between wrap">
        <div>
          <span className="eyebrow">รายละเอียดคำสั่งซื้อ</span>
          <h1>{order.order_id}</h1>
          <p>สั่งซื้อเมื่อ {date(order.order_date)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <CancelOrder order={order} />
      <section className="panel tracking-panel mt-4">
        <div className="row between wrap">
          <h2>สถานะคำสั่งซื้อ</h2>
          <p className="muted">ซื้อหลายร้านจะแยกพัสดุ · เก็บเงินปลายทางจะแสดงชำระเงินแล้วเมื่อส่งครบ</p>
          {order.status === "Cancelled" && (
            <span className="field-error">คำสั่งซื้อนี้ถูกยกเลิกแล้ว</span>
          )}
        </div>
        {order.status !== "Cancelled" && <OrderStatusTimeline order={order} />}
      </section>
      <div className="checkout-grid mt-6">
        <div className="space-y-6">
          <section className="panel form-section">
            <h2>สินค้าที่สั่งซื้อ</h2>
            {order.items.map((item) => {
              const review = data.reviews.find(
                (r) =>
                  r.product_id === item.product_id &&
                  r.customer_id === current_customer.customer_id,
              );
              return (
                <div className="order-detail-item" key={item.order_item_id}>
                  <div className="grow">
                    <h3>{item.product_name}</h3>
                    <p className="muted text-sm">{item.variant_name}</p>
                    <p className="text-sm my-2">
                      {money(item.unit_price)} × {item.quantity}
                    </p>
                    {order.status === "Completed" && (
                      <div className="row gap-3 wrap">
                        <button
                          className="text-link"
                          onClick={() => set_review_product(item.product_id)}
                        >
                          {review ? <Pencil size={13} /> : <Star size={13} />}{" "}
                          {review ? "แก้ไขรีวิว" : "เขียนรีวิว"}
                        </button>
                        {review && (
                          <button
                            className="text-link muted"
                            onClick={() => set_deleting(review.review_id)}
                          >
                            <Trash2 size={13} /> ลบรีวิว
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <b>{money(item.subtotal)}</b>
                </div>
              );
            })}
          </section>
          <section className="panel form-section">
            <h2>
              <Truck size={19} /> พัสดุแยกตามร้านค้า
            </h2>
            {order.shipments.map((s) => (
              <div className="shipment-info" key={s.shipment_id}>
                <div className="row between wrap">
                  <b>
                    {
                      merchants.find((m) => m.merchant_id === s.merchant_id)
                        ?.merchant_name
                    }
                  </b>
                  <StatusBadge status={s.shipping_status} shipment />
                </div>
                <dl className="info-list">
                  <div>
                    <dt>บริษัทขนส่ง</dt>
                    <dd>{s.carrier || "รอร้านค้าระบุขนส่ง"}</dd>
                  </div>
                  <div>
                    <dt>Shipping Tag / เลขพัสดุ</dt>
                    <dd>{s.tracking_number || "รอร้านค้าจัดส่ง"}</dd>
                  </div>
                  <div>
                    <dt>ค่าจัดส่ง</dt>
                    <dd>{money(s.shipping_cost)}</dd>
                  </div>
                  {s.shipped_at && (
                    <div>
                      <dt>วันที่จัดส่ง</dt>
                      <dd>{date(s.shipped_at)}</dd>
                    </div>
                  )}
                  {s.delivered_at && (
                    <div>
                      <dt>วันที่ส่งถึง</dt>
                      <dd>{date(s.delivered_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </section>
        </div>
        <div className="space-y-6">
          <section className="panel summary">
            <h2>การชำระเงินและยอดรวม</h2>
            <div className="row between mb-6">
              <span>{order.payment.payment_method}</span>
              <StatusBadge status={order.payment.payment_status} />
            </div>
            <div className="summary-row">
              <span>ราคาสินค้ารวม</span>
              <span>{money(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>ส่วนลด</span>
              <span>−{money(order.discount_amount)}</span>
            </div>
            <div className="summary-row">
              <span>ค่าจัดส่ง</span>
              <span>{money(order.shipping_fee)}</span>
            </div>
            <div className="summary-total">
              <b>ยอดรวมสุทธิ</b>
              <b>{money(order.total_amount)}</b>
            </div>
            <h3 className="mt-5">ประวัติการชำระเงิน</h3>
            {order.payments.map((payment) => (
              <div className="summary-row" key={payment.payment_id}>
                <span>
                  {payment.payment_method}
                  <small className="block">
                    {payment.transaction_ref ?? "ไม่มีเลขอ้างอิง"}
                  </small>
                  <StatusBadge status={payment.payment_status} />
                </span>
                <b>{money(payment.amount)}</b>
              </div>
            ))}
          </section>
          <section className="panel form-section">
            <h2>ที่อยู่ผู้รับ</h2>
            <b>{order.address.full_name}</b>
            <p className="muted leading-7 mt-2">
              {order.address.address_line}
              <br />
              {order.address.phone}
            </p>
          </section>
        </div>
      </div>
      {review_product && (
        <ReviewForm
          key={review_product}
          product_id={review_product}
          existing={data.reviews.find(
            (r) =>
              r.product_id === review_product &&
              r.customer_id === current_customer.customer_id,
          )}
          on_close={() => set_review_product(null)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDialog
          title="ลบรีวิวนี้หรือไม่?"
          description="รีวิวนี้จะถูกลบออกจากหน้าสินค้า"
          on_close={() => set_deleting(null)}
          on_confirm={async () => {
            await delete_review(deleting);
            set_deleting(null);
          }}
        />
      )}
    </div>
  );
}
