import { get_pool } from "./db.js";
import type { PoolClient } from "pg";
export async function transaction<T>(
  action: (client: PoolClient) => Promise<T>,
  read_only = false,
): Promise<T> {
  const client = await get_pool().connect();
  try {
    await client.query(
      read_only ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN",
    );
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
