-- Preserve existing tracking references. Fill only missing shipping metadata.
CREATE UNIQUE INDEX IF NOT EXISTS ux_shipments_order_merchant ON shipments(order_id,merchant_id);
UPDATE shipments SET
 carrier=coalesce(nullif(btrim(carrier),''),'Shippy Demo'),
 tracking_number=coalesce(nullif(btrim(tracking_number),''),'SHP-'||order_id||'-'||merchant_id)
WHERE nullif(btrim(carrier),'') IS NULL OR nullif(btrim(tracking_number),'') IS NULL;
