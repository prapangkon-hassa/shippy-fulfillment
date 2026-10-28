# การเชื่อมฐานข้อมูลปัจจุบัน

เชื่อมแล้ว: PostgreSQL 17 → pg → Express → shared React Context → components
ฐานข้อมูลเป็นแหล่งจริง สินค้า/ออเดอร์/รีวิว/รายงานไม่ใช้ localStorage หรือ mock อีก

- การอ่านทั้งชุด: GET /api/store ภายใน read-only REPEATABLE READ transaction
- การเขียน: service แต่ละหมวดใช้ parameterized SQL และ transaction
- หลังเขียน: frontend โหลด snapshot ใหม่; อีกแท็บ/การแก้ใน pgAdmin ตรวจทุก 5 วินาทีและเมื่อ focus
- ตะกร้า: localStorage ฝั่ง browser เท่านั้น สต็อกไม่ถูกจองจน checkout
- DB schema: 10 ตารางตาม PDF; รายงานและยอดรวมเป็นผลคำนวณ ไม่ใช่คอลัมน์เพิ่มเติม
- `backend/.env`: URL/password เฉพาะ server ห้ามนำเข้า frontend

ดู README.md สำหรับติดตั้ง/pgAdmin และ PRACTICE_WORKBOOK.md สำหรับคำอธิบาย SQL/API
ระบบนี้เป็น classroom demo บน localhost ใช้ customer_id=1 ยังไม่มี authentication หรือ payment gateway จริง
