-- CALL runs inside the API's BEGIN / COMMIT on ONE pg client.
-- Any error => API ROLLBACK: no partial order, payment, shipment or stock change.
CREATE OR REPLACE PROCEDURE sp_checkout_order(
 IN p_customer bigint, IN p_items jsonb, IN p_name text, IN p_phone text,
 IN p_address text, IN p_method text, IN p_coupon text, INOUT p_order_id bigint
)
LANGUAGE plpgsql AS $$
DECLARE r record; locked_variant record; subtotal numeric(12,2) := 0;
 discount numeric(12,2) := 0; shipping numeric(12,2); merchant_count integer;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id=p_customer AND status='active') THEN
  RAISE EXCEPTION 'customer not active'; END IF;
 IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'Cart must contain 1 to 100 items'; END IF;
 IF nullif(btrim(p_name),'') IS NULL OR nullif(btrim(p_phone),'') IS NULL OR nullif(btrim(p_address),'') IS NULL THEN
  RAISE EXCEPTION 'Shipping name, phone and address are required'; END IF;
 IF p_method IS NULL OR p_method NOT IN ('QR Payment','Credit/Debit Card','Cash on Delivery') THEN
  RAISE EXCEPTION 'Invalid payment method'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_items) AS x("variant_id" bigint,quantity integer)
  WHERE "variant_id" IS NULL OR quantity IS NULL OR quantity NOT BETWEEN 1 AND 10000)
  OR (SELECT count(*) <> count(DISTINCT "variant_id") FROM jsonb_to_recordset(p_items) AS x("variant_id" bigint)) THEN
  RAISE EXCEPTION 'Invalid quantities or duplicate variants'; END IF;
 -- Lock variants in a deterministic order so simultaneous purchases cannot oversell.
 FOR r IN SELECT * FROM jsonb_to_recordset(p_items) AS x("variant_id" bigint,quantity integer) ORDER BY "variant_id" LOOP
  SELECT pv.* INTO locked_variant FROM product_variants pv JOIN products p USING(product_id)
   JOIN merchants m USING(merchant_id) JOIN categories c USING(category_id)
   WHERE pv.variant_id=r."variant_id" AND pv.status='active' AND p.status='active' AND m.status='active' AND c.is_active
   FOR UPDATE OF pv;
  IF NOT FOUND THEN RAISE EXCEPTION 'Variant is unavailable'; END IF;
  IF locked_variant.stock_quantity < r.quantity THEN RAISE EXCEPTION 'Insufficient stock for SKU %',locked_variant.sku; END IF;
  subtotal := subtotal + locked_variant.price*r.quantity;
 END LOOP;
 -- Fixed classroom coupon rule; no extra coupon table in the 10-table schema.
 IF coalesce(p_coupon,'') <> '' THEN
  IF upper(btrim(p_coupon)) <> 'STUDENT10' OR subtotal < 500 THEN
   RAISE EXCEPTION 'STUDENT10 requires a subtotal of at least 500 THB'; END IF;
  discount := least(round(subtotal*0.10,2),200);
 END IF;
 shipping := CASE WHEN subtotal >= 3000 THEN 0 ELSE 60 END;
 INSERT INTO orders(customer_id,order_status,discount_amount,shipping_name,shipping_phone,shipping_address)
  VALUES(p_customer,CASE WHEN p_method='Cash on Delivery' THEN 'pending' ELSE 'paid' END,discount,p_name,p_phone,p_address)
  RETURNING order_id INTO p_order_id;
 INSERT INTO order_items(order_id,variant_id,quantity,unit_price)
  SELECT p_order_id,v.variant_id,x.quantity,v.price
  FROM jsonb_to_recordset(p_items) AS x("variant_id" bigint,quantity integer)
  JOIN product_variants v ON v.variant_id=x."variant_id";
 UPDATE product_variants v SET stock_quantity=v.stock_quantity-i.quantity
  FROM order_items i WHERE i.order_id=p_order_id AND i.variant_id=v.variant_id;
 SELECT count(DISTINCT p.merchant_id) INTO merchant_count FROM order_items i
  JOIN product_variants v USING(variant_id) JOIN products p USING(product_id) WHERE i.order_id=p_order_id;
 -- Split the 60 THB order shipping fee in cents, preserving the exact total.
 INSERT INTO shipments(order_id,merchant_id,carrier,tracking_number,shipping_cost)
 SELECT p_order_id,merchant_id,'Shippy Demo','SHP-'||p_order_id||'-'||merchant_id,
  (floor(shipping*100/merchant_count) + CASE WHEN row_number() OVER(ORDER BY merchant_id)<=mod(shipping*100,merchant_count) THEN 1 ELSE 0 END)/100
 FROM (SELECT DISTINCT p.merchant_id FROM order_items i JOIN product_variants v USING(variant_id)
  JOIN products p USING(product_id) WHERE i.order_id=p_order_id) merchants_in_order;
 -- Classroom payment simulation only: no charge to a bank or card.
 INSERT INTO payments(order_id,payment_method,payment_status,amount,transaction_ref,paid_at)
 VALUES(p_order_id,p_method,CASE WHEN p_method='Cash on Delivery' THEN 'pending' ELSE 'paid' END,
  subtotal-discount+shipping,'DEMO-'||p_order_id,
  CASE WHEN p_method='Cash on Delivery' THEN NULL ELSE now() END);
