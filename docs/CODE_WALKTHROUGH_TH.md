# คู่มืออ่านโค้ดทั้งระบบ: จากหน้าเว็บถึง PostgreSQL

อ้างอิงไฟล์ที่ตรวจวันที่ 13 ตุลาคม 2026 คู่มือนี้อธิบายระบบที่มีอยู่ ไม่ได้เพิ่มฟังก์ชันหรือเปลี่ยนข้อมูลจริง ตัวอย่างที่ระบุว่า “แบบย่อ” ใช้เพื่อเรียนรู้ ไม่ใช่โค้ดเต็มสำหรับแทนไฟล์เดิม

อ่านเรียงบท 1–5 เพื่อเข้าใจภาพรวม แล้วเปิดไฟล์ตามบท 6–12 เพื่อไล่โค้ด ใช้ Ctrl+P ใน VS Code แล้ววางเส้นทางไฟล์ เช่น `backend/src/lib/db.ts` ใช้ Ctrl+Shift+F ค้นชื่อฟังก์ชัน เช่น `save_product` เพื่อดูว่าใครเรียกใคร

## 1. ระบบนี้มีอะไรบ้าง

```text
ผู้ใช้เปิด Browser
  ↓ หน้าเว็บ Next.js + React :3000
  ↓ Context เก็บข้อมูลที่โหลดมาสำหรับแสดงผล
  ↓ fetch ส่ง HTTP/JSON
API Express ทำงานด้วย Node.js :4000
  ↓ ตรวจข้อมูลและกฎธุรกิจ
  ↓ ไลบรารี pg ส่ง SQL
PostgreSQL :5433 บนเครื่องเรา → :5432 ภายใน Docker
  ↓ เก็บข้อมูลจริงใน Docker volume
```

| คำ | หมายถึงอะไรในระบบนี้ |
|---|---|
| Frontend | ส่วนที่ผู้ใช้เห็นและกด เช่น รายการสินค้าและฟอร์ม |
| React | สร้างชิ้นส่วนหน้าจอและอัปเดตเมื่อข้อมูลเปลี่ยน |
| Next.js | จัดเส้นทางหน้าเว็บและการทำงานของแอป React |
| Backend | รับคำขอ ตรวจความถูกต้อง และสั่งฐานข้อมูล |
| Node.js | ตัวรัน JavaScript ฝั่งเซิร์ฟเวอร์ ทั้ง Next และ Express ใช้ได้ |
| Express | ไลบรารีใน Node.js สำหรับสร้าง HTTP API |
| API | ช่องทางที่โปรแกรมใช้คุยกัน เช่น POST /api/products |
| pg | ไลบรารี Node.js สำหรับเชื่อม PostgreSQL และส่ง SQL ไม่ใช่ตัวฐานข้อมูล |
| PostgreSQL | ระบบฐานข้อมูลที่ประมวลผล SQL และเก็บแถวจริง |
| Docker | ใช้เปิด PostgreSQL ใน container ตาม compose.yaml |
| pgAdmin | เครื่องมือเชื่อมไปดูและสั่ง PostgreSQL |
| VS Code | ใช้เขียนและเก็บไฟล์โค้ด/SQL |
| TypeScript | JavaScript ที่เพิ่มการตรวจชนิดข้อมูลตอนพัฒนา |

ไม่มี Prisma ในระบบนี้ เราเขียน SQL เองแล้วใช้ `pg` ส่งคำสั่งไป PostgreSQL

## 2. ฐานข้อมูลเก็บตรงไหน

มีสามอย่างที่ต้องแยกกัน:

1. `database/schema.sql`, `data.sql`, `logic.sql`: ไฟล์คำสั่งในโฟลเดอร์โปรเจกต์
2. ฐาน `fulfillment` ใน PostgreSQL: เก็บตารางและข้อมูลหลังรันคำสั่งแล้ว
3. `fulfillment_data`: ชื่อ volume ใน `compose.yaml` ใช้เก็บไฟล์จริงของ PostgreSQL ที่ `/var/lib/postgresql/data` ภายใน container

Docker Compose โดยทั่วไปเติมชื่อโปรเจกต์ไว้หน้าชื่อ volume; ตรวจชื่อจริงด้วย `docker volume ls` อย่าเดาว่าเป็นโฟลเดอร์ `database/` ใน Windows ตำแหน่งดิสก์ฝั่ง Windows ขึ้นกับการตั้งค่า Docker Desktop

ปิด pgAdmin หรือ VS Code ไม่ได้ลบข้อมูล ปิด container ด้วย `npm.cmd run db:stop` ก็ยังคง volume ไว้ การลบ volume เป็นคนละเรื่องและทำให้ข้อมูลในนั้นหายได้

**แก้ไฟล์ SQL แล้วกด Save ยังไม่เปลี่ยนฐานข้อมูล** ต้องรัน SQL กับฐานเป้าหมาย ส่วนแก้ผ่าน pgAdmin ก็ไม่แก้ไฟล์ใน VS Code ให้อัตโนมัติ จึงควรเก็บคำสั่งแก้เป็นไฟล์ด้วย

ไฟล์การตั้งค่า:

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `compose.yaml` | PostgreSQL 17, ฐาน fulfillment, user fulfillment, port และ volume |
| `.env` ที่ root | ค่า POSTGRES_PASSWORD ให้ Docker Compose |
| `backend/.env` | DATABASE_URL, ENABLE_DATABASE และค่ารัน API |
| `backend/.env.example` | ตัวอย่างชื่อค่าที่ต้องตั้ง ไม่ใช่ข้อมูลเชื่อมต่อจริง |
| `scripts/setup-database.mjs` | ช่วยสร้างการตั้งค่าเริ่มต้น |

อย่านำรหัสผ่านไปเขียนใน component หรือค่าที่ขึ้นต้น `NEXT_PUBLIC_` เพราะค่ากลุ่มนี้สามารถถูกส่งไป browser ได้

เปิดดูข้อมูลใน pgAdmin: Servers → เซิร์ฟเวอร์ที่เชื่อมไว้ → Databases → fulfillment → Schemas → public → Tables → คลิกขวาตาราง → View/Edit Data การเชื่อมสำหรับ compose นี้ใช้ host `127.0.0.1`, port `5433`, database/user `fulfillment`; ใช้รหัสผ่านของเครื่องตนเอง

## 3. ข้อมูล 10 ตารางเชื่อมกันอย่างไร

| ตาราง | เก็บอะไร | ช่องสำคัญและการอ้างอิง |
|---|---|---|
| merchants | ร้านค้า | merchant_id, merchant_name, email, phone, status, created_at |
| categories | หมวดสินค้า | category_id, category_name, is_active |
| customers | ลูกค้า | customer_id, full_name, email, phone, password_hash, status, created_at |
| products | ข้อมูลสินค้าหลัก | product_id, merchant_id → ร้าน, category_id → หมวด, product_name, description, status, created_at |
| product_variants | ตัวเลือกที่ขายจริง | variant_id, product_id → สินค้า, sku, variant_name, price, stock_quantity, status |
| orders | หัวคำสั่งซื้อ | order_id, customer_id → ลูกค้า, order_date, order_status, discount_amount, shipping_name/phone/address |
| order_items | สินค้าแต่ละรายการในออเดอร์ | order_item_id, order_id → ออเดอร์, variant_id → ตัวเลือก, quantity, unit_price |
| payments | รายการชำระเงิน | payment_id, order_id → ออเดอร์, payment_method/status, amount, transaction_ref, paid_at, created_at |
| shipments | พัสดุที่ร้านจัดส่ง | shipment_id, order_id → ออเดอร์, merchant_id → ร้าน, carrier, tracking_number, shipment_status, shipping_cost, shipped_at, delivered_at |
| reviews | รีวิวของลูกค้า | review_id, customer_id → ลูกค้า, product_id → สินค้า, rating, review_text, created_at |

