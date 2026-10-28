// Creates local settings without overwriting existing configuration or database data.
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = resolve(root, ".env");
if (existsSync(env) || existsSync(resolve(root, "backend/.env"))) {
  console.log(
    "Existing .env configuration preserved. Check backend/.env and compose.yaml.",
  );
} else {
  const password = randomBytes(24).toString("hex");
  writeFileSync(env, `POSTGRES_PASSWORD=${password}\n`);
  writeFileSync(
    resolve(root, "backend/.env"),
    `ENABLE_DATABASE=true\nDATABASE_URL=postgresql://fulfillment:${password}@127.0.0.1:5433/fulfillment\nPORT=4000\nFRONTEND_ORIGIN=http://localhost:3000\n`,
  );
  console.log("Created .env and backend/.env with a random local password.");
}