END $$;

-- Serialize deliveries for the same order, including updates made in pgAdmin.
CREATE OR REPLACE FUNCTION lock_shipment_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM orders WHERE order_id=NEW.order_id FOR UPDATE;
 RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER trg_lock_shipment_order BEFORE UPDATE ON shipments
 FOR EACH ROW EXECUTE FUNCTION lock_shipment_order();

CREATE OR REPLACE FUNCTION update_order_when_delivered() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.shipment_status='delivered' AND NOT EXISTS(
  SELECT 1 FROM shipments WHERE order_id=NEW.order_id AND shipment_status<>'delivered') THEN
  UPDATE orders SET order_status='completed' WHERE order_id=NEW.order_id AND order_status<>'cancelled';
  UPDATE payments SET payment_status='paid',paid_at=now()
   WHERE order_id=NEW.order_id AND payment_method='Cash on Delivery' AND payment_status='pending';
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER trg_update_shipment_on_item_delivered AFTER UPDATE OF shipment_status ON shipments
 FOR EACH ROW EXECUTE FUNCTION update_order_when_delivered();

-- Aggregate each fact first: joining payments/items/shipments directly multiplies money.
-- Gross product revenue (before discount); shipping allocated by category unit count.
CREATE OR REPLACE VIEW vw_merchant_sales_summary AS
WITH sales AS (
 SELECT o.order_id,p.merchant_id,p.category_id,p.product_id,p.product_name,
  sum(i.quantity)::bigint units,sum(i.quantity*i.unit_price) revenue
 FROM orders o JOIN order_items i USING(order_id) JOIN product_variants v USING(variant_id)
 JOIN products p USING(product_id) WHERE o.order_status<>'cancelled'
 GROUP BY o.order_id,p.merchant_id,p.category_id,p.product_id,p.product_name
), category_order AS (
 SELECT order_id,merchant_id,category_id,sum(units) units,sum(revenue) revenue
 FROM sales GROUP BY order_id,merchant_id,category_id
), freight AS (
 SELECT order_id,merchant_id,sum(shipping_cost) fee FROM shipments GROUP BY order_id,merchant_id
), allocated AS (
 SELECT c.*,floor(f.fee*100*c.units/sum(c.units) OVER(PARTITION BY c.order_id,c.merchant_id)) cents,
 f.fee,row_number() OVER(PARTITION BY c.order_id,c.merchant_id ORDER BY c.category_id) rn
 FROM category_order c JOIN freight f USING(order_id,merchant_id)
), totals AS (
 SELECT a.*, (cents+CASE WHEN rn=1 THEN fee*100-sum(cents) OVER(PARTITION BY order_id,merchant_id) ELSE 0 END)/100 shipping
 FROM allocated a
), ranked AS (
 SELECT merchant_id,category_id,product_id,product_name,sum(units) sold,
 row_number() OVER(PARTITION BY merchant_id,category_id ORDER BY sum(units) DESC,product_id) rank
 FROM sales GROUP BY merchant_id,category_id,product_id,product_name
)
SELECT t.merchant_id,m.merchant_name,t.category_id,c.category_name,
 count(*)::integer order_count,sum(t.units)::bigint units_sold,sum(t.revenue) gross_sales,
 sum(t.shipping) shipping_fees,r.product_id best_product_id,r.product_name best_product_name,r.sold best_product_units