```text
merchants ──< products >── categories
                 │
                 └──< product_variants ──< order_items >── orders >── customers
                                                            │
                                                            ├──< payments
                                                            └──< shipments >── merchants
customers ──< reviews >── products
```

`──<` หมายถึงหนึ่งแถวฝั่งซ้ายสัมพันธ์กับหลายแถวฝั่งขวาได้ ร้านหนึ่งมีสินค้าหลายหมวดได้ เพราะ `category_id` อยู่ใน products ไม่ได้อยู่ใน merchants สินค้าหนึ่งรายการมีร้านและหมวดอย่างละหนึ่ง แต่มีหลาย variants ได้

ตัวอย่างสมมติ: เสื้อหนึ่งสินค้า มีตัวเลือก “รุ่นมาตรฐาน” และ “รุ่นพิเศษ” คนละ SKU ราคาและสต็อกอยู่แต่ละ variant เมื่อซื้อจะเก็บ variant_id ใน order_items ไม่ได้เก็บเพียง product_id

`unit_price` เป็นราคาขณะซื้อ หากแก้ราคา variant ภายหลัง ยอดออเดอร์เก่ายังใช้ unit_price เดิม ชื่อสินค้าในประวัติยังอ่านจากสินค้าปัจจุบัน ไม่ใช่ snapshot ชื่อ

หนึ่ง order มีหลาย payments ได้เพื่อรองรับหลายรายการ/ความพยายามชำระเงิน และมีหลาย shipments ได้ Checkout ปัจจุบันสร้างพัสดุแยกตามร้าน

## 4. CRUD อยู่ตรงไหน

CRUD ย่อจาก Create เพิ่ม, Read อ่าน, Update แก้, Delete ลบ เป็นการกระทำ ไม่ใช่ชื่อไฟล์หนึ่งไฟล์

| งาน | หน้าเว็บ/ฟอร์ม | Context | HTTP API | Backend/SQL |
|---|---|---|---|---|
| อ่านข้อมูลรวม | ทุกหน้าที่ useStore | refresh | GET /api/store | store.service.ts → SELECT |
| อ่านสินค้าแยก | endpoint สำหรับสินค้า | หน้าเว็บปัจจุบันอ่านจาก snapshot รวมเป็นหลัก | GET /api/products และ /api/products/:id | products.controller.ts → products.service.ts → products.query.ts |
| เพิ่มสินค้า | merchant/product-form.tsx | save_product ไม่มี id | POST /api/products | product-write.service.ts → INSERT products และ variants |
| แก้สินค้า/สต็อก | product-form.tsx + variant-editor.tsx | save_product มี id | PUT /api/products/:id | product-write.service.ts → UPDATE และจัดการ variants |
| ลบสินค้า | merchant-products.tsx | delete_product | DELETE /api/products/:id | product-write.service.ts → DELETE |
| สั่งซื้อ | checkout/checkout-page.tsx | checkout | POST /api/orders/checkout | checkout.service.ts → CALL procedure |
| เปลี่ยนสถานะพัสดุ | shipments/shipment-actions.tsx | update_shipment | PATCH /api/shipments/:id | shipments.service.ts → UPDATE → Trigger |
| เพิ่มรีวิว | reviews/review-form.tsx | save_review ไม่มี id | POST /api/reviews | reviews.service.ts → INSERT |
| แก้รีวิว | review-form.tsx | save_review มี id | PUT /api/reviews/:id | reviews.service.ts → UPDATE |
| ลบรีวิว | orders/order-detail.tsx | delete_review | DELETE /api/reviews/:id | reviews.service.ts → DELETE |
| ดูรายงาน | merchant/reports.tsx | data.report | รวมมากับ GET /api/store | SELECT จาก vw_merchant_sales_summary |

**ไม่ได้มี CRUD ครบทุกตารางผ่านเว็บ** ร้าน หมวด และลูกค้ายังไม่มีหน้าบริหารเพิ่ม/แก้/ลบของตนเอง การมีตารางหรือ type ไม่ได้แปลว่ามีฟังก์ชันนั้นแล้ว และไม่มี API ยกเลิกออเดอร์/คืนเงินใน routes ปัจจุบัน แม้ schema รองรับชื่อสถานะ cancelled/refunded

สินค้าที่ถูกอ้างในประวัติซื้อจะลบไม่ได้เพราะ FK ให้ปิด active แทน การลบสินค้าที่ไม่ถูกอ้างสามารถลบ variants ตามด้วย CASCADE

## 5. เปิดหน้าแรกแล้วข้อมูลมาจากไหน

1. `src/app/page.tsx` เปิด component Catalog
2. `src/app/layout.tsx` ครอบทุกหน้าด้วย StoreProvider
3. StoreProvider เริ่ม `useEffect` แล้วเรียก `refresh()`
4. `refresh()` เรียก `api('/store')`
5. `src/services/api.ts` ประกอบ URL เป็น `http://localhost:4000/api/store` ตามค่าเริ่มต้น
6. Express ใน `backend/src/app.ts` ส่งต่อ `/api` ให้ store_router
7. `backend/src/routes/store.routes.ts` จับ GET `/store` และเรียก `get_store()`
8. `backend/src/services/store.service.ts` SELECT ตารางจริงและ View ภายใน read-only transaction
9. Backend ส่ง JSON กลับ Context เรียก `set_data()`
10. Catalog รับ `data.products`, `categories`, `merchants` แล้วกรองรายการ ส่งให้ ProductGrid → ProductCard

หน้า product Detail รับ id จาก URL แล้วค้นสินค้าในข้อมูลร่วม ไม่ได้สร้างสต็อกอีกชุดหนึ่งเอง

StoreProvider โหลดใหม่หลังเขียนข้อมูลและทุกประมาณ 5 วินาที รวมถึงตอนหน้าต่างกลับมาโฟกัส จึงเป็น polling ไม่ใช่ WebSocket และการเปลี่ยนจาก pgAdmin ไม่จำเป็นต้องปรากฏทันทีในเสี้ยววินาที

## 6. แผนที่ไฟล์หน้าเว็บทั้งหมด

เส้นทางในตารางนี้เริ่มจาก root โปรเจกต์

