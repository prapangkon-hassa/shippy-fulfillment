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
