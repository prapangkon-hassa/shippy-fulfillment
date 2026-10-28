# คู่มือฝึก SQL และ API จากระบบที่เชื่อมจริง

ไฟล์ใน database/ เป็นฉบับรันได้กับ PostgreSQL แล้ว อ่านคู่กับโค้ดและทดสอบในฐานฝึกแยก อย่าทดลองลบตารางในฐานที่ใช้สาธิต

## 1. เขียนที่ไหน

เขียน .sql ใน VS Code เพื่อเก็บโค้ดส่งงาน ใช้ pgAdmin เปิด Query Tool เพื่อรันไฟล์นั้นกับ PostgreSQL
ไฟล์กับฐานข้อมูลเป็นคนละส่วน: แก้ไฟล์อย่างเดียวฐานยังไม่เปลี่ยน; รันใน pgAdmin อย่างเดียวไฟล์ใน VS Code ไม่เปลี่ยน ต้องบันทึกคำสั่งที่ใช้กลับลงไฟล์ด้วย
วิธีเชื่อม pgAdmin และเปิดระบบดู README.md

## 2. อ่านตารางและ constraints

| คำสั่ง | ความหมาย | ตัวอย่างในโปรเจกต์ |
|---|---|---|
| CREATE TABLE | สร้างตาราง | merchants |
| GENERATED ALWAYS AS IDENTITY | PostgreSQL ออกเลข ID ให้ | product_id |
| PRIMARY KEY | ระบุแถวไม่ซ้ำและไม่เป็น NULL | order_id |
| REFERENCES / FOREIGN KEY | ค่าต้องอ้างแถวที่มีจริง | products.merchant_id |
| ON DELETE RESTRICT | ไม่ให้ลบเมื่อยังถูกอ้าง | variant ที่มี order_items |
| ON DELETE CASCADE | ลบแถวลูกตามแถวแม่ | variants ของสินค้าที่ยังไม่เคยขาย |
| NOT NULL | ต้องมีค่า | product_name |
| UNIQUE | ค่าไม่ซ้ำ | sku, email |
| UNIQUE(a,b) | คู่ค่าสองช่องไม่ซ้ำ | order_id + variant_id |
| CHECK | กำหนดเงื่อนไข | stock_quantity >= 0 |
| DEFAULT | ค่าเริ่มต้นเมื่อไม่ได้ส่ง | status='active' |
| CREATE INDEX | ช่วยค้นหา/เชื่อมตาราง ลดการอ่านบางกรณี | products.merchant_id |
| numeric(12,2) | เลขฐานสิบ 12 หลักรวมทศนิยม 2 หลัก | price |
| timestamptz | เวลาที่มีข้อมูลเขตเวลา | created_at |

ข้อควรจำ: FK ไม่สร้าง index ฝั่งลูกให้อัตโนมัติ แต่ PK/UNIQUE มี index รองรับอยู่แล้ว
category_id ใช้ integer; ID อื่น bigint; API ส่ง bigint เป็น string เพื่อไม่สูญเสียความแม่นยำใน JavaScript

ตาราง 10 ตาราง: merchants, categories, customers, products, product_variants, orders, order_items, payments, shipments, reviews
payments ไม่ UNIQUE(order_id) เพราะหนึ่ง order มีหลายความพยายามชำระเงิน
reviews เชื่อม product_id และ customer_id; ไม่เพิ่ม order_id นอกโครง

## 3. ใส่และอ่านข้อมูล

```sql
INSERT INTO categories(category_name) VALUES ('เครื่องเขียน');
SELECT category_id, category_name FROM categories ORDER BY category_id;
```

INSERT เพิ่มแถว; VALUES คือค่าที่จะใส่; SELECT เลือกช่อง; FROM ระบุตาราง; ORDER BY เรียงลำดับ
อย่าใส่ ID เองถ้าใช้ identity ให้ PostgreSQL ออกให้

```sql
SELECT p.product_name, v.variant_name, v.price, v.stock_quantity
FROM products p
JOIN product_variants v ON v.product_id = p.product_id
WHERE p.product_id = 1;
```

