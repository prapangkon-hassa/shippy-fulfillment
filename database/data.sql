-- Synthetic classroom data, never real customer information. Run once after logic.sql.
INSERT INTO merchants(merchant_name,email,phone)
SELECT 'merchant '||n,'merchant'||n||'@example.test','020000'||lpad(n::text,4,'0') FROM generate_series(1,20) n;
INSERT INTO categories(category_name) SELECT 'category '||n FROM generate_series(1,20) n;
INSERT INTO customers(full_name,email,phone,password_hash)
SELECT CASE WHEN n=1 THEN 'Demo customer' ELSE 'customer '||n END,
 'customer'||n||'@example.test','080'||lpad(n::text,7,'0'),
 '!disabled-demo-account' FROM generate_series(1,500) n;
-- Passwords are disabled, not plaintext; local classroom mode has no login.
INSERT INTO products(merchant_id,category_id,product_name,description)
-- Create 25 products per merchant, then apply the themed catalog below.
SELECT (n-1)%20+1,((n-1)%20+(n-1)/20)%20+1,'product '||lpad(n::text,3,'0'),
 'Sample product for Database Systems. Record '||n FROM generate_series(1,500) n;
-- Classroom sample catalog: merchant themes, related categories and product names.
-- Explicit sample-data correction: category reports and joined historical names follow it.
-- Run in a transaction. Never changes product ownership, inventory, price or order rows.
WITH shops(merchant_id,merchant_name,category_ids) AS (VALUES
 (1,'มุมแฟชั่น',ARRAY[1,2,3]),
 (2,'สปอร์ตแวร์',ARRAY[1,2,16]),
 (3,'กระเป๋าพาเที่ยว',ARRAY[3,17]),
 (4,'เครื่องประดับและเวลา',ARRAY[4,5]),
 (5,'โมบายพลัส',ARRAY[6,8]),
 (6,'คอมพิวเตอร์โซน',ARRAY[7,8]),
 (7,'โลกเสียงเพลง',ARRAY[8,6]),
 (8,'เครื่องใช้ไฟฟ้าในบ้าน',ARRAY[9,10]),
 (9,'บ้านเป็นระเบียบ',ARRAY[10,12]),
 (10,'ครัวพร้อมใช้',ARRAY[11,9]),
 (11,'แต่งบ้านสบาย',ARRAY[12,13,10]),
 (12,'หลับสบาย',ARRAY[13,12]),
 (13,'มุมเครื่องเขียน',ARRAY[14,15]),
 (14,'บ้านหนังสือ',ARRAY[15,14]),
 (15,'เพื่อนนักกีฬา',ARRAY[16,2]),
 (16,'พร้อมเดินทาง',ARRAY[17,3]),
 (17,'โลกของเล่น',ARRAY[18]),
 (18,'เพื่อนสัตว์เลี้ยง',ARRAY[19]),
 (19,'สวนหลังบ้าน',ARRAY[20]),
 (20,'โฮมออฟฟิศ',ARRAY[7,12,14])
)
UPDATE merchants m SET merchant_name=s.merchant_name
FROM shops s WHERE m.merchant_id=s.merchant_id
 AND m.email='merchant'||m.merchant_id||'@example.test'
 AND m.merchant_name='merchant '||m.merchant_id;

