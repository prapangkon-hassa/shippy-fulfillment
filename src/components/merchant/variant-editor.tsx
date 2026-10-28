"use client";
import { product_variant } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export const blank_variant = (): product_variant => ({
  variant_id: "",
  product_id: "",
  variant_name: "",
  sku: "",
  status: "active",
  price: 0,
  stock_quantity: 0,
});

export function VariantEditor({
  variants,
  on_change,
  errors,
}: {
  variants: product_variant[];
  on_change: (variants: product_variant[]) => void;
  errors: Record<string, string>;
}) {
  function update(index: number, key: keyof product_variant, value: string) {
    on_change(
      variants.map((v, i) =>
        i === index
          ? {
              ...v,
              [key]:
                key === "price" || key === "stock_quantity"
                  ? value === ""
                    ? NaN
                    : Number(value)
                  : value,
            }
          : v,
      ),
    );
  }
  return (
    <section className="variant-editor">
      <div className="row between">
        <h3>ตัวเลือกสินค้า</h3>
        <button
          type="button"
          className="text-link"
          onClick={() => on_change([...variants, blank_variant()])}
        >
          <Plus size={15} /> เพิ่มตัวเลือก
        </button>
      </div>
      {errors.variants && (
        <small className="field-error">{errors.variants}</small>
      )}
      {variants.map((v, index) => (
        <div className="variant-row" key={index}>
          <div className="row between mb-3">
            <b className="text-sm">ตัวเลือกที่ {index + 1}</b>
            <button
              type="button"
              className="icon-button"
              aria-label={"ลบตัวเลือกที่ " + (index + 1)}
              onClick={() => on_change(variants.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <label className="field">
            สถานะ
            <select
              value={v.status}
              onChange={(e) => update(index, "status", e.target.value)}
            >
              <option value="active">เปิดขาย</option>
              <option value="inactive">ปิดการขาย</option>
            </select>
          </label>
          <div className="form-grid">
            {(
              [
                { key: "variant_name", label: "ชื่อตัวเลือก" },
                { key: "sku", label: "SKU" },
                { key: "price", label: "ราคา (บาท)" },
                { key: "stock_quantity", label: "จำนวนคงเหลือ" },
              ] as { key: keyof product_variant; label: string }[]
            ).map((f) => {
              const numeric = f.key === "price" || f.key === "stock_quantity";
              const error = errors[index + "-" + f.key];
              return (
                <label key={f.key} className="field">
                  {f.label}
                  <input
                    type={numeric ? "number" : "text"}
                    aria-label={f.label}
                    value={
                      typeof v[f.key] === "number" && !Number.isFinite(v[f.key])
                        ? ""
                        : v[f.key]
                    }
                    min={numeric ? 0 : undefined}
                    step={
                      f.key === "price" ? "0.01" : numeric ? "1" : undefined
                    }
                    onChange={(e) => update(index, f.key, e.target.value)}
                    aria-invalid={!!error}
                  />
                  {error && <small className="field-error">{error}</small>}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
