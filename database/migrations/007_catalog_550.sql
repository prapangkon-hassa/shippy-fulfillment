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
