# Playwright MCP review — 2026-10-06

ตรวจผ่าน @playwright/mcp ด้วย Chrome headless ใน isolated session ที่ http://localhost:3000
เพิ่ม global Codex MCP ชื่อ playwright แล้วและตรวจสอบ enabled: true

## จุดที่ควรแก้

1. **แถบ Products ไม่เปลี่ยนเมื่อเข้าผ่านปุ่มหน้าแรก**
   - เปิดหน้า / แล้วกด Explore the collection
   - URL เปลี่ยนเป็น /#catalog แต่ .main-nav a.active ยังเป็น Home
   - กด Products ใน navbar โดยตรงแล้วแถบเปลี่ยนถูกต้อง
   - สาเหตุ: navbar.tsx อ่าน hash ผ่าน hashchange/popstate และ onNavigate ของ navbar เท่านั้น เส้นทางจากลิงก์อื่นไม่ได้ปรับ homeSection
   - ควรให้การเปลี่ยน hash จากทุกลิงก์อัปเดตสถานะ navbar ร่วมกัน
   - ภาพ: catalog-active.png

2. **เมนูบัญชีค้างเปิดหลังเปลี่ยนหน้า**
   - เปิด Account menu แล้วเลือก My orders
   - URL เปลี่ยนเป็น /orders แต่ .user-menu.open ยังเป็น true
   - ควรปิดเมนูเมื่อเลือกลิงก์หรือเปลี่ยนหน้า
   - ภาพ: account-menu.png

## ผ่านการทดสอบ

- ค้นหา กรองหมวดสินค้า และ empty state
- เลือก variant, เพิ่มตะกร้า, เก็บข้อมูลเมื่อ reload, จำกัดจำนวนตาม stock
- ตรวจฟอร์ม checkout, สร้าง order, เก็บราคาขณะสั่งซื้อ, ลด stock, แสดงรายละเอียด order
- สร้าง แก้ไข ลบ review และตรวจข้อมูลที่ storefront
- สร้าง แก้ไข ลบ product, validation และ dynamic variants
- เปลี่ยนสถานะ shipment, ตรวจ carrier/tracking และแยกจากสถานะ order
- Buy now และลบรายการจากตะกร้า
- ทั้ง 9 หน้าที่ความกว้าง 1440, 768, 390 พิกเซลไม่มี horizontal overflow
- ไม่พบ browser runtime error หรือ console error ในชุดทดสอบ

การตรวจครั้งนี้ยังไม่ได้แก้โค้ด frontend ตามคำตอบที่ขอเพิ่ม MCP ข้อมูลทดสอบอยู่ใน browser session แยกจากผู้ใช้

## ผลหลังแก้ไข

แก้ทั้งสองจุดแล้ว: เพิ่ม SiteLink สำหรับแจ้งการนำทางจาก navbar, ปุ่มหน้าแรก และ footer พร้อมปิดเมนูบัญชีเมื่อเลือกหน้าใหม่

ตรวจซ้ำผ่าน Playwright MCP:
- ปุ่ม Explore the collection และ Explore products เปลี่ยนแถบเป็น Products
- Back/Forward, reload ที่ /#catalog, คลิกโลโก้กลับ Home ผ่าน
- เมนูบัญชีปิดเมื่อเลือก My orders ทั้งเปลี่ยนหน้าและเลือกหน้าปัจจุบัน
- Home/Products และปุ่มหน้าแรกทำงานบนมือถือ 390px
- ไม่พบ console error
- npm.cmd run typecheck และ npm.cmd run lint ผ่าน

ภาพหลังแก้ไข: fixed-mobile-navigation.png