| ไฟล์ | หน้าที่/รับอะไร/ส่งอะไร |
|---|---|
| src/app/layout.tsx | โครง HTML หลัก, metadata, CSS, StoreProvider, Navbar และ Footer; children คือหน้าใน URL ปัจจุบัน |
| src/app/page.tsx | เส้นทาง / ส่งงานแสดงผลให้ Catalog |
| src/app/globals.css | สี ฟอนต์ ระยะห่าง ปุ่ม ตาราง การ์ด และ responsive; ไม่อ่านฐานข้อมูล |
| src/app/loading.tsx | หน้ารอโหลดระดับ route |
| src/app/error.tsx | UI เมื่อเกิดข้อผิดพลาดพร้อมปุ่มลองใหม่ |
| src/app/not-found.tsx | หน้าไม่พบเส้นทาง |
| src/app/products/[id]/page.tsx | รับ params.id แล้วส่งเป็น prop ให้ ProductDetail |
| src/app/cart/page.tsx | เปิด CartPage |
| src/app/checkout/page.tsx | เปิด CheckoutPage |
| src/app/orders/page.tsx | เปิด OrdersPage |
| src/app/orders/[id]/page.tsx | รับ id แล้วเปิด OrderDetail |
| src/app/merchant/layout.tsx | โครงร่วมหน้า merchant และ MerchantNav |
| src/app/merchant/products/page.tsx | เปิด MerchantProducts |
| src/app/merchant/orders/page.tsx | เปิด MerchantOrders |
| src/app/merchant/reports/page.tsx | เปิด Reports |

ไฟล์ page.tsx บางไฟล์สั้นเพราะมีหน้าที่จับ URL แล้วส่งต่อ component ไม่ได้หมายความว่าหน้านั้นไม่มี logic

ไฟล์ต่อไปนี้อยู่ใต้ `src/components/`:

| ไฟล์ | หน้าที่และข้อมูลที่ใช้ |
|---|---|
| layout/navbar.tsx | เมนูหน้าร้าน ลิงก์ ตะกร้า ลูกค้าปัจจุบัน; ซ่อนบนเส้นทาง merchant |
| layout/merchant-nav.tsx | เมนู Products/Orders/Reports ของผู้ขายและกลับหน้าร้าน |
| layout/footer.tsx | ท้ายเว็บและลิงก์ |
| layout/site-link.tsx | ตัวห่อลิงก์สำหรับการนำทางของเว็บ; เป็นเครื่องมือ UI ไม่ใช่ API |
| products/catalog.tsx | อ่านสินค้า/ร้าน/หมวดจาก Context แล้วค้นหา กรอง เรียงราคา และแสดงเพิ่ม; ตัวกรองเป็น state ของหน้า |
| products/product-grid.tsx | รับ products ผ่าน props แล้ว map เป็น ProductCard |
| products/product-card.tsx | รับ product แล้วหาชื่อร้าน หมวด variants และ reviews ที่เกี่ยวข้อง; แสดงราคาเริ่มต้นและสต็อก |
| products/product-detail.tsx | รับ product id; รายละเอียด เลือก variant จำนวน ตะกร้า ซื้อ และรีวิว |
| cart/use-cart-lines.ts | จับคู่ variant_id ในตะกร้ากับ product/variant เพื่อสร้างรายการแสดงผล |
| cart/cart-page.tsx | แสดงตะกร้า เปลี่ยนจำนวน ลบรายการ และไป checkout |
| cart/order-summary.tsx | ส่วนสรุปยอด รับตัวเลขที่คำนวณมาแล้วเพื่อแสดงผล |
| checkout/checkout-page.tsx | ฟอร์มชื่อ โทรศัพท์ ที่อยู่ วิธีชำระเงิน คูปอง; เรียก checkout แล้วแสดงผลสำเร็จ |
| orders/orders-page.tsx | รายการออเดอร์ลูกค้าทดสอบและตัวกรองสถานะ |
| orders/order-card.tsx | รับ order หนึ่งรายการแล้วแสดงบัตรสรุปและลิงก์รายละเอียด |
| orders/order-detail.tsx | รายการซื้อ การชำระเงิน ที่อยู่ พัสดุ และการจัดการรีวิว |
| orders/order-status-timeline.tsx | แสดงขั้นตอนออเดอร์จากข้อมูลที่ได้รับ; ตัวมันเองไม่ UPDATE SQL |
| merchant/merchant-products.tsx | ตารางสินค้า ตัวกรองทุกร้าน/ร้านเดียว สรุปจำนวน และเปิดฟอร์มเพิ่ม/แก้/ลบ |
| merchant/product-form.tsx | state ของฟอร์ม ตรวจชื่อ/หมวด/ร้าน/variants แล้วเรียก save_product |
| merchant/variant-editor.tsx | ช่อง SKU ชื่อตัวเลือก ราคา สต็อก สถานะ และเพิ่ม/เอาตัวเลือกออกจากฟอร์ม |
| merchant/metric-card.tsx | การ์ดตัวเลขสรุป รับ label/value/icon ผ่าน props |
| merchant/merchant-orders.tsx | รายการออเดอร์ทุกร้านหรือเฉพาะร้าน รายละเอียดและพัสดุแต่ละร้าน |
| merchant/reports.tsx | อ่าน data.report จาก View; แสดงยอดขาย ค่าส่ง และสินค้าขายดี |
| shipments/shipment-actions.tsx | ปุ่มเลื่อนสถานะพัสดุ ช่องขนส่ง/เลขติดตาม ส่ง update_shipment |
| reviews/review-form.tsx | ฟอร์มดาวและข้อความรีวิว เรียก save_review |
| ui/dialog.tsx | Modal และ ConfirmDialog ใช้ซ้ำในหลายหน้า |
| ui/display.tsx | ส่วนแสดงผลร่วม เช่น ดาวรีวิวและป้ายสถานะ |
| ui/feedback.tsx | หน้าว่างและ skeleton ขณะโหลด |
| ui/quantity-selector.tsx | ปุ่มลด/เพิ่มจำนวน เรียก callback ที่ผู้ใช้ component ส่งมา |

## 7. Context, services และ types ฝั่งเว็บ

| ไฟล์ | หน้าที่ |
|---|---|
| src/context/store-provider.tsx | จุดแชร์ข้อมูลและคำสั่งเขียนให้ทุกหน้า; useStore เป็นทางเข้าถึง |
| src/services/api.ts | ส่ง fetch, JSON, timeout 15 วินาที และแปลง error |
| src/services/products.service.ts | ค้นสินค้าและคำนวณ inventory จากข้อมูลใน Context; ไม่ส่ง SQL |
| src/services/orders.service.ts | กรองออเดอร์ลูกค้า/ร้าน และค้นออเดอร์ตาม id |
| src/services/cart.service.ts | เพิ่ม/แก้/ลบ/ปรับตะกร้าตามสต็อกใน browser; ไม่ตัดสต็อกฐานข้อมูล |
| src/lib/utils.ts | จัดรูปเงิน THB, วันที่ Asia/Bangkok, ค่าส่งสำหรับแสดงผล และ uid helper |

ชื่อ `products.service.ts` มีทั้งฝั่งเว็บและ backend ต้องดูเส้นทางให้ถูก: ฝั่ง `src/` คำนวณจากข้อมูลที่รับมา ส่วน `backend/src/` ติดต่อ PostgreSQL

ใน StoreProvider:

- `data`: snapshot ล่าสุดของข้อมูลรวม
- `ready`: โหลดครั้งแรกสำเร็จแล้วหรือยัง
- `notice`: ข้อความแจ้งผลชั่วคราว
- `refresh`: GET ข้อมูลใหม่แล้วแทน snapshot โดยคงตะกร้าไว้
- `mutate`: ส่ง POST/PUT/PATCH/DELETE แล้ว refresh
- `pending`: กันคำสั่งเขียนซ้อนกันจาก Context นี้ ไม่ใช่ lock ฐานข้อมูล
- `generation`: กันผลอ่านเก่าที่กลับมาช้าทับข้อมูลรุ่นใหม่
- `ref.current`: ค่าล่าสุดที่ callback อ่านได้โดยไม่ติดค่า state เก่า
- `save_cart`: อัปเดต state และบันทึก localStorage key `ef-api-cart-v1`