WITH labels(category_id,category_name,product_names) AS (VALUES
 (1,'เสื้อผ้า',ARRAY['เสื้อยืดคอกลม','เสื้อโปโล','เสื้อเชิ้ตแขนยาว','กางเกงขายาว','เสื้อคลุม']),
 (2,'รองเท้า',ARRAY['รองเท้าผ้าใบ','รองเท้าแตะ','รองเท้าวิ่ง','รองเท้าหนัง','รองเท้าสวม']),
 (3,'กระเป๋า',ARRAY['กระเป๋าสะพาย','กระเป๋าเป้','กระเป๋าสตางค์','กระเป๋าผ้า','กระเป๋าเดินทาง']),
 (4,'เครื่องประดับ',ARRAY['สร้อยคอ','สร้อยข้อมือ','ต่างหู','แหวน','เข็มกลัด']),
 (5,'นาฬิกา',ARRAY['นาฬิกาข้อมือดิจิทัล','นาฬิกาข้อมือสายหนัง','นาฬิกาข้อมือสายเหล็ก','นาฬิกาตั้งโต๊ะ','นาฬิกาแขวน']),
 (6,'อุปกรณ์มือถือ',ARRAY['เคสโทรศัพท์','สายชาร์จ USB-C','แท่นวางโทรศัพท์','ฟิล์มกันรอย','หัวชาร์จ']),
 (7,'อุปกรณ์คอมพิวเตอร์',ARRAY['คีย์บอร์ด','เมาส์ไร้สาย','แผ่นรองเมาส์','ขาตั้งโน้ตบุ๊ก','USB Hub']),
 (8,'เครื่องเสียง',ARRAY['หูฟังไร้สาย','ลำโพงบลูทูธ','หูฟังครอบหู','ไมโครโฟน','ลำโพงคอมพิวเตอร์']),
 (9,'เครื่องใช้ไฟฟ้า',ARRAY['พัดลมตั้งโต๊ะ','กาต้มน้ำไฟฟ้า','เตารีด','เครื่องปิ้งขนมปัง','เครื่องดูดฝุ่น']),
 (10,'ของใช้ในบ้าน',ARRAY['กล่องเก็บของ','ตะกร้าผ้า','ไม้แขวนเสื้อ','ถังขยะ','พรมเช็ดเท้า']),
 (11,'เครื่องครัว',ARRAY['กระทะ','หม้อสแตนเลส','เขียง','ชุดช้อนส้อม','แก้วน้ำ']),
 (12,'เฟอร์นิเจอร์',ARRAY['โต๊ะทำงาน','เก้าอี้ทำงาน','ชั้นวางของ','โต๊ะข้างเตียง','ตู้รองเท้า']),
 (13,'เครื่องนอน',ARRAY['หมอนหนุน','ผ้าห่ม','ชุดผ้าปูที่นอน','ปลอกหมอน','หมอนข้าง']),
 (14,'เครื่องเขียน',ARRAY['สมุดบันทึก','ปากกาลูกลื่น','ดินสอ','แฟ้มเอกสาร','ชุดปากกาไฮไลต์']),
 (15,'หนังสือ',ARRAY['หนังสือพื้นฐาน SQL','หนังสือฝึกภาษาอังกฤษ','หนังสือทำอาหาร','หนังสือวาดภาพ','หนังสือการจัดการเวลา']),
 (16,'อุปกรณ์กีฬา',ARRAY['เสื่อโยคะ','ดัมเบล','เชือกกระโดด','ลูกฟุตบอล','ไม้แบดมินตัน']),
 (17,'อุปกรณ์เดินทาง',ARRAY['หมอนรองคอ','ขวดแบ่งของเหลว','ป้ายชื่อกระเป๋า','ถุงจัดระเบียบสัมภาระ','ผ้าปิดตา']),
 (18,'ของเล่น',ARRAY['ตัวต่อ','รถของเล่น','ตุ๊กตาผ้า','จิ๊กซอว์','เกมกระดาน']),
 (19,'ของใช้สัตว์เลี้ยง',ARRAY['ชามอาหารสัตว์เลี้ยง','สายจูง','ที่นอนสัตว์เลี้ยง','แปรงขน','ของเล่นสัตว์เลี้ยง']),
 (20,'อุปกรณ์ทำสวน',ARRAY['กระถางต้นไม้','บัวรดน้ำ','พลั่วปลูกต้นไม้','กรรไกรตัดกิ่ง','ถุงมือทำสวน'])
)
UPDATE categories c SET category_name=l.category_name
FROM labels l WHERE c.category_id=l.category_id AND c.category_name='category '||c.category_id;

