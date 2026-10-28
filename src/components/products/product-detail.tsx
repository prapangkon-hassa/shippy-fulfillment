"use client";
import { RatingStars } from "@/components/ui/display";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useStore } from "@/context/store-provider";
import { date, money } from "@/lib/utils";
import { get_product_inventory } from "@/services/products.service";
import { ArrowLeft, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function ProductDetail({ id }: { id: string }) {
  const { data, ready, add_to_cart, begin_checkout } = useStore();
  const { categories, customers, merchants } = data;
  const router = useRouter();
  const [selected, set_selected] = useState("");
  const [quantity, set_quantity] = useState(1);
  const [added, set_added] = useState(false);
  const p = data.products.find((p) => p.product_id === id && p.active);
  const inventory = get_product_inventory(data, id);
  const variants = inventory.variants;
  const in_stock = inventory.in_stock;
  const v =
    variants.find((v) => v.variant_id === selected) ??
    variants.find((v) => v.status === "active" && v.stock_quantity > 0) ??
    variants[0];
  const reviews = data.reviews.filter((r) => r.product_id === id);
  const rating = reviews.length
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
    : 0;
  if (!ready) return <LoadingSkeleton />;
  if (!p || !v)
    return (
      <EmptyState
        title="ไม่พบสินค้า"
        description="สินค้านี้อาจถูกปิดการขายแล้ว กรุณาเลือกสินค้าอื่น"
      >
        <Link href="/" className="button">
          เลือกซื้อสินค้า
        </Link>
      </EmptyState>
    );
  const in_cart =
    data.cart.find((c) => c.variant_id === v.variant_id)?.quantity ?? 0;
  const variant_available = v.status === "active" && v.stock_quantity > 0;
  const available = variant_available
    ? Math.max(0, v.stock_quantity - in_cart)
    : 0;
  const purchase_quantity = Math.min(quantity, Math.max(1, v.stock_quantity));
  function add(buy = false) {
    if (buy) {
      if (!variant_available || purchase_quantity > v.stock_quantity) return;
      begin_checkout({ mode: "buy_now", items: [{ variant_id: v.variant_id, quantity: purchase_quantity }] });
      router.push("/checkout");
      return;
    }
    if (add_to_cart(v.variant_id, purchase_quantity)) {
      set_added(true);

    }
  }
  return (
    <div className="container section">
      <Link href="/#catalog" className="back-link">
        <ArrowLeft size={15} /> กลับไปเลือกสินค้า
      </Link>
      <div className="panel form-section">
        <div className="detail-copy">
          <span className="eyebrow">
            {
              categories.find((c) => c.category_id === p.category_id)
                ?.category_name
            }
          </span>
          <h1>{p.name}</h1>
          <p className="muted">
            ร้านค้า: {" "}
            {merchants.find((m) => m.merchant_id === p.merchant_id)?.merchant_name}
          </p>
          <div className="my-4">
            <RatingStars rating={rating} count={reviews.length} />
            <span className="muted text-sm ml-2">รีวิวจากผู้ซื้อ</span>
          </div>
          <div className="detail-price">{money(v.price)}</div>
          <p className="description">{p.description}</p>
          <p
            className={"stock my-4 " + (!in_stock ? "unavailable" : inventory.low_stock ? "low-stock" : "")}
            aria-label="product availability"
          >
            {!in_stock ? "สินค้าหมด" : inventory.low_stock ? `สินค้าใกล้หมด · เหลือรวม ${inventory.sellable_stock} ชิ้น` : "พร้อมขาย"}
          </p>
          <label className="field">
            เลือกแบบสินค้า
            <select
              value={v.variant_id}
              onChange={(e) => {
                set_selected(e.target.value);
                set_quantity(1);
              }}
            >
              {variants.map((v) => (
                <option key={v.variant_id} value={v.variant_id}>
                  {v.variant_name} —{" "}
                  {v.status === "active" && v.stock_quantity > 0
                    ? `${v.stock_quantity} ชิ้น${v.stock_quantity <= 10 ? " · ใกล้หมด" : "พร้อมขาย"}`
                    : "สินค้าหมด"}
                </option>
              ))}
            </select>
          </label>
          <div className="variant-meta">
            <span>SKU: {v.sku}</span>
          </div>
          <p
            aria-label="Variant availability"
            className={"stock my-4 " + (!variant_available ? "unavailable" : v.stock_quantity <= 10 ? "low-stock" : "")}
          >
            {!variant_available ? "สินค้าหมด" : v.stock_quantity <= 10 ? `แบบนี้ใกล้หมด · เหลือ ${v.stock_quantity} ชิ้น` : v.stock_quantity + " ชิ้นพร้อมขาย"}
            {in_cart > 0 ? " · " + in_cart + " ชิ้นในตะกร้า" : ""}
          </p>
          <div className="row gap-4 mb-5">
            <span className="text-sm">เลือกจำนวน</span>
            <QuantitySelector
              value={purchase_quantity}
              max={variant_available ? v.stock_quantity : 0}
              on_change={set_quantity}
            />
          </div>
          <div className="actions">
            <button
              className="button grow"
              disabled={available < purchase_quantity}
              onClick={() => add()}
            >
              <ShoppingBag size={17} /> เพิ่มลงตะกร้า
            </button>
            <button
              className="button secondary grow"
              disabled={!variant_available}
              onClick={() => add(true)}
            >
              ซื้อเลย
            </button>
          </div>
          {added && <p role="status" className="ux-notice">เพิ่มสินค้าลงตะกร้าแล้ว · <Link href="/cart" className="text-link">ดูตะกร้าและตรวจยอดรวม →</Link></p>}
          <div className="detail-promises">
            <span>
              <Truck size={17} /> ค่าส่ง 60 บาท / ส่งฟรีเมื่อครบ 3,000 บาท
            </span>
            <span>
              <ShieldCheck size={17} /> ซื้อจากหลายร้านจะแยกพัสดุจัดส่ง
            </span>
          </div>
        </div>
      </div>
      <section className="reviews-section">
        <div className="row between">
          <h2>
            รีวิวจากผู้ซื้อ{" "}
            <span className="muted text-lg">({reviews.length})</span>
          </h2>
          <RatingStars rating={rating} />
        </div>
        {reviews.length ? (
          reviews.map((r) => (
            <article className="review" key={r.review_id}>
              <div className="row between">
                <b>
                  {customers.find((c) => c.customer_id === r.customer_id)
                    ?.full_name ?? "customer"}
                </b>
                <span className="muted text-sm">{date(r.created_at)}</span>
              </div>
              <RatingStars rating={r.rating} />
              <p>{r.comment}</p>
            </article>
          ))
        ) : (
          <EmptyState
            title="ยังไม่มีรีวิว"
            description="รีวิวสินค้าได้จากหน้าคำสั่งซื้อ เมื่อได้รับสินค้าครบแล้ว"
          />
        )}
      </section>
    </div>
  );
}

