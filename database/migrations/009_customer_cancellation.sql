
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