localStorage เก็บเฉพาะรายการ `{ variant_id, quantity }` ในตะกร้า สต็อก สินค้า ออเดอร์ และรายงานไม่ได้เก็บเป็นฐานสำรองอิสระใน localStorage

ไฟล์ใต้ `src/types/` เป็นคำอธิบายรูปร่างข้อมูลสำหรับ TypeScript ไม่สร้างตารางและไม่ validate request จากผู้ใช้โดยอัตโนมัติ:

| ไฟล์ | รูปร่างที่กำหนด |
|---|---|
| product.ts | product, product_variant, product_input สำหรับฟอร์ม |
| category.ts | category |
| merchant.ts | merchant |
| customer.ts | customer ที่ส่งให้เว็บ ไม่มี password_hash |
| order.ts | order, order_item, order_record ที่รวมรายการ พัสดุ และ payments |
| payment.ts | วิธีจ่าย สถานะและข้อมูล payment |
| shipment.ts | shipment และสถานะพัสดุ |
| review.ts | review |
| cart.ts | cart_item ใน browser |
| checkout.ts | address และ checkout_input |
| store.ts | store_data รวมทุกชุด และ sales_row สำหรับผล View ที่หน้า Reports ใช้จริง |
| report.ts | merchant_report อีกรูปแบบที่ประกาศไว้; หน้า Reports ปัจจุบันใช้ sales_row ใน store.ts ไม่ได้ใช้ type นี้ |
| index.ts | รวม export type เพื่อ import จาก @/types ได้ |

ชื่อสถานะใน type เป็นชุดค่าที่โค้ดยอมรับ ไม่ได้พิสูจน์ว่ามีปุ่ม/endpoint ทำทุกสถานะ เช่น order_status มี Delivered แต่ orders ใน SQL ใช้ completed หลังส่งครบ ส่วน delivered อยู่ใน shipments

## 8. Backend แต่ละไฟล์

| ไฟล์ใต้ backend/ | หน้าที่ |
|---|---|
| src/server.ts | อ่าน PORT เริ่มฟัง 127.0.0.1:4000 และปิด server/pool เมื่อหยุดโปรแกรม |
| src/app.ts | สร้าง Express app, CORS, อ่าน JSON จำกัด 100kb, routes, health check และ error handler |
| src/routes/products.routes.ts | GET / และ /:id ภายใต้ /api/products |
| src/controllers/products.controller.ts | รับ req.params.id ตรวจ id เรียก get_inventory แล้วส่ง JSON/404 |
| src/queries/products.query.ts | SQL SELECT products LEFT JOIN variants พร้อม alias |
| src/services/products.service.ts | รัน inventory_query; แยกแถว JOIN เป็น products ไม่ซ้ำและ variants |
| src/routes/store.routes.ts | จับ URL ข้อมูลรวมและคำสั่งเขียน แล้วส่งให้ services |
| src/services/store.service.ts | อ่านข้อมูลรวมและ View; JOIN รายการซื้อ; ประกอบ items/payments/shipments เข้าแต่ละ order |
| src/services/product-write.service.ts | validate สินค้า/variants; INSERT/UPDATE/DELETE ภายใน transaction; ตรวจสต็อกเปลี่ยนระหว่างแก้ |
| src/services/checkout.service.ts | validate ที่อยู่/วิธีจ่าย/รายการ แล้ว CALL sp_checkout_order; ใช้ customer_id=1 |
| src/services/shipments.service.ts | ตรวจออเดอร์เปิดอยู่และเลื่อนสถานะได้ทีละขั้น แล้ว UPDATE |
| src/services/reviews.service.ts | ตรวจซื้อและ completed ก่อนรีวิว; เพิ่ม/แก้/ลบสำหรับ customer_id=1 |
| src/lib/db.ts | อ่าน DATABASE_URL สร้าง pg Pool ร่วม max 10 connections |
| src/lib/transaction.ts | ยืม client เดียว BEGIN → action → COMMIT; error → ROLLBACK; release เสมอ |
| src/lib/validation.ts | id/text/number ตรวจข้อมูล; fail สร้าง error พร้อม HTTP status |
| scripts/init-database.mjs | อ่าน SQL สามไฟล์แล้วรัน schema → logic → data ใน transaction เดียว; หยุดถ้าฐานมีตารางแล้ว |
| tests/api.test.ts | ชุดทดสอบ API |
| tests/database.test.ts | ทดสอบ transaction, stock และ logic กับฐานทดสอบแยก |
| package.json | dependencies และคำสั่งรัน backend |
| tsconfig.json | การ compile TypeScript ฝั่ง backend |
| README.md | เอกสาร backend |

Express Router เหมือนจุดจับคู่ “วิธี HTTP + เส้นทาง” กับฟังก์ชัน Controller ในส่วนอ่านสินค้ารับ/ส่ง HTTP ส่วน Service ทำงานด้านข้อมูล ใน store.routes.ts หลาย route เรียก Service โดยตรง ไม่ได้มี Controller แยกทุกตัว

### อ่าน SQL สำหรับสินค้าแบบทีละส่วน

ตัวอย่างจาก `products.query.ts` ย่อบางคอลัมน์:

```sql
SELECT p.product_id::text AS "product_id",
       p.product_name AS name,
       v.stock_quantity AS "stock_quantity"
FROM products p
LEFT JOIN product_variants v USING(product_id)
WHERE ($1::bigint IS NULL OR p.product_id=$1::bigint)
ORDER BY p.product_id,v.variant_id;
```

- `p` และ `v` คือชื่อย่อของตาราง
- `SELECT` เลือกช่องที่จะส่งกลับ
- `::text` แปลง ID เป็นข้อความ; bigint อาจใหญ่เกินช่วงจำนวนเต็มที่ JavaScript เก็บแม่นยำ
- `AS "product_id"` เปลี่ยนชื่อช่องผลลัพธ์ ไม่เปลี่ยนชื่อคอลัมน์จริง
- `LEFT JOIN` เก็บสินค้าฝั่งซ้ายไว้แม้ไม่มี variant
- `USING(product_id)` จับคู่คอลัมน์ชื่อเดียวกัน
- `$1` รับค่าจาก array argument ของ query ไม่ใช่การต่อข้อความจากผู้ใช้
- ถ้า `$1` เป็น NULL อ่านทั้งหมด ถ้ามี id อ่านเฉพาะสินค้า
- `ORDER BY` เรียงผลลัพธ์

สินค้า 1 ตัวมี 2 variants จะได้ 2 แถว SQL Backend จึงใช้ Map แยก products ให้เหลือสินค้าเดียว พร้อม variants สองรายการ แล้วเว็บจึงแสดงหนึ่งการ์ด

## 9. ไล่โค้ดเพิ่มสินค้า ตั้งแต่กดจนบันทึก

### 9.1 ฟอร์มรับค่าจากผู้ใช้

ตัวอย่างจริงรูปแบบใน `product-form.tsx`:

```tsx
const { data, save_product } = useStore();
const [busy, set_busy] = useState(false);

<input
  value={form.name}
  onChange={(e) => set_form({ ...form, name: e.target.value })}
/>
```

