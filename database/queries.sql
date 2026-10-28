-- 1 JOIN (5 tables): order detail and merchant.
SELECT o.order_id,c.full_name,p.product_name,m.merchant_name,i.quantity,i.unit_price
FROM orders o JOIN customers c USING(customer_id) JOIN order_items i USING(order_id)
JOIN product_variants v USING(variant_id) JOIN products p USING(product_id) JOIN merchants m USING(merchant_id);

-- 2 JOIN (3 tables): reviews with customer and product.
SELECT c.full_name,p.product_name,r.rating,r.review_text FROM reviews r
JOIN customers c USING(customer_id) JOIN products p USING(product_id);

-- 3 GROUP BY + HAVING: merchants with at least 20 units sold.
SELECT p.merchant_id,sum(i.quantity) units FROM order_items i JOIN product_variants v USING(variant_id)
JOIN products p USING(product_id) JOIN orders o USING(order_id) WHERE o.order_status<>'cancelled'
GROUP BY p.merchant_id HAVING sum(i.quantity)>=20;

-- 4 GROUP BY + HAVING: categories with at least 10000 THB gross revenue.
SELECT p.category_id,sum(i.quantity*i.unit_price) revenue FROM order_items i
JOIN product_variants v USING(variant_id) JOIN products p USING(product_id) JOIN orders o USING(order_id)
WHERE o.order_status<>'cancelled' GROUP BY p.category_id HAVING sum(i.quantity*i.unit_price)>=10000;

-- 5 GROUP BY + HAVING: products rated at least 4 on average.
SELECT product_id,avg(rating) average_rating,count(*) reviews FROM reviews
GROUP BY product_id HAVING avg(rating)>=4;

-- 6 Subquery: variants priced above the average variant price.
SELECT variant_id,sku,price FROM product_variants WHERE price>(SELECT avg(price) FROM product_variants);

-- 7 Correlated subquery: products with no stock in ANY active variant.
SELECT p.product_id,p.product_name FROM products p WHERE NOT EXISTS
(SELECT 1 FROM product_variants v WHERE v.product_id=p.product_id AND v.status='active' AND v.stock_quantity>0);

-- 8 Correlated subquery: customers with a completed purchase, never counting payment retries.
SELECT c.customer_id,c.full_name FROM customers c WHERE EXISTS
(SELECT 1 FROM orders o WHERE o.customer_id=c.customer_id AND o.order_status='completed');

-- 9 Window: product rank by units sold within each merchant.
SELECT p.merchant_id,p.product_id,sum(i.quantity) units,
DENSE_RANK() OVER(PARTITION BY p.merchant_id ORDER BY sum(i.quantity) DESC) sales_rank
FROM order_items i JOIN product_variants v USING(variant_id) JOIN products p USING(product_id)
JOIN orders o USING(order_id) WHERE o.order_status<>'cancelled' GROUP BY p.merchant_id,p.product_id;

-- 10 Window: running daily gross revenue (shipping and discounts excluded).
WITH daily AS (SELECT o.order_date::date AS sale_date,sum(i.quantity*i.unit_price) revenue
FROM orders o JOIN order_items i USING(order_id) WHERE o.order_status<>'cancelled' GROUP BY o.order_date::date)
SELECT sale_date,revenue,sum(revenue) OVER(ORDER BY sale_date ROWS UNBOUNDED PRECEDING) cumulative_revenue FROM daily ORDER BY sale_date;

