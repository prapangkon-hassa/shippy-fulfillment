# Naming conventions

Project-owned database identifiers, API JSON keys, domain types, variables and service functions use lowercase snake_case.
Examples: product_id, variant_id, stock_quantity, coupon_code, get_product_inventory, checkout_input.

Framework contracts retain their required spelling:
- React components start with an uppercase letter, e.g. ProductCard and StoreProvider. Lowercase JSX names denote native HTML elements.
- React hooks retain the use-prefixed naming recognized by React hook rules, e.g. useStore and useCartLines.
- React/HTML props and browser APIs keep their external names, e.g. onClick, onChange, className, autoComplete, localStorage.
- Third-party imports/options, environment variables and configuration keys keep their specified names, e.g. connectionString and NEXT_PUBLIC_API_URL.

Custom component callbacks use on_change, on_close and on_confirm.
Existing browser carts are read with a legacy-key adapter and written back with snake_case fields on the next cart update.
Run backend/scripts/apply-snake-case-logic.mjs from backend when updating an existing database; it replaces routines, not records.
New installations already use snake_case through schema.sql, logic.sql and data.sql.
