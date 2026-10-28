/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser verification script. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const { verify_inventory } = require("./verify-inventory.cjs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    console.log(await verify_inventory(page));
    for (const route of [
      "/",
      "/products/1",
      "/cart",
      "/orders",
      "/orders/1",
      "/merchant/products",
      "/merchant/orders",
      "/merchant/reports",
    ]) {
      const r = await page.goto("http://localhost:3000" + route);
      assert.equal(r.status(), 200, route);
    }
    await page
      .getByRole("heading", { name: "merchant sales summary" })
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/products/1");
    await page
      .getByRole("heading", { name: "เสื้อยืดคอกลม รุ่น 01", exact: true })
      .waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth === innerWidth,
      ),
      "mobile overflow",
    );
    assert.deepEqual(errors, []);
    console.log("Routes, mobile layout and browser errors: passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