`useStore()` ดึงข้อมูลและฟังก์ชันจาก Provider; `value` ทำให้ข้อความในช่องตาม state; `onChange` ทำงานเมื่อพิมพ์; `e.target.value` คือข้อความใหม่; `...form` คัดลอกช่องอื่นแล้วแทนเฉพาะ name การพิมพ์ยังไม่ INSERT ฐานข้อมูล

### 9.2 กด Save

`submit(e)` เรียก `e.preventDefault()` เพื่อไม่ให้ browser submit แบบ reload ทั้งหน้า จากนั้นตรวจชื่อ ร้าน หมวด ราคา SKU และสต็อก ถ้าผิดใส่ `errors` แล้วหยุด ถ้าถูกตั้ง busy แล้ว:

```tsx
await save_product({ ...form, name: form.name.trim() }, product?.product_id);
```

`trim()` ตัดช่องว่างหัวท้าย; `product?.product_id` มีค่าเมื่อแก้สินค้าเดิม ถ้าสร้างใหม่เป็น undefined; `await` รอสำเร็จก่อนปิดฟอร์ม; catch แสดง error; finally ปลด busy

### 9.3 Context เลือก HTTP method

```ts
await mutate(
  "/products" + (id ? "/" + id : ""),
  id ? "PUT" : "POST",
  input,
);
```

เครื่องหมาย `condition ? a : b` คือถ้าเงื่อนไขจริงใช้ a ไม่จริงใช้ b ดังนั้นไม่มี id จะ POST `/products`; มี id จะ PUT `/products/เลขนั้น`

### 9.4 api.ts ส่งข้อมูล

```ts
const response = await fetch(base + path, {
  method,
  cache: "no-store",
  headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
  signal: AbortSignal.timeout(15000),
});
```

`fetch` ส่ง HTTP; `base + path` ประกอบ URL; `JSON.stringify` แปลง object เป็นข้อความ JSON; header บอกชนิดข้อมูล; `cache: no-store` ไม่ใช้ cache สำหรับคำขอนี้; timeout จำกัดเวลารอ ไม่ใช่คำสั่งย้อน transaction ที่ server

`response.ok` ตรวจ HTTP สำเร็จ; `response.json()` อ่าน JSON เป็น object; 204 ไม่มี body จึงคืน undefined การเขียน `<T>` เป็น generic บอก TypeScript ว่าคาดผลลัพธ์แบบไหน ไม่ได้ตรวจ JSON อัตโนมัติ

### 9.5 Express รับคำขอ

```ts
store_router.post("/products", async (req, res) => {
  res.status(201).json(await product_writes.save_product(req.body));
});
```

`req.body` มาจาก JSON ที่ express.json แปลงให้; `201` หมายถึงสร้างสำเร็จ; `res.json` ส่งคำตอบกลับ ฟังก์ชันชื่อ save_product ใน backend เป็นคนละฟังก์ชันกับชื่อเดียวกันใน Context

### 9.6 เขียนฐานข้อมูล

SQL ใน `product-write.service.ts`:

```sql
INSERT INTO products(product_name,description,merchant_id,category_id,status)
VALUES($1,$2,$3,$4,$5)
RETURNING product_id;
```

ค่าถูกส่งเป็น array `[name, description, merchant, category, status]` โดยจับคู่ลำดับกับ `$1` ถึง `$5`; `RETURNING` ขอ ID ที่ PostgreSQL สร้าง เพื่อใช้ INSERT variants ต่อ ทุกคำสั่งอยู่ใน transaction เดียว ถ้า SKU ซ้ำแล้วบันทึก variant ไม่ได้ สินค้าหลักที่เพิ่งเพิ่มก็ถูก rollback

### 9.7 หน้าอื่นอัปเดต

เมื่อ API สำเร็จ mutate เรียก refresh อ่าน snapshot ใหม่ ทุก component ที่ใช้ Context เดียวกันจึงเห็นข้อมูลใหม่ โดยไม่ต้อง copy สต็อกไป Home และ Detail แยกกัน

## 10. แก้สต็อก ลบสินค้า และ checkout ต่างกันอย่างไร

การแก้ variant เดิมมีเงื่อนไข SQL:

```sql
WHERE variant_id=$1 AND product_id=$2 AND stock_quantity=$8
RETURNING variant_id
```

`$8` มาจาก original_stock_quantity ที่ฟอร์มจำตอนเปิด ถ้ามีคนซื้อระหว่างแก้ สต็อกจริงจะไม่เท่าเดิมและ UPDATE ไม่พบแถว API แจ้ง 409 เพื่อให้เปิดฟอร์มใหม่ ป้องกันเอาสต็อกเก่าทับยอดที่เพิ่งถูกซื้อ original_stock_quantity เป็นค่าคำขอ ไม่ใช่คอลัมน์ฐานข้อมูล

`DELETE FROM products WHERE product_id=$1` ลบเฉพาะสินค้านั้น แต่ต้องผ่าน FK; ต่างจาก `DELETE` ไม่มี WHERE ที่จะกระทบทุกแถว

Checkout มีลำดับ:

1. เว็บส่งที่อยู่ วิธีจ่าย coupon_code และตะกร้า variant_id/quantity
2. API ตรวจ request และกำหนดลูกค้าทดสอบหมายเลข 1
3. transaction.ts สั่ง BEGIN
4. checkout.service.ts เรียก `CALL sp_checkout_order(...)`
5. Procedure ตรวจลูกค้า สินค้า ร้าน หมวด และ variant ที่เปิดใช้งาน
6. ล็อก variants ด้วย `FOR UPDATE` ตามลำดับ ID ตรวจ stock และใช้ราคาฐานข้อมูล
7. คำนวณส่วนลด STUDENT10: ขั้นต่ำ 500 ลด 10% สูงสุด 200 และค่าส่ง 60/ฟรีตั้งแต่ 3,000
8. INSERT orders และ order_items ที่เก็บ unit_price
9. UPDATE stock_quantity และ INSERT shipments แยกร้าน พร้อม payments จำลอง
10. สำเร็จ COMMIT; error ROLLBACK ผ่าน transaction.ts
11. เว็บ refresh และล้างตะกร้าหลังคำขอสำเร็จ

ราคาจาก browser ใช้แสดงผล ไม่ใช่ยอดสุดท้ายที่เชื่อถือ การใส่ตะกร้ายังไม่ตัดสต็อก COD ก็ถูกตัดสต็อกเมื่อสร้างออเดอร์สำเร็จ แม้ยังไม่จ่ายเงิน

`BEGIN/COMMIT/ROLLBACK` ของระบบนี้อยู่ในตัวห่อฝั่ง Node.js; block `BEGIN ... END` ใน PL/pgSQL เป็นโครงบล็อกโปรแกรม ไม่ใช่คำสั่งเริ่ม transaction แบบเดียวกัน

Transaction ใช้ client เดียวตลอด ห้ามเอาแต่ละคำสั่งไปยิง pool คนละ connection แล้วหวังให้เป็น transaction เดียว `client.release()` คืน connection ให้ pool ไม่ได้ลบข้อมูล

## 11. Trigger และรายงาน

