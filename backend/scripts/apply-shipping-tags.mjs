import "dotenv/config";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
 await client.query("BEGIN");
 await client.query(await readFile(new URL("../../database/logic.sql", import.meta.url),"utf8"));
 await client.query(await readFile(new URL("../../database/migrations/008_automatic_shipping_tags.sql", import.meta.url),"utf8"));
 await client.query("COMMIT");
 console.log("Automatic shipping tags enabled; missing tags backfilled and existing tracking references preserved.");
} catch(error) { await client.query("ROLLBACK"); console.error(error.message); process.exitCode=1; }
finally { client.release(); await pool.end(); }
