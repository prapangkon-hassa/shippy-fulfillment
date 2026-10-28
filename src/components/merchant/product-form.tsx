"use client";
import { Modal } from "@/components/ui/dialog";
import { useStore } from "@/context/store-provider";
import { product, product_input } from "@/types";
import { useState } from "react";
import { blank_variant, VariantEditor } from "./variant-editor";

export function ProductForm({
  product,
  merchant_id,
  on_close,
}: {
  product?: product;
  merchant_id: string;
  on_close: () => void;
}) {
  const { data, save_product } = useStore();
  const { categories, merchants } = data;
  const [form, set_form] = useState<product_input>({
    merchant_id: product?.merchant_id ?? merchant_id,
    name: product?.name ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    active: product?.active ?? true,
    variants: product
      ? data.variants
          .filter((v) => v.product_id === product.product_id)
          .map((v) => ({ ...v, original_stock_quantity: v.stock_quantity }))
      : [blank_variant()],
  });
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [busy, set_busy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    if (!form.merchant_id) next.merchant_id = "กรุณาเลือกร้านค้า";
    if (!form.name.trim()) next.name = "กรุณากรอกชื่อสินค้า";
    if (!form.category_id) next.category_id = "กรุณาเลือกหมวดหมู่";
    if (!form.variants.length) next.variants = "กรุณาเพิ่มตัวเลือกสินค้าอย่างน้อย 1 แบบ";
    form.variants.forEach((v, i) => {
      if (!v.variant_name.trim())
        next[i + "-variant_name"] = "กรุณากรอกชื่อตัวเลือกสินค้า";
      if (!v.sku.trim()) next[i + "-sku"] = "กรุณากรอกรหัสสินค้า (SKU)";
      else if (
        data.variants.some(
          (other) =>
            other.product_id !== product?.product_id &&
            other.sku.toLowerCase() === v.sku.trim().toLowerCase(),
        ) ||
        form.variants.some(
          (other, j) =>
            j !== i &&
            other.sku.trim().toLowerCase() === v.sku.trim().toLowerCase(),
        )
      )
        next[i + "-sku"] = "รหัสสินค้า (SKU) ต้องไม่ซ้ำ";
      if (!Number.isFinite(v.price) || v.price < 0)
        next[i + "-price"] = "กรุณากรอกราคาตั้งแต่ 0 บาทขึ้นไป";
      if (!Number.isInteger(v.stock_quantity) || v.stock_quantity < 0)
        next[i + "-stock_quantity"] = "กรุณากรอกจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
    });
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
      await save_product(
        {
          ...form,
          name: form.name.trim(),
        },
        product?.product_id,
      );
      on_close();
    } catch (error) {
      set_errors({
        submit:
          error instanceof Error
            ? error.message
            : "บันทึกสินค้าไม่สำเร็จ",
      });
    } finally {
      set_busy(false);
    }
  }
  return (
    <Modal title={product ? "แก้ไขสินค้า" : "เพิ่มสินค้า"} on_close={on_close}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field col-span-full">
            ร้านค้า
            <select
              aria-label="ร้านเจ้าของสินค้า"
              value={form.merchant_id}
              disabled={!!product}
              onChange={(e) => set_form({ ...form, merchant_id: e.target.value })}
              aria-invalid={!!errors.merchant_id}
            >
              <option value="">เลือกร้านค้า</option>
              {merchants.map((m) => <option key={m.merchant_id} value={m.merchant_id}>{m.merchant_name}</option>)}
            </select>
            {errors.merchant_id && <small className="field-error">{errors.merchant_id}</small>}
          </label>
          <label className="field col-span-full">
            ชื่อสินค้า
            <input
              aria-label="ชื่อสินค้า"
              value={form.name}
              onChange={(e) => set_form({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <small className="field-error">{errors.name}</small>
            )}
          </label>
          <label className="field col-span-full">
            รายละเอียด
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                set_form({ ...form, description: e.target.value })
              }
            />
          </label>
          <label className="field">
            หมวดหมู่
            <select
              aria-label="หมวดหมู่"
              value={form.category_id}
              onChange={(e) => set_form({ ...form, category_id: e.target.value })}
              aria-invalid={!!errors.category_id}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <small className="field-error">{errors.category_id}</small>
            )}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set_form({ ...form, active: e.target.checked })}
            />{" "}
            เปิดขาย · แสดงสินค้าบนหน้าร้าน
          </label>
        </div>
        <VariantEditor
          variants={form.variants}
          on_change={(variants) => set_form({ ...form, variants })}
          errors={errors}
        />
        {errors.submit && (
          <p className="field-error" role="alert">
            {errors.submit}
          </p>
        )}
        <div className="actions mt-6">
          <button type="button" className="button secondary" onClick={on_close}>
            ยกเลิก
          </button>
          <button className="button" disabled={busy}>
            {product ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
