// รูปแบบข้อมูลที่สอดคล้องกับตาราง merchants
export interface merchant {
  merchant_id: string;
  merchant_name: string;
  email: string;
  phone: string | null;
  status: string;
}
