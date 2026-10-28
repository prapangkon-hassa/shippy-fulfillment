# Inventory synchronization verification — 2026-10-06

Verified using Playwright MCP and isolated Chrome session against localhost:3000.

- Product availability derives from shared Context variants using getProductInventory.
- Merchant edit: [0,3] means product In Stock; selecting zero variant means variant Out of Stock and purchasing disabled.
- Merchant edit: [0,0] updates already-open Home, Detail and Merchant tabs; reload preserves Out of Stock.
- Restock updates all open tabs.
- Reducing selected stock from 3 to 1 clamps purchase quantity to 1.
- Checkout consumes the last unit; all pages display Out of Stock; localStorage contains zero quantities.
- Client navigation Detail → Home and reload preserve depleted inventory.
- No browser runtime errors.
- Typecheck and lint passed.

Regression test: scripts/verify-inventory.cjs (uses PLAYWRIGHT_PATH in the same way as scripts/verify.cjs).
No backend/database added. Inventory remains browser-local mock state.
