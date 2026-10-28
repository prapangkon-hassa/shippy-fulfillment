import { transaction } from "../lib/transaction.js";
import { text } from "../lib/validation.js";
// Existing local classroom customer identity. Never accept a client-selected customer ID.
const customer_id = "1";
export async function cancel_order(order_id: string, reason: unknown) {
  const cancel_reason = text(reason, "เหตุผลการยกเลิก", 500);
  return transaction(async (client) => {
    await client.query("CALL sp_cancel_order($1,$2,$3)", [order_id, customer_id, cancel_reason]);
  });
}
