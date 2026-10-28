-- Low stock on existing sample products, after seeded orders are created.
UPDATE product_variants v SET stock_quantity=CASE WHEN v.variant_name='Standard' THEN 1 ELSE 2 END
FROM products p WHERE p.product_id=v.product_id AND p.product_id IN (4,6)
AND p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
AND v.variant_name IN ('Standard','Large')
AND v.sku='SKU-'||p.product_id||'-'||CASE WHEN v.variant_name='Standard' THEN '1' ELSE '2' END;
