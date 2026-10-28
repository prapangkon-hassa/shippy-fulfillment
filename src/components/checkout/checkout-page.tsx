"use client";
import { OrderSummary } from "@/components/cart/order-summary";
import { useCartLines } from "@/components/cart/use-cart-lines";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { useStore } from "@/context/store-provider";
import { money } from "@/lib/utils";
import { checkout_input, payment_method } from "@/types";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const fields: {
  key: keyof Omit<checkout_input, "payment_method" | "coupon_code">;
  label: string;
  type?: string;
  auto_complete: string;
}[] = [
  { key: "full_name", label: "ชื่อและนามสกุลผู้รับ", auto_complete: "name" },
  { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", auto_complete: "tel" },
  { key: "address_line", label: "ที่อยู่จัดส่ง (บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์)", auto_complete: "street-address" },
];

export function CheckoutPage() {
  const { ready, checkout, checkout_draft } = useStore();
  const lines = useCartLines(checkout_draft?.items ?? []);
  const [form, set_form] = useState<checkout_input>({
    full_name: "",
    phone: "",
    address_line: "",
    coupon_code: "",
    payment_method: "" as payment_method,
  });
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [busy, set_busy] = useState(false);
  const [order_id, set_order_id] = useState("");
  const subtotal = lines.reduce((n, i) => n + i.quantity * i.variant.price, 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      if (!form[f.key].trim()) next[f.key] = f.label + ": กรุณากรอกข้อมูล";
    });
    if (!form.payment_method) next.payment_method = "เลือกวิธีชำระเงิน.";
    set_errors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      );
      return;
    }
    set_busy(true);
    try {
      set_order_id(await checkout(form));
    } catch (error) {
      set_errors({
        submit:
          error instanceof Error
            ? error.message
            : "สั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง",
      });
    } finally {
      set_busy(false);
    }
  }
  if (!ready)
    return (
      <div className="container section">
        <LoadingSkeleton />
      </div>
    );
  if (order_id)
    return (
      <div className="container section">
        <div className="success-panel panel">
          <CheckCircle2 size={54} />
          <span className="eyebrow">บันทึกคำสั่งซื้อสำเร็จ</span>
          <h1>ขอบคุณคุณ {form.full_name.split(" ")[0]}.</h1>
          <p>
            คำสั่งซื้อทดลองหมายเลข <b>{order_id}</b> ถูกบันทึกแล้ว
          </p>
          <p className="muted">
            ไม่มีการเรียกเก็บเงินจริง ติดตามสถานะและพัสดุได้จากปุ่มด้านล่าง
          </p>
          <Link className="button" href={"/orders/" + order_id}>
            ดูคำสั่งซื้อและติดตามพัสดุ <ArrowRight size={16} />
          </Link>
          <Link className="text-link" href="/">
            เลือกสินค้าเพิ่ม
          </Link>
        </div>
      </div>
    );
  if (!lines.length)
    return (
      <EmptyState
        title="ยังไม่ได้เลือกรายการชำระเงิน"
        description="กลับไปเลือกสินค้าในตะกร้า หรือกดซื้อเลยจากหน้าสินค้า"
      >
        <Link className="button" href="/">
          เลือกซื้อสินค้า
        </Link>
      </EmptyState>
    );
  function field(f: (typeof fields)[number]) {
    return (
      <label
        className={"field " + (f.key === "address_line" ? "col-span-full" : "")}
        key={f.key}
      >
        {f.label}
        <input
          type={f.type ?? "text"}
          autoComplete={f.auto_complete}
          aria-label={f.label}
          value={form[f.key]}
          onChange={(e) => set_form({ ...form, [f.key]: e.target.value })}
          aria-invalid={!!errors[f.key]}
          aria-describedby={errors[f.key] ? "error-" + f.key : undefined}
          required
        />
        {errors[f.key] && (
          <small id={"error-" + f.key} className="field-error">
            {errors[f.key]}
          </small>
        )}
      </label>
    );
  }
  return (
    <div className="container section">
      <Link href="/cart" className="back-link">
        <ArrowLeft size={15} /> กลับไปแก้ไขตะกร้า
      </Link>
      <div className="page-heading">
        <span className="eyebrow">ขั้นตอนที่ 2 จาก 2 · ข้อมูลจัดส่ง</span>
        <h1>
          ยืนยันคำสั่งซื้อ<span className="heading-dot">.</span>
        </h1>
        <p>{checkout_draft?.mode === "buy_now" ? "ซื้อเลย: เฉพาะสินค้าที่เลือกจากหน้าสินค้า ตะกร้าเดิมจะไม่ถูกเปลี่ยน" : "ชำระเฉพาะรายการที่เลือก สินค้าอื่นยังอยู่ในตะกร้า"}</p>
      </div>
      <p className="muted mb-4">กำลังซื้อ {lines.length} รายการ · {lines.reduce((n,item)=>n+item.quantity,0)} ชิ้น</p>
      <form noValidate onSubmit={submit} className="checkout-grid">
        <div className="space-y-6">
          <section className="panel form-section">
            <h2>
              <span className="step-number">1</span> ข้อมูลผู้รับ
            </h2>
            <div className="form-grid">{fields.slice(0, 2).map(field)}</div>
          </section>
          <section className="panel form-section">
            <h2>
              <span className="step-number">2</span> ที่อยู่จัดส่ง
            </h2>
            <div className="form-grid">{fields.slice(2).map(field)}</div>
          </section>
          <section className="panel form-section">
            <h2>
              <span className="step-number">3</span> วิธีชำระเงิน (จำลอง)
            </h2>
            <fieldset
              aria-describedby={
                errors.payment_method ? "payment-error" : undefined
              }
            >
              <legend className="sr-only">เลือกวิธีชำระเงิน</legend>
              {(
                [
                  "QR Payment",
                  "Credit/Debit Card",
                  "Cash on Delivery",
                ] as payment_method[]
              ).map((method) => (
                <label className="payment-option" key={method}>
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={form.payment_method === method}
                    onChange={() => set_form({ ...form, payment_method: method })}
                  />
                  <span>{{ "QR Payment": "สแกน QR", "Credit/Debit Card": "บัตรเครดิต / เดบิต", "Cash on Delivery": "เก็บเงินปลายทาง" }[method]}</span>
                  <small>จำลอง</small>
                </label>
              ))}
            </fieldset>
            {errors.payment_method && (
              <small id="payment-error" className="field-error">
                {errors.payment_method}
              </small>
            )}
          </section>
        </div>
        <OrderSummary
          subtotal={subtotal}
          discount={
            form.coupon_code.trim().toUpperCase() === "STUDENT10" &&
            subtotal >= 500
              ? Math.min(Math.round(subtotal * 10) / 100, 200)
              : 0
          }
        >
          <label className="field">
            รหัสส่วนลด (ไม่บังคับ)
            <input
              aria-label="รหัสส่วนลด (ไม่บังคับ)"
              value={form.coupon_code}
              onChange={(e) => set_form({ ...form, coupon_code: e.target.value })}
            />
            <small>
              ใช้ STUDENT10 ลด 10% สูงสุด 200 บาท เมื่อซื้อสินค้าครบ 500 บาท
            </small>
          </label>
          <div className="checkout-items">
            {lines.map((i) => (
              <div key={i.variant_id}>
                <div className="row between gap-4">
                  <span>
                    {i.product.name} × {i.quantity}
                  </span>
                  <b>{money(i.variant.price * i.quantity)}</b>
                </div>
                <small>
                  {i.variant.variant_name} · {money(i.variant.price)} / ชิ้น
                </small>
              </div>
            ))}
          </div>
          {errors.submit && (
            <p role="alert" className="field-error mb-4">
              {errors.submit}
            </p>
          )}
          <button disabled={busy} className="button w-full" type="submit">
            {busy ? "กำลังบันทึกคำสั่งซื้อ…" : "ยืนยันคำสั่งซื้อทดลอง"}
            {!busy && <ArrowRight size={16} />}
          </button>
        </OrderSummary>
      </form>
    </div>
  );
}