WITH shops(merchant_id,merchant_name,category_ids) AS (VALUES
 (1,'มุมแฟชั่น',ARRAY[1,2,3]),
 (2,'สปอร์ตแวร์',ARRAY[1,2,16]),
 (3,'กระเป๋าพาเที่ยว',ARRAY[3,17]),
 (4,'เครื่องประดับและเวลา',ARRAY[4,5]),
 (5,'โมบายพลัส',ARRAY[6,8]),
 (6,'คอมพิวเตอร์โซน',ARRAY[7,8]),
 (7,'โลกเสียงเพลง',ARRAY[8,6]),
 (8,'เครื่องใช้ไฟฟ้าในบ้าน',ARRAY[9,10]),
 (9,'บ้านเป็นระเบียบ',ARRAY[10,12]),
 (10,'ครัวพร้อมใช้',ARRAY[11,9]),
 (11,'แต่งบ้านสบาย',ARRAY[12,13,10]),
 (12,'หลับสบาย',ARRAY[13,12]),
 (13,'มุมเครื่องเขียน',ARRAY[14,15]),
 (14,'บ้านหนังสือ',ARRAY[15,14]),
 (15,'เพื่อนนักกีฬา',ARRAY[16,2]),
 (16,'พร้อมเดินทาง',ARRAY[17,3]),
 (17,'โลกของเล่น',ARRAY[18]),
 (18,'เพื่อนสัตว์เลี้ยง',ARRAY[19]),
 (19,'สวนหลังบ้าน',ARRAY[20]),
 (20,'โฮมออฟฟิศ',ARRAY[7,12,14])
), labels(category_id,category_name,product_names) AS (VALUES
 (1,'เสื้อผ้า',ARRAY['เสื้อยืดคอกลม','เสื้อโปโล','เสื้อเชิ้ตแขนยาว','กางเกงขายาว','เสื้อคลุม']),
 (2,'รองเท้า',ARRAY['รองเท้าผ้าใบ','รองเท้าแตะ','รองเท้าวิ่ง','รองเท้าหนัง','รองเท้าสวม']),
 (3,'กระเป๋า',ARRAY['กระเป๋าสะพาย','กระเป๋าเป้','กระเป๋าสตางค์','กระเป๋าผ้า','กระเป๋าเดินทาง']),
 (4,'เครื่องประดับ',ARRAY['สร้อยคอ','สร้อยข้อมือ','ต่างหู','แหวน','เข็มกลัด']),
 (5,'นาฬิกา',ARRAY['นาฬิกาข้อมือดิจิทัล','นาฬิกาข้อมือสายหนัง','นาฬิกาข้อมือสายเหล็ก','นาฬิกาตั้งโต๊ะ','นาฬิกาแขวน']),
 (6,'อุปกรณ์มือถือ',ARRAY['เคสโทรศัพท์','สายชาร์จ USB-C','แท่นวางโทรศัพท์','ฟิล์มกันรอย','หัวชาร์จ']),
 (7,'อุปกรณ์คอมพิวเตอร์',ARRAY['คีย์บอร์ด','เมาส์ไร้สาย','แผ่นรองเมาส์','ขาตั้งโน้ตบุ๊ก','USB Hub']),
 (8,'เครื่องเสียง',ARRAY['หูฟังไร้สาย','ลำโพงบลูทูธ','หูฟังครอบหู','ไมโครโฟน','ลำโพงคอมพิวเตอร์']),
 (9,'เครื่องใช้ไฟฟ้า',ARRAY['พัดลมตั้งโต๊ะ','กาต้มน้ำไฟฟ้า','เตารีด','เครื่องปิ้งขนมปัง','เครื่องดูดฝุ่น']),
 (10,'ของใช้ในบ้าน',ARRAY['กล่องเก็บของ','ตะกร้าผ้า','ไม้แขวนเสื้อ','ถังขยะ','พรมเช็ดเท้า']),
 (11,'เครื่องครัว',ARRAY['กระทะ','หม้อสแตนเลส','เขียง','ชุดช้อนส้อม','แก้วน้ำ']),
 (12,'เฟอร์นิเจอร์',ARRAY['โต๊ะทำงาน','เก้าอี้ทำงาน','ชั้นวางของ','โต๊ะข้างเตียง','ตู้รองเท้า']),
 (13,'เครื่องนอน',ARRAY['หมอนหนุน','ผ้าห่ม','ชุดผ้าปูที่นอน','ปลอกหมอน','หมอนข้าง']),
 (14,'เครื่องเขียน',ARRAY['สมุดบันทึก','ปากกาลูกลื่น','ดินสอ','แฟ้มเอกสาร','ชุดปากกาไฮไลต์']),
 (15,'หนังสือ',ARRAY['หนังสือพื้นฐาน SQL','หนังสือฝึกภาษาอังกฤษ','หนังสือทำอาหาร','หนังสือวาดภาพ','หนังสือการจัดการเวลา']),
 (16,'อุปกรณ์กีฬา',ARRAY['เสื่อโยคะ','ดัมเบล','เชือกกระโดด','ลูกฟุตบอล','ไม้แบดมินตัน']),
 (17,'อุปกรณ์เดินทาง',ARRAY['หมอนรองคอ','ขวดแบ่งของเหลว','ป้ายชื่อกระเป๋า','ถุงจัดระเบียบสัมภาระ','ผ้าปิดตา']),
 (18,'ของเล่น',ARRAY['ตัวต่อ','รถของเล่น','ตุ๊กตาผ้า','จิ๊กซอว์','เกมกระดาน']),
 (19,'ของใช้สัตว์เลี้ยง',ARRAY['ชามอาหารสัตว์เลี้ยง','สายจูง','ที่นอนสัตว์เลี้ยง','แปรงขน','ของเล่นสัตว์เลี้ยง']),
 (20,'อุปกรณ์ทำสวน',ARRAY['กระถางต้นไม้','บัวรดน้ำ','พลั่วปลูกต้นไม้','กรรไกรตัดกิ่ง','ถุงมือทำสวน'])
), samples AS (
 SELECT p.product_id,p.merchant_id,s.merchant_name,s.category_ids,
 (p.product_id-1)/20 AS n,cardinality(s.category_ids) AS category_count
 FROM products p JOIN shops s USING(merchant_id)
 WHERE p.product_id BETWEEN 1 AND 500
 AND p.merchant_id=(p.product_id-1)%20+1
 AND (
  (p.product_name='product '||lpad(p.product_id::text,3,'0')
   AND p.description='Sample product for Database Systems. Record '||p.product_id)
  OR (p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
   AND EXISTS (SELECT 1 FROM labels old,unnest(old.product_names) AS names(name)
    WHERE p.product_name LIKE names.name||' รุ่น %'))
 )
), planned AS (
 SELECT s.*,s.category_ids[(s.n%s.category_count+1)::integer] AS new_category_id
 FROM samples s
)
UPDATE products p
SET category_id=l.category_id,
 product_name=(CASE
 WHEN s.merchant_id=10 AND l.category_id=9 THEN ARRAY['กาต้มน้ำไฟฟ้า','เครื่องปิ้งขนมปัง','หม้อหุงข้าว','เครื่องปั่นอาหาร','เตาไฟฟ้า']
 WHEN s.merchant_id IN (2,15) AND l.category_id=2 THEN ARRAY['รองเท้าวิ่ง','รองเท้าฟุตบอล','รองเท้าบาสเกตบอล','รองเท้าแบดมินตัน','รองเท้าเทรนนิ่ง']
 WHEN s.merchant_id=2 AND l.category_id=1 THEN ARRAY['เสื้อกีฬา','กางเกงกีฬา','เสื้อวิ่ง','เสื้อวอร์ม','กางเกงวอร์ม']
 WHEN s.merchant_id=12 AND l.category_id=12 THEN ARRAY['เตียงนอน','โต๊ะข้างเตียง','ตู้เสื้อผ้า','โต๊ะเครื่องแป้ง','ม้านั่งปลายเตียง']
 WHEN s.merchant_id=20 AND l.category_id=12 THEN ARRAY['โต๊ะทำงาน','เก้าอี้ทำงาน','ชั้นวางเอกสาร','ตู้เอกสาร','โต๊ะประชุม']
 ELSE l.product_names END)[((s.n/s.category_count)%5+1)::integer]||' รุ่น '||lpad((s.n/(s.category_count*5)+1)::text,2,'0'),
 description='สินค้าตัวอย่างในหมวด'||l.category_name||' สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
