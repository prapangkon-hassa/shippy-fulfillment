# ผลตรวจระบบ PostgreSQL + Express + Frontend

ตรวจวันที่ 12 ตุลาคม 2026 บนเครื่องนี้

## ผ่าน

- PostgreSQL 17 ใน Docker รันจริงที่ 127.0.0.1:5433 / database fulfillment
- schema.sql, logic.sql, data.sql รันจริงใน transaction; 10 ตารางตามโครง
- ชนิดข้อมูล PostgreSQL, PK/FK/UNIQUE/NOT NULL/CHECK/DEFAULT และ indexes
- Seed หลัก: merchants 20, categories 20, customers 500, products 500, variants 1000,
  orders 500, order_items 1000, payments 520, shipments 1000, reviews 500
- Backend build และ unit/API tests 2/2
- Database integration tests 13/13 (รวม parent suite) ในฐานแยก fulfillment_test_<timestamp> ซึ่งถูกลบหลังทดสอบ
- Complex queries ทั้ง 10 ข้อรันได้
- สินค้าไม่พอ: ไม่สร้าง order และไม่ตัด stock
- จำลอง error ตอน INSERT payment หลังสร้าง order/items/shipments: rollback ทั้ง transaction
- ซื้อชิ้นสุดท้ายพร้อมกัน 2 คำขอ: สำเร็จเพียง 1; stock ไม่ติดลบ
- ส่วนลด STUDENT10 คำนวณฝั่งฐาน; ไม่เชื่อ total จาก client
- ส่งพร้อมกันหลายร้าน: order เป็น completed หลังทุก shipment delivered, COD เป็น paid
- Product CRUD, SKU unique, stale-stock update 409, ห้ามลบสินค้าที่มี order history
- Review CRUD และตรวจ completed purchase
- รวมยอด view เท่ากับ order_items/shipments; payment retry ไม่คูณยอดขาย
- Frontend TypeScript, ESLint และ production build ผ่าน

## ตรวจผ่าน Playwright MCP และสคริปต์เบราว์เซอร์

- สร้างสินค้าจาก Merchant Product Management
- Checkout สินค้า 550 บาท + coupon ลด 55 + shipping 60 = 555 บาท บันทึก order/payment จริง
- หลังซื้อ stock=0: Product Card และ Detail แสดง Out of Stock, Buy now กดไม่ได้
- สินค้า 2 variants: 0/2 ยัง In Stock; 0/0 เป็น Out of Stock ในสองแท็บ และหลัง reload
- Merchant ส่ง Pending → Processing → Shipped → Delivered แล้ว Order Completed
- เพิ่ม แก้ ลบ review ผ่านหน้าเว็บหลังซื้อและส่งสำเร็จ
- Reporting page อ่านยอดจาก PostgreSQL view
- หน้าหลักทั้ง storefront/orders/merchant เปิดได้ ไม่มี JavaScript page errors ในสคริปต์ตรวจ
- มือถือ 390px: Home และ Product Detail ไม่มี horizontal overflow
- ลบเฉพาะข้อมูลที่สร้างทดสอบหลังตรวจ ไม่ล้าง seed

รูปตรวจ: database-product-mobile.png และ database-report-desktop.png
สคริปต์ scripts/verify.cjs ใช้ Playwright/Chrome ที่ติดตั้งแยก; ตั้ง PLAYWRIGHT_PATH หากไม่ได้ลงเป็น dependency

## ขอบเขตที่ต้องแจ้งตอนส่ง

- เป็น classroom demo บน localhost; ไม่มี login/authorization แยกร้านค้า ใช้ customer_id=1 และเลือก merchant ได้
- QR/Card/COD เป็นการจำลอง ไม่มี payment gateway หรือการเรียกเก็บเงินจริง
- หน้าเว็บอ่านและเขียนข้อมูลจริง แต่ seed เป็นข้อมูลสมมติ
- ชื่อสินค้า/variant ในประวัติอ่านจากตารางปัจจุบัน; ราคาซื้อเก็บ unit_price snapshot
- Coupon เป็นกฎ STUDENT10 คงที่เพื่อไม่เพิ่มตารางนอก 10 ตาราง; เก็บส่วนลดใน orders
- รายงานเป็น gross product revenue ของ non-cancelled orders รวม unpaid COD ไม่ใช่ยอดเงินที่รับจริง
- อาจารย์ยังต้องตรวจรายงาน EER/Normalization/FD/Data Dictionary/Business Rules และวิดีโอของนักศึกษา ไม่ได้ถือว่าการผ่าน tests แทนสิ่งส่งเหล่านี้
