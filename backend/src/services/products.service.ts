import { get_pool } from "../lib/db.js";
import { inventory_query } from "../queries/products.query.js";
import type { PoolClient } from "pg";
export async function get_inventory(product_id?: string, client?: PoolClient) {
  const { rows } = await (client ?? get_pool()).query(inventory_query, [
    product_id ?? null,
  ]);
  const products = new Map();
  const variants = [];
  for (const row of rows) {
    const {
      variant_id,
      variant_name,
      sku,
      price,
      stock_quantity,
      variant_status,
      ...product
    } = row;
    products.set(product.product_id, product);
    if (variant_id)
      variants.push({
        variant_id,
        product_id: product.product_id,
        variant_name,
        sku,
        price: Number(price),
        stock_quantity,
        status: variant_status,
      });
  }
  return { products: [...products.values()], variants };
}
