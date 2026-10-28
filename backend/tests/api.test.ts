import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { create_app } from "../src/app.js";
import { Pool } from "pg";
import { get_inventory } from "../src/services/products.service.js";
import { disconnect_database } from "../src/lib/db.js";

test("API runs without connecting to a database; product endpoints explicitly report disabled DB", async () => {
  process.env.ENABLE_DATABASE = "false";
  const server = create_app().listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const health = await fetch(base + "/api/health", {
      headers: { Origin: "http://localhost:3000" },
    });
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: "ok",
      database_enabled: false,
    });
    assert.equal(
      health.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    for (const path of ["/api/products", "/api/products/1"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /Database is not enabled/);
    }
    assert.equal((await fetch(base + "/missing")).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("inventory keeps zero stock, converts numeric prices, groups products and binds IDs separately", async (t) => {
  const previous_url = process.env.DATABASE_URL;
  const previous_enabled = process.env.ENABLE_DATABASE;
  process.env.ENABLE_DATABASE = "true";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  const product = {
    product_id: "p1",
    merchant_id: "m1",
    category_id: "electronics",
    name: "Test",
    description: "",
    active: true,
  };
  const id = "p1' OR 1=1 --";
  // Replace only the driver call: this test never connects to PostgreSQL.
  t.mock.method(
    Pool.prototype,
    "query",
    async (sql: string, parameters: unknown[]) => {
      assert(!sql.includes(id));
      assert.deepEqual(parameters, [id]);
      return {
        rows: [
          {
            ...product,
            variant_id: "v1",
            variant_name: "Black",
            variant_status: "active",
            sku: "A",
            price: "990.50",
            stock_quantity: 0,
          },
          {
            ...product,
            variant_id: "v2",
            variant_name: "White",
            variant_status: "active",
            sku: "B",
            price: "1000.00",
            stock_quantity: 2,
          },
          {
            ...product,
            product_id: "p2",
            variant_id: null,
            variant_name: null,
            variant_status: null,
            sku: null,
            price: null,
            stock_quantity: null,
          },
        ],
      };
    },
  );
  try {
    const inventory = await get_inventory(id);
    assert.equal(inventory.products.length, 2);
    assert.equal(inventory.variants.length, 2);
    assert.equal(inventory.variants[0].stock_quantity, 0);
    assert.equal(inventory.variants[0].price, 990.5);
    assert.equal(inventory.variants[1].stock_quantity, 2);
    assert(!("variant_id" in inventory.products[0]));
  } finally {
    await disconnect_database();
    if (previous_url === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous_url;
    if (previous_enabled === undefined) delete process.env.ENABLE_DATABASE;
    else process.env.ENABLE_DATABASE = previous_enabled;
  }
});
