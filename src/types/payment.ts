// รูปแบบข้อมูลที่สอดคล้องกับตาราง payments
export type payment_method =
  "QR Payment" | "Credit/Debit Card" | "Cash on Delivery";

export interface payment {
  payment_id: string;
  order_id: string;
  payment_method: payment_method;
  payment_status: "Pending" | "Paid" | "Refunded" | "Failed" | "Void";
  paid_at: string | null;
  amount: number;
  refunded_amount: number;
  refunded_at: string | null;
  voided_at: string | null;
  transaction_ref: string | null;
  created_at: string;
}
