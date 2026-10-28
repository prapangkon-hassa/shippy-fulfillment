/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser regression test. */
const assert = require("node:assert/strict");
async function verify_inventory(page) {
  const base = process.env.WEB_URL || "http://localhost:3000";
  const api = process.env.API_URL || "http://localhost:4000/api";
  const token = Date.now();
  const name = "Inventory check " + token;
  const response = await page.request.post(api + "/products", {
    data: {
      name,
      description: "Temporary verification",
      merchant_id: "1",
      category_id: "1",
      active: true,
      variants: [
        {
          variant_id: "",
          variant_name: "Empty",
          sku: "CHECK-A-" + token,
          price: 100,
          stock_quantity: 0,
          status: "active",
        },
        {
          variant_id: "",
          variant_name: "Available",
          sku: "CHECK-B-" + token,
          price: 100,
          stock_quantity: 2,
          status: "active",
        },
      ],
    },
  });
  assert.equal(response.status(), 201, await response.text());
  const { product_id } = await response.json();
  const detail = await page.context().newPage();
  try {
    await page.goto(base + "/#catalog");
    await page
      .getByRole("textbox", { name: "Search products", exact: true })
      .fill(name);
    const card = page.locator(".product-card").filter({ hasText: name });
    await card.getByText("In Stock", { exact: true }).waitFor();
    await detail.goto(base + "/products/" + product_id);
    await detail
      .getByLabel("product availability", { exact: true })
      .getByText("In Stock", { exact: true })
      .waitFor();
    const inventory = await (
      await page.request.get(api + "/products/" + product_id)
    ).json();
    const updated = await page.request.put(api + "/products/" + product_id, {
      data: {
        ...inventory.products[0],
        variants: inventory.variants.map((v) => ({
          ...v,
          original_stock_quantity: v.stock_quantity,
          stock_quantity: 0,
        })),
      },
    });
    assert.equal(updated.status(), 200);
    await card
      .getByText("Out of Stock", { exact: true })
      .waitFor({ timeout: 15000 });
    await detail
      .getByLabel("product availability", { exact: true })
      .getByText("Out of Stock", { exact: true })
      .waitFor({ timeout: 15000 });
    await detail.reload();
    await detail
      .getByLabel("product availability", { exact: true })
      .getByText("Out of Stock", { exact: true })
      .waitFor();
    assert(await detail.getByRole("button", { name: "Buy now" }).isDisabled());
    return "Shared PostgreSQL stock, multi-variant availability, two tabs and reload: passed";
  } finally {
    await detail.close();
    const deleted = await page.request.delete(api + "/products/" + product_id);
    assert.equal(deleted.status(), 204);
  }
}
module.exports = { verify_inventory };
