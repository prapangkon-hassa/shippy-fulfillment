import type { store_data } from "@/types";
export const get_products = (data: store_data) => data.products;
export const get_product_by_id = (data: store_data, id: string) =>
  data.products.find((p) => p.product_id === id);
export function get_product_inventory(data: store_data, product_id: string) {
  const variants = data.variants.filter((v) => v.product_id === product_id);
  const sellable_stock = variants.filter((v) => v.status === "active").reduce((n, v) => n + v.stock_quantity, 0);
  return {
    low_stock: sellable_stock > 0 && sellable_stock <= 10,
    sellable_stock,
    variants,
    total_stock: variants.reduce((n, v) => n + v.stock_quantity, 0),
    in_stock: variants.some((v) => v.status === "active" && v.stock_quantity > 0),
  };
}
