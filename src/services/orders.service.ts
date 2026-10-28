import type { store_data } from "@/types";
export const get_orders = (data: store_data) =>
  data.orders.filter((o) => o.customer_id === data.current_customer_id);
export const get_order_by_id = (data: store_data, id: string) =>
  data.orders.find((o) => o.order_id === id);
export const get_merchant_orders = (data: store_data, id: string) =>
  data.orders.filter((o) => o.items.some((i) => i.merchant_id === id));
