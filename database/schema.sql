-- PostgreSQL: run once in an EMPTY database. Never drops existing data.
CREATE TABLE merchants (
 merchant_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 merchant_name varchar(150) NOT NULL CHECK (btrim(merchant_name) <> ''),
 email varchar(255) NOT NULL UNIQUE, phone varchar(20),
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE categories (
 category_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 category_name varchar(100) NOT NULL UNIQUE,
 is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE customers (
 customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 full_name varchar(150) NOT NULL, email varchar(255) NOT NULL UNIQUE,
 phone varchar(20), password_hash varchar(255) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE products (
 product_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 merchant_id bigint NOT NULL REFERENCES merchants ON DELETE RESTRICT,
 category_id integer NOT NULL REFERENCES categories ON DELETE RESTRICT,
 product_name varchar(150) NOT NULL CHECK (btrim(product_name) <> ''), description text,
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE product_variants (
 variant_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_id bigint NOT NULL REFERENCES products ON DELETE CASCADE,
 sku varchar(60) NOT NULL UNIQUE CHECK (btrim(sku) <> ''),
 variant_name varchar(100) NOT NULL CHECK (btrim(variant_name) <> ''),
 price numeric(12,2) NOT NULL CHECK (price >= 0),
 stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
);
CREATE TABLE orders (
 order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 customer_id bigint NOT NULL REFERENCES customers ON DELETE RESTRICT,
 order_date timestamptz NOT NULL DEFAULT now(),
 order_status varchar(20) NOT NULL DEFAULT 'pending'
  CHECK (order_status IN ('pending','paid','processing','shipped','completed','cancelled')),
 discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
 shipping_name varchar(150) NOT NULL, shipping_phone varchar(20) NOT NULL,
 shipping_address varchar(500) NOT NULL
);
CREATE TABLE order_items (
 order_item_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id bigint NOT NULL REFERENCES orders ON DELETE CASCADE,
 variant_id bigint NOT NULL REFERENCES product_variants ON DELETE RESTRICT,
 quantity integer NOT NULL CHECK (quantity > 0),
 unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
 UNIQUE(order_id,variant_id)
);
CREATE TABLE payments (
 payment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id bigint NOT NULL REFERENCES orders ON DELETE RESTRICT,
 payment_method varchar(30) NOT NULL CHECK (payment_method IN ('QR Payment','Credit/Debit Card','Cash on Delivery')),
 payment_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
 amount numeric(12,2) NOT NULL CHECK (amount >= 0), transaction_ref varchar(100) UNIQUE,
 paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((payment_status = 'paid' AND paid_at IS NOT NULL) OR payment_status <> 'paid')
);
CREATE TABLE shipments (
 shipment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id bigint NOT NULL REFERENCES orders ON DELETE RESTRICT,
 merchant_id bigint NOT NULL REFERENCES merchants ON DELETE RESTRICT,
 carrier varchar(100), tracking_number varchar(100) UNIQUE,
 shipment_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (shipment_status IN ('pending','processing','shipped','delivered')),
 shipping_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
 shipped_at timestamptz, delivered_at timestamptz,
 CHECK (shipment_status NOT IN ('shipped','delivered') OR (shipped_at IS NOT NULL AND carrier IS NOT NULL AND tracking_number IS NOT NULL)),
 CHECK (shipment_status <> 'delivered' OR delivered_at IS NOT NULL),
 CHECK (delivered_at IS NULL OR delivered_at >= shipped_at)
);
CREATE TABLE reviews (
 review_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 customer_id bigint NOT NULL REFERENCES customers ON DELETE RESTRICT,
 product_id bigint NOT NULL REFERENCES products ON DELETE CASCADE,
 rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
 review_text varchar(1000), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(customer_id,product_id)
);
CREATE INDEX ix_products_merchant_id ON products(merchant_id);
CREATE INDEX ix_products_category_id ON products(category_id);
CREATE INDEX ix_variants_product_id ON product_variants(product_id);
CREATE INDEX ix_orders_customer_date ON orders(customer_id,order_date DESC);
CREATE INDEX ix_items_variant ON order_items(variant_id);
CREATE INDEX ix_payments_order ON payments(order_id);
CREATE INDEX ix_shipments_order ON shipments(order_id);
CREATE INDEX ix_shipments_merchant ON shipments(merchant_id);
CREATE INDEX ix_reviews_product ON reviews(product_id);

CREATE UNIQUE INDEX ux_shipments_order_merchant ON shipments(order_id,merchant_id);


ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_restored_units integer NOT NULL DEFAULT 0 CHECK(stock_restored_units>=0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS restored_quantity integer NOT NULL DEFAULT 0 CHECK(restored_quantity>=0 AND restored_quantity<=quantity);
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_shipment_status_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_shipment_status_check CHECK(shipment_status IN ('pending','processing','shipped','delivered','cancelled'));
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check CHECK(payment_status IN ('pending','paid','failed','refunded','void'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK(refunded_amount>=0 AND refunded_amount<=amount);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voided_at timestamptz;
