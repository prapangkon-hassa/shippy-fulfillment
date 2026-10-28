import { transaction } from "../lib/transaction.js";
import { fail, id, text, number } from "../lib/validation.js";
type input = Record<string, any>;
export async function save_product(body: input, product_id?: string) {
  const name = text(body.name, "product name", 150),
    description = text(body.description ?? "", "description", 10000, true);
  const merchant = id(body.merchant_id),
    category = id(body.category_id);
  if (
    typeof body.active !== "boolean" ||
    !Array.isArray(body.variants) ||
    body.variants.length < 1 ||
    body.variants.length > 100
  )
    fail("Invalid product variants");
  const variants = body.variants.map((v: input) => {
    const price = number(v.price, "price", 9999999999.99),
      stock = number(v.stock_quantity, "stock", 2147483647);
    if (
      !Number.isInteger(stock) ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.0001
    )
      fail("Use whole stock and at most 2 price decimals");
    if (!["active", "inactive"].includes(v.status))
      fail("Invalid variant status");
    const original_stock = v.variant_id
      ? number(v.original_stock_quantity, "original stock", 2147483647)
      : null;
    return {
      variant_id: v.variant_id ? id(v.variant_id) : null,
      name: text(v.variant_name, "variant name", 100),
      sku: text(v.sku, "SKU", 60),
      price,
      stock,
      status: v.status,
      original_stock,
    };
  });
  return transaction(async (c) => {
    let pid = product_id;
    if (pid) {
      const existing = await c.query(
        "SELECT * FROM products WHERE product_id=$1 FOR UPDATE",
        [pid],
      );
      if (!existing.rowCount) fail("product not found", 404);
      if (
        existing.rows[0].merchant_id !== merchant ||
        String(existing.rows[0].category_id) !== category
      ) {
        const used = await c.query(
          "SELECT 1 FROM order_items i JOIN product_variants v USING(variant_id) WHERE v.product_id=$1 LIMIT 1",
          [pid],
        );
        if (used.rowCount)
          fail(
            "A sold product cannot change merchant/category. Create a new product instead.",
            409,
          );
      }
      await c.query(
        "UPDATE products SET product_name=$2,description=$3,merchant_id=$4,category_id=$5,status=$6 WHERE product_id=$1",
        [
          pid,
          name,
          description,
          merchant,
          category,
          body.active ? "active" : "inactive",
        ],
      );
    } else {
      pid = (
        await c.query(
          "INSERT INTO products(product_name,description,merchant_id,category_id,status) VALUES($1,$2,$3,$4,$5) RETURNING product_id",
          [
            name,
            description,
            merchant,
            category,
            body.active ? "active" : "inactive",
          ],
        )
      ).rows[0].product_id;
    }
    await c.query(
      "SELECT variant_id FROM product_variants WHERE product_id=$1 ORDER BY variant_id FOR UPDATE",
      [pid],
    );
    const kept: string[] = [];
    for (const v of variants) {
      if (v.variant_id) {
        const changed = await c.query(
          "UPDATE product_variants SET variant_name=$3,sku=$4,price=$5,stock_quantity=$6,status=$7 WHERE variant_id=$1 AND product_id=$2 AND stock_quantity=$8 RETURNING variant_id",
          [
            v.variant_id,
            pid,
            v.name,
            v.sku,
            v.price,
            v.stock,
            v.status,
            v.original_stock,
          ],
        );
        if (!changed.rowCount)
          fail(
            "Stock changed while editing. Close and reopen this form before saving.",
            409,
          );
        kept.push(v.variant_id);
      } else {
        kept.push(
          (
            await c.query(
              "INSERT INTO product_variants(product_id,variant_name,sku,price,stock_quantity,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING variant_id",
              [pid, v.name, v.sku, v.price, v.stock, v.status],
            )
          ).rows[0].variant_id,
        );
      }
    }
    await c.query(
      "DELETE FROM product_variants WHERE product_id=$1 AND NOT (variant_id=ANY($2::bigint[]))",
      [pid, kept],
    );
    return { product_id: pid };
  });
}
export async function delete_product(pid: string) {
  return transaction(async (c) => {
    const r = await c.query(
      "DELETE FROM products WHERE product_id=$1 RETURNING product_id",
      [pid],
    );
    if (!r.rowCount) fail("product not found", 404);
  });
}