FROM planned s JOIN labels l ON l.category_id=s.new_category_id
WHERE p.product_id=s.product_id;

INSERT INTO product_variants(product_id,sku,variant_name,price,stock_quantity)
SELECT p.product_id,'SKU-'||p.product_id||'-'||n,CASE WHEN n=1 THEN 'Standard' ELSE 'Large' END,
 100+(p.product_id%30)*25+n*10,100 FROM products p CROSS JOIN generate_series(1,2) n ORDER BY p.product_id,n;
DO $$
DECLARE n integer; oid bigint; a bigint; b bigint;
BEGIN
 FOR n IN 1..500 LOOP
  a := (n-1)*2+1; b := (n%500)*2+1;
  CALL sp_checkout_order(n,jsonb_build_array(jsonb_build_object('variant_id',a,'quantity',1),
   jsonb_build_object('variant_id',b,'quantity',2)), 'customer '||n,'0800000000',
   n||' University Road, Bangkok 10110','QR Payment','',oid);
  UPDATE orders SET order_date=now()-(n%90)*interval '1 day' WHERE order_id=oid;
  UPDATE shipments SET shipment_status='delivered',carrier='Demo Carrier',
   tracking_number='SEED-'||shipment_id,shipped_at=now()-interval '1 hour',delivered_at=now() WHERE order_id=oid;
 END LOOP;