p/v เป็นชื่อย่อของตาราง; JOIN เชื่อมข้อมูลด้วย FK; WHERE กรองแถว
สินค้าอยู่ products แต่ราคา/สต็อกของแต่ละตัวเลือกอยู่ product_variants
ไฟล์ data.sql ใช้ generate_series สร้างข้อมูลสมมติหลายแถว และ CALL procedure สร้างออเดอร์จริง
รหัส password_hash ของ seed เป็นค่าปิดการ login ไม่ใช่รหัสผ่าน plaintext; แอปนี้ใช้ลูกค้าสาธิตหมายเลข 1

## 4. แก้ข้อมูลอย่างระวัง

```sql
BEGIN;
UPDATE product_variants SET stock_quantity = 0 WHERE variant_id = 1;
SELECT variant_id, stock_quantity FROM product_variants WHERE variant_id = 1;
ROLLBACK;
```

BEGIN เริ่ม transaction; UPDATE เปลี่ยนแถวที่ตรง WHERE; ROLLBACK ย้อนกลับ
เมื่อเข้าใจผลและต้องการบันทึกจริงจึงใช้ COMMIT แทน ROLLBACK
อย่าเอา WHERE ออก เพราะจะอัปเดตทุกแถว
ค่าที่ COMMIT แล้วจะถูกเว็บอ่านใหม่ภายในประมาณ 5 วินาที

## 5. Checkout และ transaction

เปิด database/logic.sql ที่ sp_checkout_order แล้วอ่านตามลำดับ:

1. ตรวจลูกค้า ตะกร้า จำนวน และที่อยู่
2. SELECT ... FOR UPDATE ล็อก variant โดยเรียง ID เพื่อกันซื้อสต็อกเดียวกันพร้อมกัน
3. ตรวจ stock_quantity และราคาในฐาน ไม่เชื่อราคาที่ browser ส่งมา
4. ตรวจคูปอง STUDENT10 แล้วคำนวณส่วนลด
5. INSERT orders แล้ว RETURNING order_id เพื่อเอา ID ไปสร้างรายการลูก
6. INSERT order_items เก็บ unit_price ณ ตอนซื้อ
7. UPDATE product_variants ตัด stock
8. INSERT shipments แยกตามร้านค้า แบ่งค่าส่งให้รวมตรงถึงระดับสตางค์
9. INSERT payments เป็นการชำระเงินจำลอง

ตัวอย่างทดลองที่ไม่เก็บผล:

```sql
BEGIN;
CALL sp_checkout_order(
  1, '[{"variant_id":"1","quantity":1}]'::jsonb,
  'ผู้ทดลอง', '0800000000', 'กรุงเทพฯ 10110',
  'Cash on Delivery', '', NULL
);
ROLLBACK;
```

CALL เรียก procedure; jsonb เป็นรายการสินค้าในคำขอ ไม่ใช่ฐานข้อมูล NoSQL; NULL ตัวสุดท้ายคือช่องคืน order_id
RAISE EXCEPTION หยุดงานเมื่อผิดเงื่อนไข เช่น สินค้าไม่พอ
backend/src/lib/transaction.ts จับ error แล้ว ROLLBACK ด้วย pg client ตัวเดียวกับที่ BEGIN
procedure ไม่ COMMIT เอง เพราะ API เป็นผู้ควบคุมขอบเขต transaction
เลข identity อาจข้ามหลัง rollback เป็นเรื่องปกติ เลข PK ไม่ต้องเรียงติดกัน

ACID ในงานนี้: Atomicity ทั้งชุดสำเร็จหรือยกเลิก, Consistency รักษา FK/CHECK, Isolation ล็อก stock กันซื้อเกิน, Durability COMMIT แล้วข้อมูลอยู่ใน PostgreSQL volume

## 6. Trigger จัดส่ง

trg_lock_shipment_order ล็อก order ก่อนอัปเดต shipment เพื่อจัดลำดับการส่งหลายร้านที่ทำพร้อมกัน
trg_update_shipment_on_item_delivered ทำงานหลังเปลี่ยน shipment_status
หาก shipment เป็น delivered และ NOT EXISTS shipment ของออเดอร์เดียวกันที่ยังไม่ delivered จะตั้ง order เป็น completed
ถ้าเป็น COD จำลองจะตั้ง payment เป็น paid ตอนส่งครบ

