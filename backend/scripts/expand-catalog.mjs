import "dotenv/config";
import {Pool} from "pg";
import {readFile} from "node:fs/promises";
const pool=new Pool({connectionString:process.env.DATABASE_URL});
const c=await pool.connect();
try {
 await c.query("BEGIN");
 const before=(await c.query("SELECT count(*) FROM products")).rows[0].count;
 await c.query(await readFile(new URL("../../database/migrations/007_catalog_550.sql",import.meta.url),"utf8"));
 const counts=(await c.query("SELECT (SELECT count(*) FROM products) products, (SELECT count(*) FROM product_variants) variants")).rows[0];
 if(counts.products!=="550") throw Error("Unexpected product count");
 await c.query("COMMIT");
 console.log({before,...counts});
}catch(e){await c.query("ROLLBACK"); console.error(e.message);process.exitCode=1;}
finally{c.release();await pool.end();}
