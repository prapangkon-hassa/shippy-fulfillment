import type { Request, Response } from "express";
import { get_inventory } from "../services/products.service.js";
import { id } from "../lib/validation.js";

export async function list_products(_request: Request, response: Response) {
  response.json(await get_inventory());
}

export async function product_detail(
  request: Request<{ id: string }>,
  response: Response,
) {
  const inventory = await get_inventory(id(request.params.id));
  if (!inventory.products.length) {
    response.status(404).json({ error: "product not found" });
    return;
  }
  response.json(inventory);
}
