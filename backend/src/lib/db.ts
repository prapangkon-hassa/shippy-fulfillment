import "dotenv/config";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | undefined;

// ใช้ pool เดียวร่วมกันทั้ง backend เปิดการเชื่อมต่อเมื่อเริ่ม query
export function get_pool() {
  if (process.env.ENABLE_DATABASE !== "true") {
    throw Object.assign(
      new Error("Database is not enabled. Follow docs/BACKEND_LESSONS.md."),
      { status: 503 },
    );
  }
  const connection_string = process.env.DATABASE_URL;
  if (!connection_string || connection_string.includes("YOUR_")) {
    throw Object.assign(
      new Error("Configure DATABASE_URL in backend/.env first."),
      { status: 503 },
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString: connection_string,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 15000,
    });
    if (process.env.VERCEL) attachDatabasePool(pool);
    pool.on("error", (error) =>
      console.error("Idle database connection failed:", error.name),
    );
  }
  return pool;
}

export async function disconnect_database() {
  await pool?.end();
  pool = undefined;
}
