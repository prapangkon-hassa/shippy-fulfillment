# โครงสร้างไฟล์ที่ใช้งานจริง

| หมวด | ไฟล์ | หน้าที่ |
|---|---|---|
| ตาราง/ความสัมพันธ์ | database/schema.sql | DDL 10 ตารางตาม PDF |
| ข้อมูล | database/data.sql | seed สมมติที่ลง PostgreSQL จริง |
| กฎธุรกิจ | database/logic.sql | procedure, triggers, view |
| คำถาม SQL | database/queries.sql | 10 complex queries |
| เชื่อม PostgreSQL | backend/src/lib/db.ts | connection pool, DATABASE_URL |
| transaction | backend/src/lib/transaction.ts | BEGIN/COMMIT/ROLLBACK ด้วย client เดียว |
| API อ่านสินค้า | backend/src/routes/products.routes.ts → controllers/products.controller.ts → services/products.service.ts → queries/products.query.ts | อ่าน products + variants |
| API อื่น | backend/src/routes/store.routes.ts | จับคู่ URL กับ service |
| snapshot ทุกหน้า | backend/src/services/store.service.ts | อ่านใน REPEATABLE READ ให้ข้อมูลสัมพันธ์กัน |
| เพิ่ม/แก้/ลบสินค้า | backend/src/services/product-write.service.ts | validate + transaction; FK ป้องกันลบของที่ขายแล้ว |
| ซื้อสินค้า | backend/src/services/checkout.service.ts | ตรวจ request แล้ว CALL sp_checkout_order |
| จัดส่ง | backend/src/services/shipments.service.ts | อัปเดตสถานะตามลำดับ |
| รีวิว | backend/src/services/reviews.service.ts | CRUD + ตรวจการซื้อจริง |
| รับส่ง HTTP | src/services/api.ts | fetch และข้อความ error |
| ข้อมูลร่วมทั้งเว็บ | src/context/store-provider.tsx | snapshot จาก API, refresh หลังเขียน, poll/focus |
| หน้าเว็บ | src/components/ | แยก products/cart/checkout/orders/merchant/reviews/shipments |
| TypeScript types | src/types/ | ชื่อที่แปลงจาก SQL และผลคำนวณ |
| ทดสอบฐานข้อมูล | backend/tests/database.test.ts | ใช้ฐานทดสอบแยก |

ไม่มี src/data/mock-* แล้ว ข้อมูลสินค้า/ออเดอร์/รายงานไม่มีสำเนาอิสระใน localStorage
localStorage เก็บตะกร้าเท่านั้น; schema ไม่ต้องมีตาราง cart

ลำดับที่ควรอ่าน: schema.sql → data.sql → db.ts → products.query.ts → products.service.ts → store-provider.tsx → product-card.tsx แล้วค่อยอ่าน checkout transaction