FROM totals t JOIN merchants m USING(merchant_id) JOIN categories c USING(category_id)
 JOIN ranked r ON r.merchant_id=t.merchant_id AND r.category_id=t.category_id AND r.rank=1
GROUP BY t.merchant_id,m.merchant_name,t.category_id,c.category_name,r.product_id,r.product_name,r.sold;



-- Caller supplies the authenticated server-side customer identity, never a body customer_id.
-- The order lock also serializes cancellation with shipment updates and concurrent retries.
CREATE OR REPLACE PROCEDURE sp_cancel_order(IN p_order_id bigint, IN p_customer_id bigint, IN p_reason text)
LANGUAGE plpgsql AS $$
DECLARE target orders%ROWTYPE; item record; restored integer:=0;
BEGIN
 SELECT * INTO target FROM orders WHERE order_id=p_order_id FOR UPDATE;
 IF NOT FOUND OR target.customer_id<>p_customer_id THEN
  RAISE EXCEPTION 'ไม่พบคำสั่งซื้อในบัญชีของคุณ' USING ERRCODE='42501';
 END IF;
 IF target.order_status='cancelled' OR target.cancelled_at IS NOT NULL THEN RETURN; END IF;
 IF target.order_status IN ('shipped','completed') OR EXISTS(
  SELECT 1 FROM shipments WHERE order_id=p_order_id AND (shipment_status IN ('shipped','delivered') OR shipped_at IS NOT NULL OR delivered_at IS NOT NULL)) THEN
  RAISE EXCEPTION 'ไม่สามารถยกเลิกได้ เนื่องจากมีพัสดุที่จัดส่งแล้ว';
 END IF;
 IF nullif(btrim(p_reason),'') IS NULL OR length(p_reason)>500 THEN RAISE EXCEPTION 'กรุณาระบุเหตุผลไม่เกิน 500 ตัวอักษร'; END IF;
 -- Lock variants in the same order as checkout. Restore only quantities not restored earlier.
 FOR item IN SELECT i.variant_id,i.quantity-i.restored_quantity AS units FROM order_items i WHERE i.order_id=p_order_id ORDER BY i.variant_id LOOP
  PERFORM 1 FROM product_variants WHERE variant_id=item.variant_id FOR UPDATE;
  UPDATE product_variants SET stock_quantity=stock_quantity+item.units WHERE variant_id=item.variant_id;
  restored:=restored+item.units;
 END LOOP;
 UPDATE order_items SET restored_quantity=quantity WHERE order_id=p_order_id;
 UPDATE orders SET order_status='cancelled',cancelled_at=now(),cancelled_by='customer:'||p_customer_id,
  cancel_reason=btrim(p_reason),stock_restored_units=restored WHERE order_id=p_order_id;
 UPDATE shipments SET shipment_status='cancelled',cancelled_at=now() WHERE order_id=p_order_id;
 UPDATE payments SET payment_status='refunded',refunded_amount=amount,refunded_at=now()
  WHERE order_id=p_order_id AND payment_status='paid';
 UPDATE payments SET payment_status='void',voided_at=now() WHERE order_id=p_order_id AND payment_status='pending';
END $$;
