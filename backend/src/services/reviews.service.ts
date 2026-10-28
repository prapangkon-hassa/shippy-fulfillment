import { transaction } from "../lib/transaction.js";
import { fail, id, text, number } from "../lib/validation.js";
type input = Record<string, any>;
// Local classroom customer, not a production login.
const customer_id = "1";
export async function save_review(body: input, rid?: string) {
  const pid = id(body.product_id),
    rating = number(body.rating, "rating", 5),
    comment = text(body.comment ?? "", "review", 1000, true);
  if (!Number.isInteger(rating) || rating < 1) fail("Rating must be 1 to 5");
  return transaction(async (c) => {
    const eligible = await c.query(
      `SELECT 1 FROM orders o JOIN order_items i USING(order_id) JOIN product_variants v USING(variant_id)
   WHERE o.customer_id=$1 AND v.product_id=$2 AND o.order_status='completed' LIMIT 1`,
      [customer_id, pid],
    );
    if (!eligible.rowCount)
      fail("Complete a purchase before reviewing this product", 409);
    const result = rid
      ? await c.query(
          "UPDATE reviews SET rating=$3,review_text=$4 WHERE review_id=$1 AND customer_id=$2 AND product_id=$5 RETURNING review_id",
          [rid, customer_id, rating, comment, pid],
        )
      : await c.query(
          "INSERT INTO reviews(customer_id,product_id,rating,review_text) VALUES($1,$2,$3,$4) RETURNING review_id",
          [customer_id, pid, rating, comment],
        );
    if (!result.rowCount) fail("review not found", 404);
    return { review_id: result.rows[0].review_id };
  });
}
export async function delete_review(rid: string) {
  return transaction(async (c) => {
    const r = await c.query(
      "DELETE FROM reviews WHERE review_id=$1 AND customer_id=$2 RETURNING review_id",
      [rid, customer_id],
    );
    if (!r.rowCount) fail("review not found", 404);
  });
}
