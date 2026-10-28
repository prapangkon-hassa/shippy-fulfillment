// ข้อมูลจากฟอร์ม checkout ที่จะส่งให้ API
import type { payment_method } from "./payment";

export interface address {
  full_name: string;
  phone: string;
  address_line: string;
}

export interface checkout_input extends address {
  payment_method: payment_method;
  coupon_code: string;
}

export interface checkout_draft {
  mode: "cart" | "buy_now";
  items: { variant_id: string; quantity: number }[];
}
