import { Router } from "express";
import {
  list_products,
  product_detail,
} from "../controllers/products.controller.js";

export const products_router = Router();
products_router.get("/", list_products);
products_router.get("/:id", product_detail);
