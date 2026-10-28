// รูปแบบข้อมูลที่สอดคล้องกับตาราง products และ product_variants
export interface product {
  product_id: string;
  merchant_id: string;
  category_id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface product_variant {
  variant_id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  original_stock_quantity?: number;
  status: "active" | "inactive";
}

export interface product_input extends Omit<product, "product_id"> {
  variants: product_variant[];
}
