// รูปแบบผลลัพธ์จาก API รายงาน ไม่ใช่ตารางใหม่
export interface merchant_report {
  total_sales: number;
  total_orders: number;
  shipping_fees: number;
  best_seller: string;
  categories: {
    category: string;
    orders: number;
    units: number;
    sales: number;
  }[];
  top_products: { product: string; quantity: number; revenue: number }[];
  merchants: {
    merchant: string;
    sales: number;
    orders: number;
    shipping: number;
  }[];
}
