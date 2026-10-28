import { transaction } from "../lib/transaction.js";
import { get_inventory } from "./products.service.js";
const title = (value: string) => value[0].toUpperCase() + value.slice(1);
export async function get_store() {
  return transaction(async (client) => {
    const inventory = await get_inventory(undefined, client);
    const merchants = (
      await client.query(
        'SELECT merchant_id::text AS "merchant_id",merchant_name AS "merchant_name",email,phone,status FROM merchants ORDER BY merchant_id',
      )
    ).rows;
    const categories = (
      await client.query(
        'SELECT category_id::text AS "category_id",category_name AS "category_name",is_active AS "is_active" FROM categories ORDER BY category_id',
      )
    ).rows;
    const customers = (
      await client.query(
        'SELECT customer_id::text AS "customer_id",full_name AS "full_name",email,phone FROM customers ORDER BY customer_id',
      )
    ).rows;
    const reviews = (
      await client.query(
        'SELECT review_id::text AS "review_id",customer_id::text AS "customer_id",product_id::text AS "product_id",rating,coalesce(review_text,\'\') AS comment,created_at AS "created_at" FROM reviews',
      )
    ).rows;
    const raw_orders = (
      await client.query(
        "SELECT * FROM orders ORDER BY order_date DESC,order_id DESC",
      )
    ).rows;
    const items = (
      await client.query(`SELECT i.order_item_id::text AS "order_item_id",i.order_id::text AS "order_id",i.variant_id::text AS "variant_id",
   p.product_id::text AS "product_id",p.merchant_id::text AS "merchant_id",p.category_id::text AS "category_id",
   p.product_name AS "product_name",v.variant_name AS "variant_name",i.quantity,i.restored_quantity,i.unit_price AS "unit_price",i.quantity*i.unit_price AS subtotal
   FROM order_items i JOIN product_variants v USING(variant_id) JOIN products p USING(product_id)`)
    ).rows.map((i) => ({
      ...i,
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    }));
    const payments = (
      await client.query(
        "SELECT * FROM payments ORDER BY CASE payment_status WHEN 'paid' THEN 0 WHEN 'refunded' THEN 1 WHEN 'void' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END,payment_id DESC",
      )
    ).rows;
    const shipments = (
      await client.query("SELECT * FROM shipments ORDER BY shipment_id")
    ).rows;
    const orders = raw_orders.map((o) => {
      const oi = items.filter((i) => i.order_id === o.order_id);
      const ss = shipments
        .filter((s) => s.order_id === o.order_id)
        .map((s) => ({
          shipment_id: s.shipment_id,
          order_id: s.order_id,
          merchant_id: s.merchant_id,
          carrier: s.carrier ?? "",
          tracking_number: s.tracking_number ?? "",
          shipping_status: title(s.shipment_status),
          shipping_cost: Number(s.shipping_cost),
          cancelled_at: s.cancelled_at,
          shipped_at: s.shipped_at,
          delivered_at: s.delivered_at,
        }));
      const pp = payments
        .filter((p) => p.order_id === o.order_id)
        .map((p) => ({
          payment_id: p.payment_id,
          order_id: p.order_id,
          payment_method: p.payment_method,
          payment_status: title(p.payment_status),
          amount: Number(p.amount),
          refunded_amount: Number(p.refunded_amount),
          refunded_at: p.refunded_at,
          voided_at: p.voided_at,
          transaction_ref: p.transaction_ref,
          paid_at: p.paid_at,
          created_at: p.created_at,
        }));
      const subtotal = oi.reduce((n, i) => n + i.subtotal, 0),
        shipping_fee = ss.reduce((n, s) => n + s.shipping_cost, 0);
      return {
        order_id: o.order_id,
        customer_id: o.customer_id,
        order_date: o.order_date,
        status: title(o.order_status),
        cancelled_at: o.cancelled_at,
        cancelled_by: o.cancelled_by,
        cancel_reason: o.cancel_reason,
        stock_restored_units: o.stock_restored_units,
        discount_amount: Number(o.discount_amount),
        subtotal,
        shipping_fee,
        total_amount: subtotal + shipping_fee - Number(o.discount_amount),
        items: oi,
        shipments: ss,
        payment: pp[0],
        payments: pp,
        address: {
          full_name: o.shipping_name,
          phone: o.shipping_phone,
          address_line: o.shipping_address,
        },
      };
    });
    const report = (
      await client.query(
        "SELECT * FROM vw_merchant_sales_summary ORDER BY merchant_id,category_id",
      )
    ).rows;
    return {
      ...inventory,
      merchants,
      categories,
      customers,
      reviews,
      orders,
      report,
      current_customer_id: "1",
    };
  }, true);
}
