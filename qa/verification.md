# Verification — 6 October 2026

Rechecked after reorganizing domain services, entity types, mock rows, shared context and page components. TypeScript, lint, production build and the complete browser workflow all passed again. The file guide and database integration guide are now in `docs/` in Thai.

Passed on Windows with Node.js 24, Next.js 16.3.8, and headless Chrome:

- `npm run typecheck` — no TypeScript errors.
- `npm run lint` — no errors or warnings.
- `npm run build` — successful production build; all requested routes generated.
- `node scripts/verify.cjs` — all browser assertions passed.
- Browser runtime and console error collection — empty.
- All nine route patterns returned HTTP 200 at widths 1440, 768 and 390 pixels.
- No page-level horizontal overflow at any tested width; merchant tables scroll within their containers.
- Catalog: 12 products, search, category selection and no-results state.
- Product: variant selection updates SKU and price; out-of-stock purchase disabled.
- Cart: add, increase/decrease, stock maximum, minimum one, persistence after reload, remove and empty state.
- Buy now: adds selected variant and navigates to checkout.
- Checkout: required-field validation, order success, saved purchase price, stock deduction, cart clearing, pending mock payment and order navigation.
- Reviews: completed-purchase eligibility, validation, create, edit, product-page synchronization and confirmed deletion.
- Merchant products: field validation, create, add/remove variant rows, edit, storefront synchronization, cancel deletion and confirm deletion.
- Merchant shipments: processing, required carrier/tracking, shipped and delivered; parent order status remains unchanged.
- Product/order not-found states.
- Desktop storefront, reporting dashboard, mobile storefront and populated mobile checkout screenshots inspected.

Screenshots:
- desktop-home.png
- mobile-home.png
- mobile-checkout.png
- reports.png

The browser tests use an isolated context. Reports are intentionally static mock aggregates. No backend/database was created or contacted.

Manual scope limit: responsive layout and core flows were checked in Chrome; other browsers and assistive technologies were not independently tested.
