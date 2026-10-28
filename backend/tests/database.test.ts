import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { create_app } from "../src/app.js";
import { disconnect_database } from "../src/lib/db.js";

test("PostgreSQL integration: isolated disposable database", async (t) => {
  const original = process.env.DATABASE_URL;
  assert(original, "Configure backend/.env first");
  const admin = new Pool({ connectionString: original });
  const name = "fulfillment_test_" + Date.now();
  await admin.query(`CREATE DATABASE "${name}"`);
  const url = new URL(original);
  url.pathname = "/" + name;
  process.env.DATABASE_URL = url.toString();
  process.env.ENABLE_DATABASE = "true";
  const db = new Pool({ connectionString: url.toString() });
  const server = create_app().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  async function request(path: string, method = "GET", body?: unknown) {
    const r = await fetch(base + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: r.status === 204 ? null : await r.json() };
  }
  const input = (variants: string[], quantity = 1) => ({
    full_name: "Database Test",
    phone: "0800000000",
    address_line: "University Road",
    payment_method: "QR Payment",
    coupon_code: "",
    items: variants.map((variant_id) => ({ variant_id, quantity })),
  });
  try {
    for (const file of ["schema.sql", "logic.sql", "data.sql"])
      await db.query(
        await readFile(
          new URL("../../database/" + file, import.meta.url),
          "utf8",
        ),
      );
    await t.test(
      "10 tables, 500+ main rows, 20 supporting rows and 1:N payments",
      async () => {
        assert.equal(
          (
            await db.query(
              "SELECT count(*) FROM pg_tables WHERE schemaname='public'",
            )
          ).rows[0].count,
          "10",
        );
        for (const table of [
          "products",
          "product_variants",
          "customers",
          "orders",
          "order_items",
          "payments",
          "shipments",
          "reviews",
        ]) {
          assert(
            Number(
              (await db.query("SELECT count(*) FROM " + table)).rows[0].count,
            ) >= 500,
            table,
          );
        }
        for (const table of ["merchants", "categories"])
          assert.equal(
            (await db.query("SELECT count(*) FROM " + table)).rows[0].count,
            "20",
          );
        assert.equal(
          (await db.query("SELECT count(*) FROM payments WHERE order_id=1"))
            .rows[0].count,
          "2",
        );
        const store = await request("/store");
        assert.equal(store.status, 200);
        assert.equal(store.body.products.length, 550);
        assert.equal(
          store.body.orders.find((o: any) => o.order_id === "1").payments.length,
          2,
        );
        assert.equal(store.body.products[0].imageUrl, undefined);
      },
    );
    await t.test("all 10 complex queries execute", async () => {
      const results = await db.query(
        await readFile(
          new URL("../../database/queries.sql", import.meta.url),
          "utf8",
        ),
      );
      assert.equal((results as unknown as unknown[]).length, 10);
    });
    await t.test(
      "database constraints prevent invalid stock and duplicate review",
      async () => {
        await assert.rejects(
          db.query(
            "UPDATE product_variants SET stock_quantity=-1 WHERE variant_id=1",
          ),
          { code: "23514" },
        );
        await assert.rejects(
          db.query(
            "INSERT INTO reviews(customer_id,product_id,rating) VALUES(1,1,6)",
          ),
          { code: "23514" },
        );
        await assert.rejects(
          db.query(
            "INSERT INTO reviews(customer_id,product_id,rating) VALUES(1,1,5)",
          ),
          { code: "23505" },
        );
      },
    );
    await t.test(
      "invalid IDs, untrusted origins and malformed carts rejected",
      async () => {
        assert.equal((await request("/products/1%27%20OR%201=1")).status, 400);
        assert.equal(
          (
            await request("/orders/checkout", "POST", {
              ...input(["1"]),
              items: [{ variant_id: "1", quantity: 0 }],
            })
          ).status,
          400,
        );
        const r = await fetch(base + "/products", {
          method: "POST",
          headers: {
            Origin: "https://untrusted.example",
            "Content-Type": "application/json",
          },
          body: "{}",
        });
        assert.equal(r.status, 403);
      },
    );
    await t.test("sold-out variant rejects checkout without changing any transaction tables", async () => {
      const snapshot = async () => ({
        counts: (await db.query("SELECT (SELECT count(*) FROM orders) orders, (SELECT count(*) FROM order_items) items, (SELECT count(*) FROM payments) payments, (SELECT count(*) FROM shipments) shipments")).rows,
        stock: (await db.query("SELECT variant_id,stock_quantity FROM product_variants WHERE variant_id IN (1,3) ORDER BY variant_id")).rows,
      });
      await db.query("UPDATE product_variants SET stock_quantity=0 WHERE variant_id=3");
      const before = await snapshot();
      const result = await request("/orders/checkout", "POST", input(["1", "3"]));
      assert.equal(result.status, 409);
      assert.deepEqual(await snapshot(), before);
    });
    await t.test(
      "checkout shortage rolls back all stock and creates no order",
      async () => {
        const before = (
          await db.query(
            "SELECT stock_quantity FROM product_variants WHERE variant_id=1",
          )
        ).rows[0].stock_quantity;
        const orders = (await db.query("SELECT count(*) FROM orders")).rows[0]
          .count;
        const result = await request(
          "/orders/checkout",
          "POST",
          input(["1", "3"], 9999),
        );
        assert.equal(result.status, 409);
        assert.equal(
          (
            await db.query(
              "SELECT stock_quantity FROM product_variants WHERE variant_id=1",
            )
          ).rows[0].stock_quantity,
          before,
        );
        assert.equal(
          (await db.query("SELECT count(*) FROM orders")).rows[0].count,
          orders,
        );
      },
    );
    await t.test(
      "late payment failure rolls back inserted order/items/shipments and stock",
      async () => {
        const before = (
          await db.query(
            "SELECT stock_quantity FROM product_variants WHERE variant_id=1",
          )
        ).rows[0].stock_quantity;
        const count = (await db.query("SELECT count(*) FROM orders")).rows[0]
          .count;
        await db.query(
          "CREATE FUNCTION reject_payment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Simulated payment failure'; END $$; CREATE TRIGGER reject_payment BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION reject_payment();",
        );
        const r = await request("/orders/checkout", "POST", input(["1"]));
        assert.equal(r.status, 409);
        await db.query(
          "DROP TRIGGER reject_payment ON payments; DROP FUNCTION reject_payment();",
        );
        assert.equal(
          (
            await db.query(
              "SELECT stock_quantity FROM product_variants WHERE variant_id=1",
            )
          ).rows[0].stock_quantity,
          before,
        );
        assert.equal(
          (await db.query("SELECT count(*) FROM orders")).rows[0].count,
          count,
        );
      },
    );
    await t.test(
      "two simultaneous buyers cannot both buy the last unit",
      async () => {
        await db.query(
          "UPDATE product_variants SET stock_quantity=1 WHERE variant_id=2",
        );
        const results = await Promise.all([
          request("/orders/checkout", "POST", input(["2"])),
          request("/orders/checkout", "POST", input(["2"])),
        ]);
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
        assert.equal(
          (
            await db.query(
              "SELECT stock_quantity FROM product_variants WHERE variant_id=2",
            )
          ).rows[0].stock_quantity,
          0,
        );
      },
    );
    await t.test(
      "coupon calculated on server, no client totals trusted",
      async () => {
        await db.query("UPDATE product_variants SET stock_quantity=10 WHERE variant_id=21");
        const initial = (await db.query("SELECT stock_quantity FROM product_variants WHERE variant_id=21")).rows[0].stock_quantity;
        const r = await request("/orders/checkout", "POST", {
          ...input(["21"], 3),
          coupon_code: "STUDENT10",
          total_amount: 1,
        });
        assert.equal(r.status, 201);
        const o = (
          await db.query("SELECT * FROM orders WHERE order_id=$1", [
            r.body.order_id,
          ])
        ).rows[0];
        const p = (
          await db.query("SELECT amount FROM payments WHERE order_id=$1", [
            r.body.order_id,
          ])
        ).rows[0];
        const subtotal = Number(
          (
            await db.query(
              "SELECT sum(quantity*unit_price) amount FROM order_items WHERE order_id=$1",
              [r.body.order_id],
            )
          ).rows[0].amount,
        );
        assert.equal(Number(o.discount_amount), Math.min(subtotal * 0.1, 200));
        assert.equal(Number(p.amount), subtotal - Number(o.discount_amount) + (subtotal >= 3000 ? 0 : 60));
        assert.equal((await db.query("SELECT stock_quantity FROM product_variants WHERE variant_id=21")).rows[0].stock_quantity, initial - 3);
      },
    );
    await t.test("checkout groups same-merchant items under immutable tags; status-only updates isolate merchants", async () => {
      await db.query("UPDATE product_variants SET stock_quantity=10 WHERE variant_id IN (1,2,3)");
      const created = await request("/orders/checkout", "POST", input(["1", "2", "3"], 2));
      assert.equal(created.status, 201);
      const oid = created.body.order_id;
      const tags = (await db.query("SELECT * FROM shipments WHERE order_id=$1 ORDER BY merchant_id", [oid])).rows;
      assert.equal(tags.length, 2);
      assert.equal(new Set(tags.map((s) => s.tracking_number)).size, 2);
      for (const tag of tags) {
        assert.equal(tag.tracking_number, `SHP-${oid}-${tag.merchant_id}`);
        assert.equal(tag.carrier, "Shippy Demo");
        assert.equal(tag.shipment_status, "pending");
        assert.equal(tag.shipped_at, null);
      }
      const grouped = (await db.query(`SELECT s.shipment_id,count(*)::int lines,sum(i.quantity)::int units
        FROM shipments s JOIN order_items i USING(order_id) JOIN product_variants v USING(variant_id)
        JOIN products p ON p.product_id=v.product_id AND p.merchant_id=s.merchant_id
        WHERE s.order_id=$1 GROUP BY s.shipment_id ORDER BY s.shipment_id`, [oid])).rows;
      assert.deepEqual(grouped.map((g) => g.lines).sort(), [1,2]);
      assert.deepEqual(grouped.map((g) => g.units).sort(), [2,4]);
      const first = tags[0], second = tags[1];
      assert.equal((await request("/shipments/"+first.shipment_id,"PATCH",{status:"Shipped"})).status,409);
      assert.equal((await request("/shipments/"+first.shipment_id,"PATCH",{status:"Processing"})).status,204);
      assert.equal((await request("/shipments/"+first.shipment_id,"PATCH",{status:"Shipped",carrier:"Override",tracking:"Override"})).status,204);
      const saved = (await db.query("SELECT * FROM shipments WHERE shipment_id=$1",[first.shipment_id])).rows[0];
      assert.equal(saved.tracking_number,first.tracking_number);
      assert.equal(saved.carrier,first.carrier);
      assert(saved.shipped_at);
      assert.equal((await db.query("SELECT shipment_status FROM shipments WHERE shipment_id=$1",[second.shipment_id])).rows[0].shipment_status,"pending");
      assert.equal((await request("/shipments/"+second.shipment_id,"PATCH",{status:"Processing"})).status,204);
      assert.equal((await db.query("SELECT order_status FROM orders WHERE order_id=$1",[oid])).rows[0].order_status,"shipped");
      assert.equal((await request("/shipments/"+first.shipment_id,"PATCH",{status:"Processing"})).status,409);
      assert.equal((await request("/shipments/"+first.shipment_id,"PATCH",{status:"Delivered"})).status,204);
      assert.equal((await request("/shipments/"+second.shipment_id,"PATCH",{status:"Shipped"})).status,204);
      assert.equal((await request("/shipments/"+second.shipment_id,"PATCH",{status:"Delivered"})).status,204);
      assert.equal((await db.query("SELECT order_status FROM orders WHERE order_id=$1",[oid])).rows[0].order_status,"completed");
    });
    await t.test(
      "multi-merchant deliveries complete only after last shipment, including concurrency",
      async () => {
        // This scenario needs available stock; the catalog intentionally includes sold-out products.
        await db.query("UPDATE product_variants SET stock_quantity=10 WHERE variant_id IN (1,3)");
        const r = await request("/orders/checkout", "POST", {
          ...input(["1", "3"]),
          payment_method: "Cash on Delivery",
        });
        assert.equal(r.status, 201);
        const ss = (
          await db.query(
            "SELECT shipment_id FROM shipments WHERE order_id=$1",
            [r.body.order_id],
          )
        ).rows;
        assert.equal(ss.length, 2);
        for (const s of ss) {
          assert.equal(
            (
              await request("/shipments/" + s.shipment_id, "PATCH", {
                status: "Processing",
              })
            ).status,
            204,
          );
          assert.equal(
            (
              await request("/shipments/" + s.shipment_id, "PATCH", {
                status: "Shipped",
                carrier: "Test",
                tracking: "TEST-" + s.shipment_id,
              })
            ).status,
            204,
          );
        }
        assert.notEqual(
          (
            await db.query(
              "SELECT order_status FROM orders WHERE order_id=$1",
              [r.body.order_id],
            )
          ).rows[0].order_status,
          "completed",
        );
        const result = await Promise.all(
          ss.map((s) =>
            request("/shipments/" + s.shipment_id, "PATCH", {
              status: "Delivered",
            }),
          ),
        );
        assert(result.every((r) => r.status === 204));
        assert.equal(
          (
            await db.query(
              "SELECT order_status FROM orders WHERE order_id=$1",
              [r.body.order_id],
            )
          ).rows[0].order_status,
          "completed",
        );
        assert.equal(
          (
            await db.query(
              "SELECT payment_status FROM payments WHERE order_id=$1",
              [r.body.order_id],
            )
          ).rows[0].payment_status,
          "paid",
        );
      },
    );
    await t.test(
      "product CRUD, unique SKU, stale stock update rejected, sold deletion restricted",
      async () => {
        const form = {
          name: "API Test",
          merchant_id: "1",
          category_id: "2",
          description: "Test",
          active: true,
          variants: [
            {
              variant_id: "",
              variant_name: "Standard",
              sku: "API-TEST",
              price: 100,
              stock_quantity: 5,
              status: "active",
            },
          ],
        };
        const created = await request("/products", "POST", form);
        assert.equal(created.status, 201);
        assert.equal((await request("/products", "POST", form)).status, 409);
        const inv = (await request("/products/" + created.body.product_id)).body;
        const edit = {
          ...inv.products[0],
          variants: inv.variants.map((v: any) => ({
            ...v,
            original_stock_quantity: v.stock_quantity,
            stock_quantity: 0,
          })),
        };
        assert.equal(
          (await request("/products/" + created.body.product_id, "PUT", edit))
            .status,
          200,
        );
        assert.equal(
          (await request("/products/" + created.body.product_id, "PUT", edit))
            .status,
          409,
        );
        assert.equal(
          (await request("/products/" + created.body.product_id, "DELETE"))
            .status,
          204,
        );
        assert.equal((await request("/products/1", "DELETE")).status, 409);
      },
    );
    await t.test(
      "review CRUD requires completed purchase and preserves customer ownership",
      async () => {
        const created = await request("/reviews", "POST", {
          product_id: "2",
          rating: 5,
          comment: "Test",
        });
        assert.equal(created.status, 201);
        assert.equal(
          (
            await request("/reviews/" + created.body.review_id, "PUT", {
              product_id: "2",
              rating: 4,
              comment: "Updated",
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/reviews/" + created.body.review_id, "DELETE")).status,
          204,
        );
        assert.equal(
          (
            await request("/reviews", "POST", {
              product_id: "500",
              rating: 5,
              comment: "No purchase",
            })
          ).status,
          409,
        );
      },
    );
    await t.test("customer cancellation: ownership, full restoration, refunds, retries, rollback and shipping race", async () => {
      await db.query("UPDATE product_variants SET stock_quantity=100 WHERE variant_id IN (1,3)");
      const stock = async () => (await db.query("SELECT variant_id,stock_quantity FROM product_variants WHERE variant_id IN (1,3) ORDER BY variant_id")).rows;
      const create = async (method="QR Payment") => {
        const result=await request("/orders/checkout","POST",{...input(["1","3"],2),payment_method:method});
        assert.equal(result.status,201);return result.body.order_id;
      };
      const cancel = (oid:string) => request("/orders/"+oid+"/cancel","POST",{cancel_reason:"เปลี่ยนใจ"});
      const before=await stock();
      const oid=await create();
      await db.query("UPDATE orders SET customer_id=2 WHERE order_id=$1",[oid]);
      const foreign_stock=await stock();
      assert.equal((await request("/orders/"+oid+"/cancel","POST",{cancel_reason:"spoof",customer_id:"2"})).status,403);
      assert.deepEqual(await stock(),foreign_stock);
      await db.query("UPDATE orders SET customer_id=1 WHERE order_id=$1",[oid]);
      const duplicates=await Promise.all([cancel(oid),cancel(oid)]);
      assert(duplicates.every(r=>r.status===204));
      assert.deepEqual(await stock(),before);
      const audit=(await db.query("SELECT * FROM orders WHERE order_id=$1",[oid])).rows[0];
      assert.equal(audit.order_status,"cancelled");assert(audit.cancelled_at);
      assert.equal(audit.cancelled_by,"customer:1");assert.equal(audit.stock_restored_units,4);assert.equal(audit.cancel_reason,"เปลี่ยนใจ");
      const restored=(await db.query("SELECT quantity,restored_quantity FROM order_items WHERE order_id=$1",[oid])).rows;
      assert(restored.every(i=>i.quantity===i.restored_quantity));
      const paid=(await db.query("SELECT * FROM payments WHERE order_id=$1",[oid])).rows[0];
      assert.equal(paid.payment_status,"refunded");assert.equal(paid.refunded_amount,paid.amount);assert(paid.refunded_at);
      const shipments=(await db.query("SELECT * FROM shipments WHERE order_id=$1",[oid])).rows;
      assert(shipments.every(s=>s.shipment_status==='cancelled'&&s.cancelled_at));
      assert.equal((await request('/shipments/'+shipments[0].shipment_id,'PATCH',{status:'Processing'})).status,409);
      assert.equal((await cancel(oid)).status,204);assert.deepEqual(await stock(),before);
      const cod=await create('Cash on Delivery');assert.equal((await cancel(cod)).status,204);
      const voided=(await db.query("SELECT * FROM payments WHERE order_id=$1",[cod])).rows[0];
      assert.equal(voided.payment_status,'void');assert.equal(Number(voided.refunded_amount),0);assert(voided.voided_at);
      const rollback_id=await create();const rollback_stock=await stock();
      await db.query("CREATE FUNCTION reject_cancel_payment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.payment_status='refunded' THEN RAISE EXCEPTION 'test refund failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_cancel_payment BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION reject_cancel_payment()");
      try {assert.equal((await cancel(rollback_id)).status,409);} finally {await db.query("DROP TRIGGER reject_cancel_payment ON payments; DROP FUNCTION reject_cancel_payment()");}
      assert.deepEqual(await stock(),rollback_stock);
      assert.equal((await db.query("SELECT cancelled_at FROM orders WHERE order_id=$1",[rollback_id])).rows[0].cancelled_at,null);
      assert.equal((await db.query("SELECT sum(restored_quantity) n FROM order_items WHERE order_id=$1",[rollback_id])).rows[0].n,'0');
      assert.equal((await cancel(rollback_id)).status,204);
      const shipped_id=await create();const ship=(await db.query("SELECT shipment_id FROM shipments WHERE order_id=$1 ORDER BY shipment_id",[shipped_id])).rows[0].shipment_id;
      assert.equal((await request('/shipments/'+ship,'PATCH',{status:'Processing'})).status,204);
      assert.equal((await request('/shipments/'+ship,'PATCH',{status:'Shipped'})).status,204);
      const shipped_stock=await stock();assert.equal((await cancel(shipped_id)).status,409);assert.deepEqual(await stock(),shipped_stock);
      const race_id=await create();const race_ship=(await db.query("SELECT shipment_id FROM shipments WHERE order_id=$1 ORDER BY shipment_id",[race_id])).rows[0].shipment_id;
      await request('/shipments/'+race_ship,'PATCH',{status:'Processing'});
      const race_stock=await stock();
      const race=await Promise.all([cancel(race_id),request('/shipments/'+race_ship,'PATCH',{status:'Shipped'})]);
      assert.deepEqual(race.map(r=>r.status).sort(),[204,409]);
      const final_status=(await db.query("SELECT order_status FROM orders WHERE order_id=$1",[race_id])).rows[0].order_status;
      const after_race=await stock();
      for(let i=0;i<after_race.length;i++) assert.equal(after_race[i].stock_quantity,race_stock[i].stock_quantity+(final_status==='cancelled'?2:0));
    });
    await t.test(
      "report sums exactly reconcile, payment retries never multiply sales",
      async () => {
        const report = (
          await db.query(
            "SELECT sum(gross_sales) gross,sum(shipping_fees) freight FROM vw_merchant_sales_summary",
          )
        ).rows[0];
        const actual = (
          await db.query(
            "SELECT sum(i.quantity*i.unit_price) gross FROM order_items i JOIN orders o USING(order_id) WHERE o.order_status<>'cancelled'",
          )
        ).rows[0];
        const freight = (
          await db.query(
            "SELECT sum(s.shipping_cost) freight FROM shipments s JOIN orders o USING(order_id) WHERE o.order_status<>'cancelled'",
          )
        ).rows[0];
        assert.equal(Number(report.gross), Number(actual.gross));
        assert.equal(Number(report.freight), Number(freight.freight));
      },
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnect_database();
    await db.end();
    // Only this test-created name is eligible for cleanup; never the user's database.
    assert(/^fulfillment_test_\d+$/.test(name));
    await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
    process.env.DATABASE_URL = original;
  }
});

