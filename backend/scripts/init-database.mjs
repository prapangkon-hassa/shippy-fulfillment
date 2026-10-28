import "dotenv/config";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
const connection_string = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connection_string) throw new Error("Set DIRECT_DATABASE_URL or DATABASE_URL first.");
const pool = new Pool({ connectionString: connection_string });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const result = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );
  if (result.rowCount)
    throw new Error(
      "Database is not empty. Existing data preserved; initialization stopped.",
    );
  for (const name of ["schema.sql", "logic.sql", "data.sql"]) {
    await client.query(
      await readFile(
        new URL("../../database/" + name, import.meta.url),
        "utf8",
      ),
    );
    console.log("Applied " + name);
  }
  await client.query("COMMIT");
  console.log(
    "Database initialized: 10 tables, procedure, triggers, view and sample records.",
  );
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