สถานะใน API เดินตามลำดับ Pending → Processing → Shipped → Delivered
ตอน Shipped ต้องมี carrier/tracking_number; อย่าอัปเดต order เป็น completed เองเพื่อเลี่ยง trigger

## 7. Reporting view

vw_merchant_sales_summary เป็น SELECT ที่ตั้งชื่อใช้ซ้ำ ไม่ใช่ตารางที่ 11
คำนวณยอดขายจาก order_items.quantity × unit_price แยก merchant/category
รวม shipments ก่อนนำไป join ป้องกันค่าขนส่งถูกคูณตามจำนวนรายการสินค้า
แบ่งค่าส่งให้หมวดหมู่ตามจำนวนชิ้นในร้านค้า/ออเดอร์นั้น และจัดเศษสตางค์ให้ยอดรวมตรง
ใช้ ROW_NUMBER หา best seller ต่อร้าน/หมวดหมู่ เรียงจำนวนขายก่อนและ product_id ใช้ตัดสินกรณีเสมอ
ไม่ JOIN payments ดิบกับ order_items เพราะ payment retry จะทำให้ยอดขายซ้ำ

```sql
SELECT * FROM vw_merchant_sales_summary;
```

gross_sales ก่อนส่วนลด; order_count นับต่อ merchant/category จึงไม่ควรบวกรวมเพื่อหาออเดอร์ไม่ซ้ำทั้งระบบ
หน้า reports แสดงส่วนลดรวมและจำนวนออเดอร์จาก orders แยกต่างหาก รวม unpaid COD ในมูลค่าออเดอร์ ไม่ใช่เงินสดรับจริง

## 8. Complex queries 10 ข้อ

เปิด queries.sql แล้วรันทีละข้อ อธิบายว่าใช้ตารางไหนและได้แถวอะไร

- 1–2: JOIN เชื่อมอย่างน้อย 3 ตาราง
- 3–5: GROUP BY จัดกลุ่ม, SUM/AVG/COUNT รวมค่า, HAVING กรองหลังรวมกลุ่ม ต่างจาก WHERE ที่กรองแถวก่อนรวม
- 6–8: Subquery เป็น SELECT ซ้อนใน SELECT; EXISTS เช็กว่ามีแถวตรงเงื่อนไข; NOT EXISTS เช็กว่าไม่มี
- 9: DENSE_RANK ให้ลำดับสินค้าต่อร้าน และให้อันดับเท่ากันเมื่อยอดเท่ากัน
- 10: SUM(...) OVER(...) หายอดสะสมตามวันโดยไม่รวมทุกวันเป็นแถวเดียว

## 9. เส้นทาง API

```text
หน้าเว็บ → store-provider.tsx → api.ts (fetch)
→ Express route → service → pg query → PostgreSQL
→ JSON กลับมา → context refresh → ทุกหน้าแสดงข้อมูลใหม่
```

| HTTP / URL | แก้ไฟล์ backend |
|---|---|
| GET /api/products, /api/products/:id | products.query.ts + products.service.ts |
| GET /api/store | store.service.ts (ข้อมูลร่วม + รายงาน) |
| POST /api/products | product-write.service.ts |
| PUT /api/products/:id | product-write.service.ts |
| DELETE /api/products/:id | product-write.service.ts |
| POST /api/orders/checkout | checkout.service.ts + logic.sql |
| PATCH /api/shipments/:id | shipments.service.ts + trigger ใน logic.sql |
| POST/PUT/DELETE /api/reviews | reviews.service.ts |

ตัวรับ URL อยู่ routes/; การตรวจข้อมูลซ้ำได้อยู่ lib/validation.ts

## 10. ฝึกแก้ API สินค้า

ดู backend/src/queries/products.query.ts:

```sql
p.product_name AS name,
(p.status = 'active') AS active
```

