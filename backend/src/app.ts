import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { products_router } from "./routes/products.routes.js";
import { store_router } from "./routes/store.routes.js";
import { get_pool } from "./lib/db.js";

export function create_app() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !==
        (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
    ) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    if (
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
    ) {
      res.status(400).json({ error: "A JSON object is required" });
      return;
    }
    next();
  });
  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      database_enabled: process.env.ENABLE_DATABASE === "true",
    });
  });
  app.use("/api/products", products_router);
  app.get("/api/health/database", async (_req, res) => {
    await get_pool().query("SELECT 1 FROM products LIMIT 1");
    res.json({ status: "ok" });
  });
  app.use("/api", store_router);
  app.use((_request, response) =>
    response.status(404).json({ error: "Route not found" }),
  );
  const handle_error: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (error.code === "23503") {
      error.status = 409;
      error.message =
        "This record is referenced by another table. Keep sold products/variants and set status to inactive instead.";
    }
    if (error.code === "23505") {
      error.status = 409;
      error.message = "SKU, tracking number or review already exists.";
    }
    if (["23514", "23502", "22001", "22P02"].includes(error.code)) {
      error.status = 400;
      error.message =
        "Invalid data: check required fields, lengths and values.";
    }
    if (error.code === "P0001") {
      error.status = 409;
    }
    if (error.code === "42501") error.status = 403;
    const status =
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status < 600
        ? error.status
        : 500;
    response
      .status(status)
      .json({
        error:
          status === 500
            ? "API request failed. Check database setup and server logs."
            : error.message,
      });
    if (status === 500)
      console.error("API request failed:", error.code || error.name);
  };
  app.use(handle_error);
  return app;
}

// Vercel Express entry point; local server imports the same application.
export default create_app();