END $$;
INSERT INTO reviews(customer_id,product_id,rating,review_text)
SELECT n,n,3+n%3,'Sample review '||n FROM generate_series(1,500) n;
-- Retry attempts demonstrate orders 1:N payments without duplicating sales.
INSERT INTO payments(order_id,payment_method,payment_status,amount,transaction_ref)
SELECT order_id,payment_method,'failed',amount,'SEED-FAILED-'||order_id FROM payments WHERE order_id<=20;


-- Existing sample products only: three sold-out products and one sold-out option.
-- Apply after data.sql so seeded checkout orders can finish normally.
UPDATE product_variants v SET stock_quantity=0
FROM products p
WHERE p.product_id=v.product_id
  AND p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
  AND v.sku='SKU-'||p.product_id||'-'||CASE WHEN v.variant_name='Standard' THEN '1' ELSE '2' END
  AND (p.product_id IN (2,5,8) OR (p.product_id=3 AND v.variant_name='Standard'));

-- Low stock on existing sample products, after seeded orders are created.
UPDATE product_variants v SET stock_quantity=CASE WHEN v.variant_name='Standard' THEN 1 ELSE 2 END
FROM products p WHERE p.product_id=v.product_id AND p.product_id IN (4,6)
AND p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
AND v.variant_name IN ('Standard','Large')
AND v.sku='SKU-'||p.product_id||'-'||CASE WHEN v.variant_name='Standard' THEN '1' ELSE '2' END;

-- Additional existing sample products: 3 sold out and 3 low stock.
UPDATE product_variants v
SET stock_quantity=CASE
 WHEN p.product_id IN (10,14,18) THEN 0
 WHEN p.product_id=11 THEN CASE WHEN v.variant_name='Standard' THEN 2 ELSE 3 END
 WHEN p.product_id=16 THEN CASE WHEN v.variant_name='Standard' THEN 4 ELSE 6 END
 ELSE CASE WHEN v.variant_name='Standard' THEN 1 ELSE 1 END END
FROM products p WHERE p.product_id=v.product_id
AND p.product_id IN (10,11,14,16,18,20)
AND p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
AND v.variant_name IN ('Standard','Large')
AND v.sku='SKU-'||p.product_id||'-'||CASE WHEN v.variant_name='Standard' THEN '1' ELSE '2' END;

-- Extend existing catalog to 550 products. Re-running at 550 is a no-op.
-- New models have distinct names, descriptions, prices, SKUs and stock.
DO $$
DECLARE current_count integer; n integer; source record; new_id bigint;
BEGIN
 LOCK TABLE products, product_variants IN SHARE ROW EXCLUSIVE MODE;
 SELECT count(*) INTO current_count FROM products;
 IF current_count > 550 OR current_count < 500 THEN
  RAISE EXCEPTION 'Expected 500..550 existing products, found %',current_count;
 END IF;
 FOR n IN 1..(550-current_count) LOOP
  SELECT p.*,v.price INTO STRICT source FROM products p
  JOIN LATERAL (SELECT price FROM product_variants WHERE product_id=p.product_id ORDER BY variant_id LIMIT 1) v ON true
  WHERE p.product_id=n;
  INSERT INTO products(merchant_id,category_id,product_name,description)
  VALUES(source.merchant_id,source.category_id,
   regexp_replace(source.product_name,' รุ่น .*$','')||' รุ่นพิเศษ '||(current_count+n),
   'สินค้าจำลองรุ่นพิเศษ '||(current_count+n)||' สำหรับเลือกซื้อและทดสอบการจัดส่ง มีตัวเลือก 2 แบบ ราคาและจำนวนคงเหลือแยกตามแบบ')
  RETURNING product_id INTO new_id;
  INSERT INTO product_variants(product_id,sku,variant_name,price,stock_quantity)
  VALUES(new_id,'SKU-'||new_id||'-1','Standard',source.price+25+n*3,15+n%30),
        (new_id,'SKU-'||new_id||'-2','Large',source.price+55+n*3,12+n%20);
 END LOOP;
END $$;