`shipments.service.ts` ยอมเลื่อน pending → processing → shipped → delivered ทีละขั้น เมื่อ shipped ต้องกรอก carrier/tracking ขณะอัปเดตเวลา shipped_at/delivered_at จะตั้งตามสถานะ

ใน `logic.sql`:

- `lock_shipment_order()` และ trigger ก่อน UPDATE ล็อก order แม่ เพื่อให้การส่งหลายพัสดุของออเดอร์เดียวไม่ชนกัน
- `update_order_when_delivered()` และ trigger หลัง UPDATE shipment_status ตรวจ `NEW.shipment_status` และ `NOT EXISTS` พัสดุที่ยังไม่ delivered
- เมื่อครบทุกพัสดุจะ UPDATE orders เป็น completed และเปลี่ยน COD ที่ pending เป็น paid

`NEW` คือแถวหลังแก้ไขที่ Trigger เห็น Trigger ทำงานใน PostgreSQL จึงทำงานแม้ UPDATE ผ่าน pgAdmin ไม่ต้องกดผ่านเว็บ แต่กฎลำดับสถานะบางส่วนอยู่ใน API การแก้ SQL ตรงอาจข้ามกฎระดับ API ได้

`vw_merchant_sales_summary` เป็น View: คำสั่ง SELECT ที่ตั้งชื่อไว้ ไม่ใช่ตารางเพิ่ม และเป็น View ปกติ ไม่ใช่ snapshot ถาวร

ส่วน `WITH` ใน View แบ่งการคำนวณเป็น CTE:

| ชื่อ | ทำอะไร |
|---|---|
| sales | รวมจำนวน/ยอดขายตาม order ร้าน หมวด สินค้า ยกเว้น cancelled |
| category_order | ยุบรวมต่อหมวดภายในแต่ละ order/ร้าน |
| freight | รวมค่าส่งต่อ order/ร้าน |
| allocated | แบ่งค่าส่งตามจำนวนชิ้นของแต่ละหมวด คำนวณเป็นสตางค์ |
| totals | จัดเศษสตางค์ให้ยอดรวมไม่หาย |
| ranked | จัดสินค้าขายดีต่อร้าน/หมวดด้วย row_number |

ต้องรวมข้อมูลก่อน JOIN เพื่อลดปัญหายอดถูกคูณจากหลาย order_items × หลาย payments × หลาย shipments

หน้า `reports.tsx` ใช้ gross_sales, shipping_fees, best_product_name ฯลฯ จาก View ส่วนส่วนลดรวมอ่านจาก orders ยอดนี้รวม unpaid COD จึงไม่ใช่ยอดเงินที่รับจริงทั้งหมด

## 12. SQL แต่ละไฟล์และศัพท์ที่เจอ

| ไฟล์ | หน้าที่ |
|---|---|
| database/schema.sql | CREATE TABLE 10 ตาราง, constraints และ indexes |
| database/data.sql | seed ข้อมูลสมมติด้วย INSERT/SELECT และตั้งชื่อร้าน หมวด สินค้าให้สัมพันธ์กัน |
| database/logic.sql | Procedure, trigger functions, triggers และ reporting view |
| database/queries.sql | 10 คำถาม SQL สำหรับงาน ไม่ถูกหน้าเว็บเรียกรันทั้งไฟล์ทุกครั้ง |
| database/migrations/001_spread_sample_categories.sql | สคริปต์ปรับการกระจายหมวดของข้อมูลตัวอย่างเดิม |
| database/migrations/002_name_sample_catalog.sql | สคริปต์ตั้งชื่อข้อมูลตัวอย่างให้อ่านง่าย |
| database/migrations/003_theme_sample_merchants.sql | ปรับธีมร้านและหมวด/สินค้าให้สัมพันธ์กันในข้อมูลเดิม |
| database/README.md | คำแนะนำไฟล์ SQL |

Migration เป็นคำสั่งเปลี่ยนฐานที่มีอยู่แล้ว การมีไฟล์ไม่ได้หมายความว่าระบบรันให้อัตโนมัติ และไม่ควรเปิดรัน migration เก่าทุกครั้งที่เปิดเว็บ

| คำสั่ง/ชนิด | ความหมาย |
|---|---|
| CREATE TABLE | สร้างโครงตาราง |
| PRIMARY KEY | ตัวระบุแถว ไม่ซ้ำและไม่ NULL |
| GENERATED ALWAYS AS IDENTITY | PostgreSQL สร้างเลข ID ให้ ไม่จำเป็นต้องต่อเนื่องไร้ช่องว่าง |
| REFERENCES | FK ต้องอ้างแถวที่มีจริง |
| ON DELETE RESTRICT | ปฏิเสธลบแถวแม่ที่ยังมีแถวอ้าง |
| ON DELETE CASCADE | ลบแถวลูกตามเมื่อแถวแม่ถูกลบสำเร็จ |
| NOT NULL | ห้ามไม่มีค่า แต่ข้อความว่างยังต้อง CHECK เพิ่ม |
| UNIQUE(a,b) | ห้ามคู่ a,b ซ้ำ ไม่ได้บังคับ a เดี่ยว ๆ ไม่ซ้ำ |
| CHECK | เงื่อนไขค่าที่ฐานต้องยอมรับ เช่น stock >= 0 |
| DEFAULT | ค่าเริ่มต้นเมื่อ INSERT ไม่ส่งค่านั้น |
| bigint / integer / smallint | จำนวนเต็มคนละช่วงขนาด |
| numeric(12,2) | จำนวนฐานสิบรวม 12 หลัก ทศนิยม 2 หลัก |
| varchar(n) / text | ข้อความจำกัดความยาว / ไม่กำหนดเพดานแบบ varchar(n) |
| boolean | true/false |
| timestamptz / now() | เวลาแบบรองรับเขตเวลา / เวลาปัจจุบันของ transaction |
| INSERT / SELECT / UPDATE / DELETE | เพิ่ม / อ่าน / แก้ / ลบแถว |
| WHERE | กรองแถวก่อนประมวลผลขั้นรวมกลุ่ม |
| JOIN / LEFT JOIN | เชื่อมแถวที่ตรงกัน / คงฝั่งซ้ายแม้ไม่พบคู่ |
| GROUP BY | รวมเป็นกลุ่ม |
| HAVING | กรองกลุ่มหลังคำนวณ เช่น SUM(quantity) >= 20 |
| SUM / AVG / COUNT | ผลรวม / เฉลี่ย / จำนวน |
| EXISTS / NOT EXISTS | มี/ไม่มีแถวที่เข้าเงื่อนไข |
| COALESCE(a,b) | ถ้า a เป็น NULL ใช้ b |
| CASE WHEN | เลือกค่าตามเงื่อนไข |
| WITH | ตั้งชื่อผลย่อย CTE ภายในคำสั่ง |
| OVER / PARTITION BY | คำนวณแบบ window และแบ่งกลุ่มหน้าต่าง |
| DENSE_RANK / ROW_NUMBER | อันดับเสมอได้ไม่เว้นเลข / เลขลำดับแถว |
| CREATE INDEX | สร้างดัชนีช่วยค้น/เชื่อมในกรณีที่ planner เลือกใช้ มีต้นทุนเมื่อเขียนข้อมูล |
| FOR UPDATE | ล็อกแถวสำหรับการเปลี่ยนแปลงพร้อมกัน |
| CALL | เรียก Procedure |
| RAISE EXCEPTION | โยนข้อผิดพลาดจาก PL/pgSQL |
| jsonb_to_recordset | แปลง array JSON เป็นแถวเพื่ออ่านใน SQL |
| generate_series | สร้างลำดับสำหรับ seed |
| \|\| / lpad | ต่อข้อความ / เติมตัวอักษรด้านซ้าย |