AS ตั้งชื่อในผลลัพธ์ ไม่เปลี่ยนชื่อตารางหรือเพิ่มคอลัมน์ ส่วน active เป็น boolean ที่แปลงจาก status
frontend/types/product.ts ต้องตรงกับ JSON นี้ ไม่จำเป็นต้องชื่อเดียวกับ SQL แต่ต้องมีที่มาชัดเจน

```ts
const result = await client.query(
  'SELECT product_name FROM products WHERE product_id = $1',
  [product_id],
);
```

await รอฐานข้อมูล; $1 รับค่าที่แยกจากข้อความ SQL; ห้ามต่อ input ผู้ใช้ลงใน SQL ตรง ๆ
result.rows คือแถวผลลัพธ์; result.rowCount คือจำนวนแถว
ถ้าเพิ่มช่องใน SELECT ให้ตรวจ type และ component ที่ใช้พร้อมกัน แต่ห้ามเพิ่มคอลัมน์นอก schema โดยไม่แก้แบบออกแบบ

แบบฝึก: เพิ่มการแสดง SKU ใน product card โดยอ่าน data.variants ที่ product_id ตรงกัน แล้วทดสอบสินค้าที่มีหลาย variants
แบบฝึก: เปลี่ยนข้อความแจ้ง stock ไม่พอใน procedure แล้วรัน logic.sql ใหม่ในฐานฝึก
แบบฝึก: เขียน SELECT รายการชำระเงินของ order หนึ่ง ดูทั้ง failed และ paid ว่ายังเป็นคนละแถว

การแก้ stock ใช้ original_stock_quantity เทียบกับ stock ตอนบันทึก ถ้ามีคนซื้อระหว่างเปิดฟอร์ม API ตอบ 409 ให้ปิดและเปิดใหม่ ไม่เขียนทับยอดซื้อที่เพิ่งตัด
เลขนี้เป็นข้อมูลตรวจคำขอ ไม่ใช่ช่องให้ผู้ใช้กรอก และไม่เพิ่มคอลัมน์

## 11. Frontend ที่ตรงตาราง

- products: ชื่อ รายละเอียด ร้านค้า หมวดหมู่ สถานะ
- product_variants: ชื่อตัวเลือก SKU ราคา สต็อก สถานะ ไม่มีช่อง color/size แยก
- orders: ผู้รับ เบอร์โทร ที่อยู่ช่องเดียว ส่วนลด และสถานะ
- order_items: จำนวนและราคาตอนซื้อ ยอดรวมคำนวณจากสองช่องนี้
- payments: วิธี สถานะ ยอดชำระ และประวัติหลายรายการ
- shipments: ร้านค้า ผู้ขนส่ง เลขพัสดุ ค่าส่ง และวันส่ง/รับ
- reviews: คะแนนและข้อความ

ไม่เก็บ products/orders ใน localStorage; ตะกร้า browser ยังเก็บได้โดยไม่ต้องมีตารางใหม่
coupon_code เป็น input ของ procedure ผลเก็บใน discount_amount ตามโจทย์ ไม่จำเป็นต้องเพิ่มตารางคูปอง

## 12. ตรวจและส่งงาน

รันคำสั่งทดสอบใน README แล้วดู qa/backend-verification.md
ทดสอบซื้อเกิน stock, ซื้อชิ้นสุดท้ายพร้อมกัน, payment failure rollback, ส่งยังไม่ครบ/ครบแล้ว, รายงานไม่คูณซ้ำ
เตรียม EER พร้อม cardinality/participation, FD และ normalization 3NF/BCNF, relational schema, data dictionary, กฎธุรกิจอย่างน้อย 5 ข้อ
ตรวจ PDF ให้ใช้ชนิดข้อมูล PostgreSQL และ reviews.product_id สอดคล้องกับโค้ด
จัดรายงาน SQL ทั้ง 4 ไฟล์ โค้ด frontend/backend วิธีเปิด และวิดีโอ 5–7 นาที สมาชิกครบตามที่อาจารย์กำหนด
ต้องเข้าใจและอธิบายงานเอง ไม่ใช่เพียงรันโค้ดผ่าน
