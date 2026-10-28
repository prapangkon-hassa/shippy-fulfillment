"use client";
import { MetricCard } from "@/components/merchant/metric-card";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/display";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { useStore } from "@/context/store-provider";
import { money } from "@/lib/utils";
import { get_product_inventory } from "@/services/products.service";
import { product } from "@/types";
import {
  Archive,
  Eye,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductForm } from "./product-form";
export default function MerchantProducts() {
  const { data, ready, delete_product } = useStore();
  const { categories, merchants } = data;
  const [merchant, set_merchant] = useState("all");
  const [search, set_search] = useState("");
  const [editing, set_editing] = useState<product | null | undefined>(undefined);
  const [deleting, set_deleting] = useState<product | null>(null);
  const [view, set_view] = useState<product | null>(null);
  const all = data.products.filter((p) => merchant === "all" || p.merchant_id === merchant);
  const products = all.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const variants = data.variants.filter((v) =>
    all.some((p) => p.product_id === v.product_id),
  );
  return (
    <div className="section merchant-section">
      <div className="page-heading row between wrap">
        <div>
          <span className="eyebrow">สำหรับผู้ขาย</span>
          <h1>
            จัดการสินค้า<span className="heading-dot">.</span>
          </h1>
          <p>จัดการสินค้า ตัวเลือกสินค้า และจำนวนคงเหลือ</p>
        </div>
        <button className="button" onClick={() => set_editing(null)}>
          <Plus size={17} /> เพิ่มสินค้า
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-7">
        <MetricCard
          label="สินค้าทั้งหมด"
          value={String(all.length)}
          detail="จำนวนสินค้าในร้าน"
          icon={<Package size={19} />}
        />
        <MetricCard
          label="สินค้าที่เปิดขาย"
          value={String(all.filter((p) => p.active).length)}
          detail="สินค้าที่แสดงบนหน้าร้าน"
          icon={<Layers size={19} />}
        />
        <MetricCard
          label="สินค้าคงเหลือ"
          value={
            ready
              ? String(variants.reduce((n, v) => n + v.stock_quantity, 0))
              : "—"
          }
          detail="รวมทุกตัวเลือกสินค้า"
          icon={<Archive size={19} />}
        />
      </div>
      <div className="filter-bar">
        <label className="search-input">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => set_search(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า…"
            aria-label="ค้นหาสินค้าในร้าน"
          />
        </label>
        <label className="filter-select">
          ร้านค้า
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
      </div>
      {!ready ? (
        <LoadingSkeleton />
      ) : !products.length ? (
        <EmptyState
          title="ไม่พบสินค้า"
          description="ลองเปลี่ยนคำค้น เลือกร้านค้าอื่น หรือเพิ่มสินค้าใหม่"
        />
      ) : (
        <div className="table-wrap panel">
          <table>
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>ร้านค้า</th>
                <th>หมวดหมู่</th>
                <th>ตัวเลือก</th>
                <th>ช่วงราคา</th>
                <th>คงเหลือ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const {
                  variants: vs,
                  total_stock,
                  in_stock,
                } = get_product_inventory(data, p.product_id);
                return (
                  <tr key={p.product_id}>
                    <td>
                      <div className="table-product">
                        <b>{p.name}</b>
                      </div>
                    </td>
                    <td>{merchants.find((m) => m.merchant_id === p.merchant_id)?.merchant_name}</td>
                    <td>
                      {
                        categories.find((c) => c.category_id === p.category_id)
                          ?.category_name
                      }
                    </td>
                    <td>{vs.length} แบบ</td>
                    <td className="whitespace-nowrap">
                      {money(Math.min(...vs.map((v) => v.price)))} –{" "}
                      {money(Math.max(...vs.map((v) => v.price)))}
                    </td>
                    <td>
                      {total_stock}
                      <small
                        className={
                          "stock block " + (!in_stock ? "unavailable" : "")
                        }
                      >
                        {in_stock ? "พร้อมขาย" : "สินค้าหมด"}
                      </small>
                    </td>
                    <td>
                      <StatusBadge status={p.active ? "Active" : "Inactive"} />
                    </td>
                    <td>
                      <div className="row gap-1">
                        <button
                          className="icon-button"
                          aria-label={"ดูสินค้า " + p.name}
                          onClick={() => set_view(p)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={"แก้ไขสินค้า " + p.name}
                          onClick={() => set_editing(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={"ลบสินค้า " + p.name}
                          onClick={() => set_deleting(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted text-xs mt-4">
        ส่วนจัดการร้านค้าทดลอง · เลือกร้านค้าเพื่อดูและจัดการสินค้า
      </p>
      {editing !== undefined && (
        <ProductForm
          product={editing ?? undefined}
          merchant_id={merchant === "all" ? "" : merchant}
          on_close={() => set_editing(undefined)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDialog
          title="ลบสินค้านี้หรือไม่?"
          description={
            "“" +
            deleting.name +
            "” ลบได้เฉพาะสินค้าที่ยังไม่มีประวัติสั่งซื้อ หากเคยขายแล้วให้เปลี่ยนเป็นปิดการขาย"
          }
          on_close={() => set_deleting(null)}
          on_confirm={async () => {
            await delete_product(deleting.product_id);
            set_deleting(null);
          }}
        />
      )}
      {view && (
        <Modal title={view.name} on_close={() => set_view(null)}>
          <p className="muted mb-5">{view.description}</p>
          <StatusBadge status={view.active ? "Active" : "Inactive"} />
          <div className="table-wrap mt-5">
            <table>
              <thead>
                <tr>
                  <th>ตัวเลือก</th>
                  <th>SKU</th>
                  <th>ราคา</th>
                  <th>คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {data.variants
                  .filter((v) => v.product_id === view.product_id)
                  .map((v) => (
                    <tr key={v.variant_id}>
                      <td>{v.variant_name}</td>
                      <td>{v.sku}</td>
                      <td>{money(v.price)}</td>
                      <td>{v.stock_quantity}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {view.active && (
            <Link className="button mt-5" href={"/products/" + view.product_id}>
              ดูสินค้าบนหน้าร้าน
            </Link>
          )}
        </Modal>
      )}
    </div>
  );
}
