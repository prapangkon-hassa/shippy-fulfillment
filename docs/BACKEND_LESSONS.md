# เริ่มฝึก Backend

ระบบเชื่อม PostgreSQL แล้ว ไม่ต้องเปลี่ยนจาก mock ด้วยตัวเองอีก
เริ่มจาก [คู่มือเปิดระบบ](../README.md) แล้วอ่าน [สมุดฝึก](PRACTICE_WORKBOOK.md) ตามบท

สแตก: Next.js → Express → node-postgres (`pg`) → PostgreSQL
pg เป็นแพ็กเกจที่ติดตั้งใน backend/node_modules ไม่ใช่ส่วนหนึ่งของ Express หรือโปรแกรมฐานข้อมูล
ไม่มี Prisma และไม่มี SQLite/NoSQL

ไฟล์ที่ฝึกแก้ API แยกตามหมวดอยู่ backend/src/services/ ดู [แผนที่ไฟล์](PROJECT_STRUCTURE.md)
SQL ที่ส่งอาจารย์อยู่ database/ อย่าเก็บโค้ดไว้เฉพาะในประวัติ Query Tool ของ pgAdmin
