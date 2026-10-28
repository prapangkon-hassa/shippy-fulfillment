"use client";
import { product } from "@/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: product[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.product_id} product={p} />
      ))}
    </div>
  );
}
