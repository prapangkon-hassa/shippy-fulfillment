import { transaction } from "../lib/transaction.js";
import { fail, id, text, number } from "../lib/validation.js";
type input = Record<string, any>;
// Local classroom customer, not a production login.
const customer_id = "1";
export async function checkout(body: input) {
  const name = text(body.full_name, "shipping name", 150),
    phone = text(body.phone, "phone", 20),
    address = text(body.address_line, "shipping address", 500);
  const method = text(body.payment_method, "payment method", 30),
    coupon = text(body.coupon_code ?? "", "coupon", 30, true);
  if (
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > 100
  )
    fail("Invalid cart");
  const items = body.items.map((i: input) => {
    const quantity = number(i.quantity, "quantity", 10000);
    if (!Number.isInteger(quantity) || quantity < 1) fail("Invalid quantity");
    return { variant_id: id(i.variant_id), quantity };
  });
  return transaction(async (c) => {
    const r = await c.query(
      "CALL sp_checkout_order($1,$2::jsonb,$3,$4,$5,$6,$7,NULL)",
      [customer_id, JSON.stringify(items), name, phone, address, method, coupon],
    );
    return { order_id: r.rows[0].p_order_id };
  });
}