10 queries ในไฟล์เรียงดังนี้: (1) รายละเอียดออเดอร์กับลูกค้า/สินค้า/ร้าน—จริง ๆ JOIN 6 ตาราง แม้ comment เดิมเขียน 5 (2) รีวิว+ลูกค้า+สินค้า (3) ร้านขายอย่างน้อย 20 ชิ้น (4) หมวดยอดขายอย่างน้อย 10,000 (5) สินค้าเฉลี่ยดาวตั้งแต่ 4 (6) variant ราคาเหนือค่าเฉลี่ย (7) สินค้าที่ไม่มี active variant เหลือ (8) ลูกค้าเคยซื้อ completed (9) อันดับสินค้าต่อร้าน (10) ยอดขายสะสมตามวัน

## 13. อ่าน JavaScript/TypeScript/React ให้รู้เรื่อง

| รูปแบบ | ความหมายในไฟล์นี้ |
|---|---|
| import / export | นำของจากอีกไฟล์มาใช้ / เปิดให้ไฟล์อื่นนำไปใช้ |
| @/ | alias ไป src/ ตาม tsconfig ไม่ใช่ชื่อแพ็กเกจ |
| import type | นำชนิดข้อมูลมาใช้ตอนตรวจ TypeScript |
| const / let | ตัวแปรที่ไม่เปลี่ยน binding / เปลี่ยน binding ได้ |
| async / await | ฟังก์ชันทำงานแบบ Promise / รอผลโดยไม่บล็อกทั้งเซิร์ฟเวอร์ |
| return | ส่งค่ากลับและจบฟังก์ชัน |
| throw / try / catch / finally | โยน error / ลองทำ / รับ error / ทำส่วนท้ายเสมอ |
| interface / type | รูปร่างข้อมูลหรือชุดชนิดข้อมูล ไม่ใช่ข้อมูลจริง |
| x?: string | property/argument ไม่จำเป็นต้องมี |
| object?.field | อ่าน field ถ้า object มีค่า มิฉะนั้น undefined |
| a ?? b | ใช้ b เฉพาะเมื่อ a เป็น null/undefined; 0 ยังเป็นค่าที่ใช้ได้ |
| ...object | คัดลอกสมาชิกแบบตื้น หรือรับส่วนที่เหลือ ขึ้นกับตำแหน่ง |
| === / !== | เท่ากัน / ไม่เท่ากันโดยตรวจชนิดด้วย |
| && / \|\| / ! | และ / หรือ / กลับค่าความจริง |
| map | แปลงแต่ละสมาชิก เช่น สินค้าเป็นการ์ด |
| filter | คัดหลายสมาชิกที่เข้าเงื่อนไข |
| find | หาสมาชิกแรกที่ตรง |
| some | มีอย่างน้อยหนึ่งสมาชิกที่ตรงหรือไม่ |
| reduce | รวมสมาชิกเป็นค่าเดียว เช่นยอดขายหรือสต็อก |
| useState | เก็บค่า UI และสั่งแสดงผลใหม่ด้วย setter |
| useEffect | ทำงานเสริมหลัง render เช่นโหลดข้อมูล ตั้ง timer และ cleanup |
| useRef | กล่องเก็บค่าข้าม render เปลี่ยนค่าแล้วไม่สั่ง render เอง |
| createContext / useContext | สร้างช่องแชร์ค่า / อ่านค่าจาก Provider ที่ครอบอยู่ |
| props | ข้อมูลที่ component แม่ส่งให้ลูก |
| children | เนื้อหาที่ถูกครอบอยู่ภายใน component |
| onClick / onChange / onSubmit | ฟังก์ชันที่เรียกเมื่อคลิก / เปลี่ยนช่อง / ส่งฟอร์ม |
| className | class CSS ใน JSX |
| {expression} ใน JSX | แทรกค่าหรือผลคำนวณลง UI |
| key ใน map | ตัวระบุรายการให้ React จับคู่แถวเมื่อรายการเปลี่ยน |
| "use client" | ขอบเขต component ที่ใช้ state/events/browser APIs ได้ ไม่ได้หมายถึงฐานข้อมูลอยู่ฝั่ง client |

ตัวอย่างจริงจาก inventory:

```ts
variants.some((v) => v.status === "active" && v.stock_quantity > 0)
```

แปลว่า “มีอย่างน้อยหนึ่งตัวเลือกที่เปิดขายและสต็อกมากกว่า 0 หรือไม่” ถ้ามีให้แสดง In Stock หากทุกตัวหมดหรือ inactive จะไม่พร้อมขาย ส่วน total_stock ใน helper รวมทุก variant จึงอาจต่างจากสต็อกที่ขายได้เมื่อมีตัว inactive

ตัวอย่างฟังก์ชัน `money(value)` ใน utils ใช้ Intl.NumberFormat จัดรูปเลขเป็น THB เปลี่ยนแค่ข้อความแสดงผล ไม่แก้ราคาฐานข้อมูล

## 14. ไฟล์ตั้งค่า เอกสาร และไฟล์ที่สร้างอัตโนมัติ

| ไฟล์/โฟลเดอร์ | หน้าที่ |
|---|---|
| package.json ที่ root | scripts/dev/build/lint และ dependencies ของ frontend |
| package-lock.json ทั้งสองตำแหน่ง | ล็อกเวอร์ชันแพ็กเกจให้ติดตั้งซ้ำได้สอดคล้องกัน |
| tsconfig.json ที่ root | ตั้งค่า TypeScript และ alias |
| next.config.ts | ตั้งค่า Next.js |
| next-env.d.ts | type declarations ที่ Next สร้างให้ |
| postcss.config.mjs | ตั้ง PostCSS/Tailwind ประมวล CSS |
| eslint.config.mjs | กฎตรวจโค้ด |
| .gitignore | ไฟล์ที่ไม่เก็บเข้า Git เช่นผล build และ secrets ตามรายการในไฟล์ |
| public/ | ไฟล์ static เช่น favicon และ SVG; ไม่ใช่ข้อมูลตารางสินค้า |
| node_modules/ | โค้ดแพ็กเกจที่ npm ติดตั้ง ไม่ใช่ที่แก้ฟีเจอร์ของเรา |
| .next/ | ผล build/cache ของ Next |
| backend/dist/ | JavaScript ที่ compile จาก TypeScript backend |
| *.tsbuildinfo | cache สำหรับตรวจ/compile TypeScript |
| scripts/verify.cjs | ทดสอบหน้าเว็บผ่าน Playwright |
| scripts/verify-inventory.cjs | ทดสอบสต็อกสัมพันธ์กันระหว่างหน้า/แท็บ |
| qa/ | หลักฐานและบันทึกผลทดสอบ |
| tmp/ และภาพ qa-design-*.png | ไฟล์ชั่วคราว/ภาพตรวจ ไม่ได้เป็น database |
| AGENTS.md / CLAUDE.md | คำแนะนำสำหรับผู้ช่วยพัฒนา ไม่ถูกเว็บเรียกเป็น business logic |
| README.md | วิธีติดตั้ง เปิดระบบ และข้อจำกัด |
| docs/PROJECT_STRUCTURE.md | แผนที่ไฟล์ฉบับสั้น |
| docs/BACKEND_LESSONS.md | บทฝึก backend |
| docs/DATABASE_INTEGRATION.md | เอกสารการเชื่อมฐาน |
| docs/PRACTICE_WORKBOOK.md | แบบฝึก SQL/API |
| docs/SAMPLE_CATALOG.md | อธิบายธีมข้อมูลตัวอย่างร้าน/หมวด/สินค้า |

