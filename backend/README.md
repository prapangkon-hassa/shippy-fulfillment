# Backend

Node.js + Express + pg + PostgreSQL

อ่าน [บทเรียนภาษาไทย](../docs/BACKEND_LESSONS.md) แล้วเปิด API:

```powershell
npm.cmd install
npm.cmd run dev
```

Health: http://localhost:4000/api/health

```text
src/server.ts     เปิด server
src/app.ts        middleware/routes/error handling
src/routes/       URL แยกหมวด
src/controllers/  request และ response
src/services/     จัดการข้อมูลที่ได้จาก SQL
src/queries/      คำสั่ง SQL ของ API
src/lib/db.ts     connection pool ของ pg
```

งาน SQL ส่งอาจารย์เขียนใน `../database/` โดยคุณสร้างตาราง/ข้อมูลเองผ่าน pgAdmin
มี GET /api/products และ GET /api/products/:id เป็นตัวอย่าง ยังไม่มี CRUD/checkout/authentication จริง
คัดลอก .env.example เป็น .env เมื่อยังไม่มีไฟล์ แล้วเติมค่าของคุณ เปลี่ยน ENABLE_DATABASE=true เมื่อพร้อมอ่านข้อมูลจริง
