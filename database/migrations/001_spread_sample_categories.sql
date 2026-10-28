-- One-time adjustment for the original sample products only.
-- Keeps merchant ownership, stock, prices and order lines unchanged.
-- Historical category reports follow the product's new category.
-- Run inside a transaction. The original-category guard makes reruns harmless.
UPDATE products AS p
SET category_id = ((p.product_id - 1) % 20 + (p.product_id - 1) / 20) % 20 + 1
WHERE p.product_id BETWEEN 1 AND 500
  AND p.product_name = 'product ' || lpad(p.product_id::text, 3, '0')
  AND p.description = 'Sample product for Database Systems. Record ' || p.product_id
  AND p.merchant_id = (p.product_id - 1) % 20 + 1
  AND p.category_id = (p.product_id - 1) % 20 + 1
  AND p.category_id <> ((p.product_id - 1) % 20 + (p.product_id - 1) / 20) % 20 + 1;
