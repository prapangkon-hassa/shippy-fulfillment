// รูปแบบข้อมูลที่สอดคล้องกับตาราง orders และ order_items
import type { address } from "./checkout";
import type { payment } from "./payment";
import type { shipment } from "./shipment";

export type order_status =
  | "Pending"
  | "Paid"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Completed"
  | "Cancelled";

export interface order {
  order_id: string;
  customer_id: string;
  order_date: string;
  status: order_status;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  stock_restored_units: number;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
}

export interface order_item {
  order_item_id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  restored_quantity: number;
  unit_price: number;
  subtotal: number;
  product_id: string;
  merchant_id: string;
  category_id: string;
}

export interface order_record extends order {
  items: order_item[];
  payment: payment;
  payments: payment[];
  shipments: shipment[];
  address: address;
}
