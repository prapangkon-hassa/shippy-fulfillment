// ข้อมูลรวมที่ React Context ใช้ใน demo ไม่ใช่ตารางฐานข้อมูล
import type { cart_item } from "./cart";
import type { order_record } from "./order";
import type { product, product_variant } from "./product";
import type { review } from "./review";

import type { merchant, category, customer } from "./index";
export interface sales_row {
  merchant_id: string;
  merchant_name: string;
  category_id: number;
  category_name: string;
  order_count: number;
  units_sold: string;
  gross_sales: string;
  shipping_fees: string;
  best_product_id: string;
  best_product_name: string;
  best_product_units: string;
}
export interface store_data {
  merchants: merchant[];
  categories: category[];
  customers: customer[];
  current_customer_id: string;
  report: sales_row[];
  products: product[];
  variants: product_variant[];
  orders: order_record[];
  reviews: review[];
  cart: cart_item[];
}
