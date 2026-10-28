# Deploy เดโมบน Vercel + Neon

สถานะ: เตรียม source แล้ว ยังไม่ได้สร้างหรือเผยแพร่บริการ cloud
ใช้ 2 Vercel projects จาก repository เดียว: frontend root `.` และ API root `backend`.

## 1. สร้าง Neon Free
- เลือก PostgreSQL 17 เพื่อให้ตรง local และเลือก region ใกล้ Vercel API
- ใช้ฐานใหม่ว่างสำหรับเดโม ไม่ใช้ข้อมูลลูกค้าจริง
- ใน Connect คัดลอก pooled connection URL สำหรับ API โดยคง SSL parameters ตาม Neon
- direct URL ใช้เฉพาะเริ่มต้น schema/seed จากเครื่อง ไม่ส่ง URL หรือ password ในแชต/commit
- เปิด `backend/.env` ในเครื่อง เพิ่ม `DIRECT_DATABASE_URL` เป็น direct URL ของฐานใหม่
- รันจากโฟลเดอร์หลัก: `npm.cmd --prefix backend run db:init`
- script รัน schema.sql → logic.sql → data.sql ใน transaction เดียว และปฏิเสธฐานที่มีตารางแล้ว
- หลังสำเร็จลบ DIRECT_DATABASE_URL ออกจาก local env เพื่อป้องกันใช้ผิดฐานในครั้งถัดไป
- local DATABASE_URL เดิมยังชี้ Docker ได้ ข้อมูลบนเครื่องไม่ถูกย้าย/ลบ
- ไม่เรียก db:init ใน Vercel Build Command และไม่รัน test:database บน cloud

## 2. เตรียม repository
- ใช้ personal GitHub repository และ commit source, package-lock ทั้งสองชุด, SQL และเอกสาร
- ห้าม commit .env, .vercel, node_modules, .next หรือ tmp (มี ignore แล้ว)
- ใช้ Node.js 24.x ใน Vercel ทั้งสองโปรเจกต์

## 3. Deploy API
- Import repository ตั้ง Root Directory = backend, Framework = Express
- ใช้ npm ci; ให้ Vercel ตรวจ entry point `src/app.ts` (default export)
- Environment Variables ฝั่ง API:
  - ENABLE_DATABASE=true
  - DATABASE_URL=pooled Neon URL พร้อม SSL
  - FRONTEND_ORIGIN=https://ชื่อเว็บ.vercel.app (origin เดียว ไม่มี / ต่อท้าย)
- ไม่ตั้ง NEXT_PUBLIC_DATABASE_URL และไม่ใส่ DB URL ฝั่ง frontend
- API ใช้ pg pool เดิม, attachDatabasePool และ max 3 connections ต่อ instance
- ไม่มี seed อัตโนมัติระหว่าง build/deploy

## 4. Deploy frontend
- Import repository อีกรอบ Root Directory = . และ Framework = Next.js
- Environment: NEXT_PUBLIC_API_URL=https://ชื่อ-api.vercel.app/api
- Build npm run build; Install npm ci
- หลังรู้โดเมนจริง ปรับ FRONTEND_ORIGIN ใน API แล้ว redeploy API
- NEXT_PUBLIC_API_URL ฝังตอน build; เมื่อเปลี่ยนต้อง redeploy frontend
- Preview ใช้ origin ของ preview ที่ตรงกันและฐาน Neon branch แยก ไม่ชี้ฐาน production

## 5. ขอบเขตผู้ใช้งาน
ระบบยังเป็น classroom demo: customer_id=1 และร้านค้าเลือกได้ทุกแห่ง ไม่มี login/role authorization
ก่อนเปิด URL ให้บุคคลทั่วไปต้องเพิ่ม authentication/authorization หรือจำกัดผู้เข้าชมเดโม
ถ้าใช้ Vercel Deployment Protection ต้องป้องกันทั้งเว็บและ API แล้วทดสอบว่า browser เรียกข้ามสองโดเมนได้
การป้องกันเฉพาะ frontend ไม่ได้ป้องกัน API โดยตรง; CORS ก็ไม่ใช่ระบบ login
อย่าใส่ protection bypass secret ใน NEXT_PUBLIC variables หรือ JavaScript ฝั่ง browser
หาก protection ข้ามโดเมนขัดข้อง ให้ใช้ proxy ฝั่ง server ที่ตรวจ session ก่อนส่งต่อ หรือเพิ่ม login ก่อนเผยแพร่

## 6. ทดสอบหลัง deploy
- เปิด /api/health และ /api/health/database: status ok
- เปิดสินค้าบนเว็บ ตรวจจำนวนสินค้า/สต็อกและไม่มี localhost request
- Buy Now ซื้อเฉพาะชิ้นที่กด และรายการเดิมใน Cart ยังอยู่
- Cart ซื้อเฉพาะที่เลือก และไม่ลบรายการที่ไม่ได้ซื้อ
- ซื้อหลายร้าน: ร้านเดียวรวม Shipment/Tag, คนละร้านแยกกัน
- สินค้าหมด/ซื้อเกินสต็อก: ไม่สร้าง Order และ stock ไม่เปลี่ยน
- ยกเลิกก่อนส่ง: คืน stock, payment refunded/void; retry ต้องไม่คืน stock ซ้ำ
- มี Shipment ส่งแล้ว: ยกเลิกทั้ง Order ไม่ได้
- ร้านค้าอัปเดตสถานะได้ แต่ไม่มีปุ่มยกเลิก
- ตรวจ logs และยอดรายงานหลังรายการทดสอบ

## ความสอดคล้องกับข้อกำหนดอาจารย์
การเตรียม deploy นี้ไม่แก้ schema.sql/data.sql/logic.sql/queries.sql และไม่เพิ่มตาราง
ยังใช้ PostgreSQL จริง 10 ตาราง, SQL procedure/trigger/view, price snapshot และ transaction บน client เดียว
Neon เป็นผู้ให้บริการ PostgreSQL ไม่ได้เปลี่ยนเป็น NoSQL หรือ SQLite
ผู้ใช้แจ้งว่า PostgreSQL ได้รับอนุญาตแล้ว; ควรระบุ PostgreSQL 17 + Neon ในรายงาน
Transaction ใช้ BEGIN/COMMIT/ROLLBACK ใน backend ครอบ CALL procedure ต้องอธิบายตำแหน่งนี้ในรายงาน
ยังต้องจัดทำ EER, FD/Normalization, data dictionary และวิดีโอตามโจทย์ การ deploy ไม่แทนสิ่งส่งเหล่านี้

เอกสารอ้างอิง:
- https://vercel.com/docs/frameworks/backend/express
- https://neon.com/docs/connect/connection-pooling
- https://vercel.com/docs/plans/hobby
- https://neon.com/pricing
