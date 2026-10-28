// รูปแบบข้อมูลที่สอดคล้องกับตาราง reviews
export interface review {
  review_id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
}
