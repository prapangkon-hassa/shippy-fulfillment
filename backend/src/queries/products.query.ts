export const inventory_query = `
 SELECT p.product_id::text AS "product_id",p.merchant_id::text AS "merchant_id",
 p.category_id::text AS "category_id",p.product_name AS name,coalesce(p.description,'') description,
 (p.status='active') active,v.variant_id::text AS "variant_id",v.variant_name AS "variant_name",
 v.sku,v.price,v.stock_quantity AS "stock_quantity",v.status AS "variant_status"
 FROM products p LEFT JOIN product_variants v USING(product_id)
 WHERE ($1::bigint IS NULL OR p.product_id=$1::bigint)
 ORDER BY p.product_id,v.variant_id`;
