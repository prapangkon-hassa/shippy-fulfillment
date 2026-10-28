-- Existing sample products only: three sold-out products and one sold-out option.
-- Apply after data.sql so seeded checkout orders can finish normally.
UPDATE product_variants v SET stock_quantity=0
FROM products p
WHERE p.product_id=v.product_id
  AND p.description LIKE 'สินค้าตัวอย่างในหมวด% สำหรับฝึกระบบสั่งซื้อและจัดส่ง'
  AND v.sku='SKU-'||p.product_id||'-'||CASE WHEN v.variant_name='Standard' THEN '1' ELSE '2' END
  AND (p.product_id IN (2,5,8) OR (p.product_id=3 AND v.variant_name='Standard'));
