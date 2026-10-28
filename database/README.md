# ไฟล์ SQL

แก้และเก็บใน VS Code; รันกับ PostgreSQL ผ่าน `npm.cmd run db:init` หรือ pgAdmin Query Tool

ลำดับสำหรับฐานใหม่ที่ว่างเท่านั้น: schema.sql → logic.sql → data.sql
queries.sql เป็น SELECT สำหรับวิเคราะห์ ไม่ต้องใช้สร้างตาราง
logic.sql รันซ้ำเพื่ออัปเดต procedure/functions/triggers/view ได้ โดยไม่ลบข้อมูล
schema.sql และ data.sql ไม่ใช่ migration อย่ารันซ้ำในฐานเดิม

Seed: merchants 20, categories 20, customers 500, products 500, product_variants 1000,
orders 500, order_items 1000, payments 520, shipments 1000, reviews 500

จำนวนอาจเพิ่มขึ้นเมื่อใช้เว็บจริง ข้อมูลทั้งหมดเป็นข้อมูลสมมติสำหรับงานเรียน
payments มี 20 failed attempts เพิ่มจาก 500 paid records เพื่อแสดงความสัมพันธ์ 1:N

ชนิดข้อมูลแปลงจาก SQL Server ในรายงานเป็น PostgreSQL: NVARCHAR → varchar/text (UTF-8),
DATETIME2 → timestamptz, BIT → boolean, TINYINT → smallint
category_id เป็น integer ส่วน ID หลักอื่นเป็น bigint
reviews ใช้ product_id ตาม data dictionary; รายการ order_id ในบางหน้าของ PDF เป็นข้อที่ควรแก้ในรายงาน
ไม่มี image_url/color/size/total_amount ในตาราง; frontend แสดงเฉพาะฟิลด์จริงและค่าที่คำนวณได้

หมวดและสินค้าตัวอย่างใช้ชื่อภาษาไทยที่สื่อความหมายแล้ว (20 หมวด / 500 สินค้า) โดยชื่อสินค้าลงท้ายรุ่นเพื่อแยกข้อมูลตัวอย่าง รหัสสินค้า ราคา และสต็อกคงเดิม สำหรับฐานเก่าใช้ migrations/002_name_sample_catalog.sql ใน transaction; ฐานใหม่ใช้ data.sql ซึ่งรวมการตั้งชื่อแล้ว

ข้อมูลล่าสุดจัดร้านตามแนวสินค้า ร้านละ 1–3 หมวด ไม่ได้ให้ทุกร้านขายครบ 20 หมวด ดูรายละเอียดใน docs/SAMPLE_CATALOG.md และ migration 003_theme_sample_merchants.sql (ใช้แทนการกระจายหมวดแบบเดิมสำหรับข้อมูลตัวอย่าง)
