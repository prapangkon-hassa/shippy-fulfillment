import { cancel_order } from "../services/cancellation.service.js";
import { Router } from "express";
import { get_store } from "../services/store.service.js";
import * as product_writes from "../services/product-write.service.js";
import * as checkout from "../services/checkout.service.js";
import * as shipments from "../services/shipments.service.js";
import * as reviews from "../services/reviews.service.js";
import { id } from "../lib/validation.js";
export const store_router = Router();
store_router.get("/store", async (_req, res) => {
  res.set("Cache-Control", "no-store").json(await get_store());
});
store_router.post("/products", async (req, res) => {
  res.status(201).json(await product_writes.save_product(req.body));
});
store_router.put("/products/:id", async (req, res) => {
  res.json(await product_writes.save_product(req.body, id(req.params.id)));
});
store_router.delete("/products/:id", async (req, res) => {
  await product_writes.delete_product(id(req.params.id));
  res.sendStatus(204);
});
store_router.post("/orders/checkout", async (req, res) => {
  res.status(201).json(await checkout.checkout(req.body));
});
store_router.patch("/shipments/:id", async (req, res) => {
  await shipments.update_shipment(id(req.params.id), req.body);
  res.sendStatus(204);
});
store_router.post("/reviews", async (req, res) => {
  res.status(201).json(await reviews.save_review(req.body));
});
store_router.put("/reviews/:id", async (req, res) => {
  res.json(await reviews.save_review(req.body, id(req.params.id)));
});
store_router.delete("/reviews/:id", async (req, res) => {
  await reviews.delete_review(id(req.params.id));
  res.sendStatus(204);
});

store_router.post("/orders/:id/cancel", async (req,res) => {
  await cancel_order(id(req.params.id),req.body.cancel_reason);
  res.sendStatus(204);
});
