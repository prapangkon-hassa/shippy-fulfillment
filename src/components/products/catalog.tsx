"use client";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { useStore } from "@/context/store-provider";
import {
  Armchair,
  ArrowRight,
  Grid2X2,
  Headphones,
  PackageCheck,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { SiteLink as Link } from "@/components/layout/site-link";
import { useState } from "react";
import { ProductGrid } from "./product-grid";

export default function Catalog() {
  const { data, ready } = useStore();
  const { categories, merchants } = data;
  const [search, set_search] = useState("");
  const [category, set_category] = useState("all");
  const [merchant, set_merchant] = useState("all");
  const [sort, set_sort] = useState("featured");
  const [limit, set_limit] = useState(24);
  const products = data.products
    .filter(
      (p) =>
        p.active &&
        (category === "all" || p.category_id === category) &&
        (merchant === "all" || p.merchant_id === merchant) &&
        (p.name + " " + p.description)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const price = (id: string) =>
        Math.min(
          ...data.variants
            .filter((v) => v.product_id === id)
            .map((v) => v.price),
        );
      return sort === "low"
        ? price(a.product_id) - price(b.product_id)
        : sort === "high"
          ? price(b.product_id) - price(a.product_id)
          : 0;
    });
  const icons = [Grid2X2, Headphones, ShoppingBag, Shirt, Armchair];
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">เลือกซื้อสินค้าได้ใน 3 ขั้นตอน</span>
          <h1>
            เลือกของที่ใช่
            <br />
            <span>สั่งซื้อได้ง่าย ๆ</span>
          </h1>
          <p>
            เลือกสินค้าและตัวเลือกที่ต้องการ ใส่ตะกร้า
            <br className="desktop-break" /> แล้วกรอกที่อยู่เพื่อยืนยันคำสั่งซื้อ
          </p>
          <Link className="button" href="#catalog">
            เริ่มเลือกสินค้า <ArrowRight size={16} />
          </Link>
          <span className="hero-note">ใช้งานด้วยบัญชีทดลองได้ทันที ไม่ต้องสมัครสมาชิก</span>
        </div>
        <div className="hero-art">
          <div className="hero-market-card">
            <span className="hero-shopping-icon">
              <ShoppingBag size={32} aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">เลือกซื้อจากหลายร้านในที่เดียว</span>
              <h2>ค้นหา เลือกซื้อ และติดตามพัสดุ</h2>
            </div>
            <div className="hero-market-stats">
              <div>
                <strong>{ready ? merchants.length : "—"}</strong>
                <span>ร้านค้า</span>
              </div>
              <div>
                <strong>{ready ? categories.length : "—"}</strong>
                <span>หมวดหมู่</span>
              </div>
            </div>
            <Link href="/orders" className="hero-tracking-link">
              <PackageCheck size={21} /> ติดตามคำสั่งซื้อ{" "}
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-delivery-card">
            <Truck size={26} aria-hidden="true" />
            <div>
              <b>ส่งฟรีเมื่อซื้อครบ</b>
              <span>3,000 บาทขึ้นไป</span>
            </div>
          </div>
        </div>
      </section>
      <section className="benefits" aria-label="Shopping benefits">
        <div>
          <Truck />
          <span>
            <b>1. เลือกสินค้า</b>
            <small>เลือกแบบและจำนวน แล้วเพิ่มลงตะกร้า</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <b>2. ยืนยันคำสั่งซื้อ</b>
            <small>กรอกที่อยู่และเลือกวิธีชำระเงินจำลอง</small>
          </span>
        </div>
        <div>
          <PackageCheck />
          <span>
            <b>3. ติดตามการจัดส่ง</b>
            <small>ดูสถานะได้ที่ “คำสั่งซื้อของฉัน”</small>
          </span>
        </div>
      </section>
      <section id="catalog" className="catalog section">
        <div className="row between wrap section-heading">
          <div>
            <span className="eyebrow">ค้นหาหรือเลือกหมวดหมู่ด้านล่าง</span>
            <h2>
              สินค้าทั้งหมด<span className="heading-dot">.</span>
            </h2>
          </div>
          <p className="muted">กดดูรายละเอียดเพื่อเลือกแบบและจำนวน</p>
        </div>
        <div className="category-tabs" aria-label="product categories">
          {[
            { category_id: "all", category_name: "ทุกหมวดหมู่" },
            ...categories,
          ].map((c, i) => {
            const Icon = icons[i % icons.length];
            return (
              <button
                key={c.category_id}
                className={category === c.category_id ? "selected" : ""}
                aria-pressed={category === c.category_id}
                onClick={() => set_category(c.category_id)}
              >
                <Icon size={17} />
                {c.category_name}
              </button>
            );
          })}
        </div>
        <div className="filter-bar">
          <label className="search-input">
            <Search size={18} />
            <input
              id="product-search"
              value={search}
              onChange={(e) => set_search(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า เช่น เสื้อ กระเป๋า หนังสือ"
              aria-label="ค้นหาสินค้า"
            />
          </label>
          <label className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              value={merchant}
              onChange={(e) => set_merchant(e.target.value)}
              aria-label="เลือกร้านค้า"
            >
              <option value="all">ทุกร้านค้า</option>
              {merchants.map((m) => (
                <option key={m.merchant_id} value={m.merchant_id}>
                  {m.merchant_name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>เรียง:</span>
            <select
              value={sort}
              onChange={(e) => set_sort(e.target.value)}
              aria-label="เรียงลำดับสินค้า"
            >
              <option value="featured">แนะนำ</option>
              <option value="low">ราคา: น้อยไปมาก</option>
              <option value="high">ราคา: มากไปน้อย</option>
            </select>
          </label>
        </div>
        <div className="results-row">
          <span>
            แสดง <b>{Math.min(limit, products.length)}</b> จากทั้งหมด{" "}
            {products.length} รายการ
          </span>
          {(search || category !== "all" || merchant !== "all") && <button className="text-link" onClick={() => { set_search(""); set_category("all"); set_merchant("all"); set_limit(24); }}>ล้างตัวกรอง</button>}
        </div>
        {!ready ? (
          <LoadingSkeleton />
        ) : products.length ? (
          <>
            <ProductGrid products={products.slice(0, limit)} />
            {products.length > limit && (
              <button
                className="button secondary mt-6"
                onClick={() => set_limit(limit + 24)}
              >
                ดูสินค้าเพิ่มเติม
              </button>
            )}
          </>
        ) : (
          <EmptyState
            title="ไม่พบสินค้าที่ตรงกับการค้นหา"
            description="ลองเปลี่ยนคำค้น หรือกดล้างตัวกรองเพื่อดูสินค้าทั้งหมด"
          >
            <button
              className="button secondary"
              onClick={() => {
                set_search("");
                set_category("all");
                set_merchant("all");
              }}
            >
              ล้างตัวกรอง
            </button>
          </EmptyState>
        )}
      </section>
      <section className="merchant-callout">
        <div>
          <span className="eyebrow">สำหรับผู้ขาย</span>
          <h2>จัดการสินค้าและการจัดส่งของร้าน</h2>
          <p>เลือกจาก {merchants.length} ร้านทดลอง เพื่อเพิ่มสินค้า อัปเดตการจัดส่ง หรือดูรายงานยอดขาย</p>
        </div>
        <Link href="/merchant/products" className="button secondary">
          เข้าสู่ส่วนผู้ขาย <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
