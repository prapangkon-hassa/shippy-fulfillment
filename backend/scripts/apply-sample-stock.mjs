import "dotenv/config";
import { Pool } from "pg";
import { readFile, writeFile } from "node:fs/promises";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const c = await pool.connect();
try {
  await c.query("BEGIN");
  const before = await c.query("SELECT variant_id, product_id, stock_quantity FROM product_variants WHERE product_id IN (2,3,5,8) ORDER BY variant_id FOR UPDATE");
  const count = await c.query("SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM product_variants) variants");
  await writeFile(new URL("../../tmp/stock-before-" + Date.now() + ".json", import.meta.url), JSON.stringify(before.rows,null,2));
  const result = await c.query(await readFile(new URL("../../database/migrations/004_sample_stock_states.sql", import.meta.url),"utf8"));
  const after = await c.query("SELECT p.product_id,p.product_name,v.variant_name,v.stock_quantity FROM products p JOIN product_variants v USING(product_id) WHERE product_id IN (2,3,5,8) ORDER BY product_id,variant_id");
  const counts = await c.query("SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM product_variants) variants");
  if (JSON.stringify(count.rows)!==JSON.stringify(counts.rows)) throw new Error("Unexpected row-count change");
  await c.query("COMMIT");
  console.log(JSON.stringify({updated:result.rowCount,counts:counts.rows,products:after.rows},null,2));
} catch(e) { await c.query("ROLLBACK"); console.error(e.message); process.exitCode=1; }
finally { c.release(); await pool.end(); }
