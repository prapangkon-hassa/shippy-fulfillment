// ตะกร้าเป็นข้อมูลฝั่ง browser; ไม่ต้องสร้าง API หรือตาราง cart สำหรับโปรเจกต์นี้
import type { store_data } from "@/types/store";

export function add_cart_item(
  data: store_data,
  variant_id: string,
  quantity: number,
): store_data {
  const variant = data.variants.find((item) => item.variant_id === variant_id);
  const product = data.products.find(
    (item) => item.product_id === variant?.product_id,
  );
  const existing = data.cart.find((item) => item.variant_id === variant_id);
  if (
    !variant ||
    variant.status !== "active" ||
    !product?.active ||
    quantity < 1 ||
    (existing?.quantity ?? 0) + quantity > variant.stock_quantity
  ) {
    throw new Error("The requested quantity exceeds available stock.");
  }
  return {
    ...data,
    cart: existing
      ? data.cart.map((item) =>
          item.variant_id === variant_id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...data.cart, { variant_id, quantity }],
  };
}

export function set_cart_quantity(
  data: store_data,
  variant_id: string,
  quantity: number,
): store_data {
  const variant = data.variants.find((item) => item.variant_id === variant_id);
  if (!variant || variant.status !== "active" || variant.stock_quantity <= 0)
    return data;
  return {
    ...data,
    cart: data.cart.map((item) =>
      item.variant_id === variant_id
        ? {
            ...item,
            quantity: Math.max(
              1,
              Math.min(Math.floor(quantity) || 1, variant.stock_quantity),
            ),
          }
        : item,
    ),
  };
}

export function remove_cart_item(data: store_data, variant_id: string): store_data {
  return {
    ...data,
    cart: data.cart.filter((item) => item.variant_id !== variant_id),
  };
}

export function clean_cart(data: store_data) {
  return data.cart.flatMap((item) => {
    const v = data.variants.find((v) => v.variant_id === item.variant_id);
    const p = data.products.find((p) => p.product_id === v?.product_id);
    return v &&
      v.status === "active" &&
      p?.active &&
      v.stock_quantity > 0 &&
      Number.isFinite(item.quantity)
      ? [
          {
            ...item,
            quantity: Math.max(
              1,
              Math.min(Math.floor(item.quantity), v.stock_quantity),
            ),
          },
        ]
      : [];
  });
}