## 15. จะปรับอะไรต้องไปตรงไหน

| อยากปรับ | เริ่มอ่าน/แก้ |
|---|---|
| สี ฟอนต์ ระยะห่าง | globals.css |
| ข้อความและแบนเนอร์หน้าแรก | products/catalog.tsx |
| รูปแบบการ์ดสินค้า | products/product-card.tsx |
| ฟิลเตอร์ร้านในหน้า merchant | merchant-products.tsx / merchant-orders.tsx |
| ช่องกรอกสินค้า | product-form.tsx / variant-editor.tsx |
| Validation ให้ชื่อสั้น/ยาวได้เท่าไร | ฟอร์ม + product-write.service.ts + schema ให้สอดคล้องกัน |
| SQL อ่านสินค้า | backend/src/queries/products.query.ts |
| เพิ่ม field ที่ API ส่ง | SQL/mapper ฝั่ง backend → type ฝั่งเว็บ → component; เพิ่มคอลัมน์เฉพาะเมื่อแบบฐานรองรับ |
| เส้นทาง API ใหม่ | routes แล้ว service ที่รับผิดชอบงานนั้น |
| รหัส/host เชื่อมฐาน | backend/.env; ตรวจ compose.yaml ให้ตรง |
| กฎส่วนลดจริง | database/logic.sql แล้วนำคำสั่งใหม่ไปใช้ในฐาน; ปรับข้อความ/ยอดคาดการณ์หน้า checkout ให้ตรง |
| กฎค่าส่งจริง | logic.sql; utils.ts เป็นส่วนคำนวณแสดงผลต้องสอดคล้อง |
| การเลื่อนสถานะพัสดุ | shipments.service.ts และ shipment-actions.tsx |
| ออเดอร์ completed อัตโนมัติ | trigger function ใน logic.sql |
| ตัวเลขรายงาน | View ใน logic.sql → mapper/type → reports.tsx |

เปลี่ยนข้อความ UI ไม่ต้องแก้ SQL เปลี่ยนการแสดงเงินไม่ต้องเปลี่ยน numeric แต่ถ้าจะเพิ่มคอลัมน์ ต้องแก้ฐานที่รันอยู่ด้วย ไม่ใช่แก้ schema.sql อย่างเดียว

## 16. ฝึกตามทีละรอบ

### รอบ A: ตามข้อมูลแบบอ่านอย่างเดียว

1. เปิด schema.sql ดู product_name และ stock_quantity ว่าอยู่คนละตาราง
2. เปิด pgAdmin Query Tool ของ fulfillment รัน:

```sql
SELECT p.product_id,p.product_name,m.merchant_name,c.category_name,
       v.variant_id,v.sku,v.price,v.stock_quantity
FROM products p
JOIN merchants m USING(merchant_id)
JOIN categories c USING(category_id)
LEFT JOIN product_variants v USING(product_id)
ORDER BY p.product_id,v.variant_id
LIMIT 20;
```

3. เปิดเว็บ F12 → Network → เลือก request `store` → Response หา product_id เดียวกัน
4. เปิด products.query.ts ดูว่า product_name แปลงเป็น name อย่างไร
5. เปิด product-card.tsx หา `{product.name}` เห็นปลายทางแสดงค่าจากข้อ 2

### รอบ B: ตามการเขียน

ในฐานฝึกหรือใช้สินค้าใหม่ที่ตั้งชื่อชัดว่าเป็นรายการฝึก เปิด merchant Products → Add product → กรอก variant และ SKU ไม่ซ้ำ ดู Network ว่าเป็น POST /api/products แล้วตรวจแถวใหม่ใน pgAdmin

แก้ราคาเดิม ดูคำขอ PUT และตรวจว่า product_id เดิมยังอยู่ จากนั้นลบเฉพาะสินค้าฝึกที่ยังไม่เคยขาย ดู DELETE และการตอบ 204 อย่าใช้สินค้าที่เป็นประวัติส่งงานมาทดลองลบ

### รอบ C: เข้าใจ transaction

อ่าน checkout.service.ts → transaction.ts → logic.sql ตามลำดับ ลองอธิบายว่าถ้า INSERT payment ผิดพลาดหลังตัดสต็อก ทำไมสต็อกจึงกลับค่าเดิม คำตอบคือทุกคำสั่งยังอยู่ใน transaction เดียวและ catch สั่ง ROLLBACK

### รอบ D: ฝึกแก้ API แบบไม่เปลี่ยน schema

ทดลองในสำเนาโค้ด/ฐานฝึก: เพิ่มข้อมูลคำนวณจากคอลัมน์เดิม เช่นจำนวน variants ต่อสินค้า ต้องกำหนดก่อนว่าจะคำนวณใน SELECT หรือ mapper แล้วปรับ type ให้ตรงและแสดงผลใน component อย่าส่ง password_hash ให้ browser เพื่อทดลอง API

หลังแก้ frontend รัน `npm.cmd run typecheck` และ `npm.cmd run lint`; แก้ backend รัน `npm.cmd --prefix backend run typecheck` และชุดทดสอบที่เกี่ยวข้อง จากนั้นดู Network และผล SQL จริง

## 17. คำสั่งเปิดระบบแปลว่าอะไร

จากโฟลเดอร์ root ของโปรเจกต์:

```powershell
npm.cmd run db:start
```

เรียก script db:start ใน package.json ซึ่งสั่ง Docker Compose เปิด PostgreSQL ต้องเปิด Docker Desktop ก่อน

```powershell
npm.cmd run dev:api
```

เปิด backend ผ่าน script ของ backend; tsx watch รัน TypeScript และเริ่มใหม่เมื่อไฟล์เปลี่ยน ต้องเปิด terminal นี้ค้างไว้

อีก terminal:

```powershell
npm.cmd run dev
```

เปิด Next.js สำหรับพัฒนา แล้วเข้า http://localhost:3000 ใช้ npm.cmd เพื่อเรียก npm ผ่าน Windows command wrapper แทน npm.ps1 ที่อาจถูก Execution Policy ปิด

`npm install` ติดตั้งแพ็กเกจ; `npm run build` เตรียมผล build; `npm --prefix backend ...` ให้ npm ทำงานกับ package.json ใน backend; `db:init` สร้างฐานเริ่มต้นในฐานว่าง ไม่ใช่คำสั่งเปิดระบบทุกวัน

เมื่ออ่านคู่มือนี้แล้วควรตอบได้ว่า: ผู้ใช้กดอะไร → component ไหนรับ → Context เรียกฟังก์ชันอะไร → HTTP method/URL ไหน → service ไหนตรวจ → SQL แตะตารางไหน → ผลลัพธ์กลับมาแสดงตรงไหน ใช้เส้นทางนี้อธิบายได้ทุกฟีเจอร์หลักของโปรเจกต์
