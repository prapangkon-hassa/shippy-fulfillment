"use client";
import { RatingStars } from "@/components/ui/display";
import { useStore } from "@/context/store-provider";
import { money } from "@/lib/utils";
import { get_product_inventory } from "@/services/products.service";
import { product } from "@/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function ProductCard({ product }: { product: product }) {
  const { data } = useStore();
  const { categories, merchants } = data;
  const { variants, in_stock, low_stock, sellable_stock } = get_product_inventory(data, product.product_id);
  const reviews = data.reviews.filter((r) => r.product_id === product.product_id);
  const rating = reviews.length
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
    : 0;
  return (
    <article className="product-card">
      <div className="product-content">
        <div className="row between">
          <span className="eyebrow">
            {
              categories.find((c) => c.category_id === product.category_id)
                ?.category_name
            }
          </span>
          <RatingStars rating={rating} count={reviews.length} />
        </div>
        <Link href={"/products/" + product.product_id}>
          <h3>{product.name}</h3>
        </Link>
        <p className="merchant-name">
          {
            merchants.find((m) => m.merchant_id === product.merchant_id)
              ?.merchant_name
          }
        </p>
        <div className="row between product-price">
          <b>
            {variants.length
              ? money(Math.min(...variants.map((v) => v.price)))
              : "—"}
          </b>
          <span className={"stock " + (!in_stock ? "unavailable" : low_stock ? "low-stock" : "")}>
            {!in_stock ? "สินค้าหมด" : low_stock ? `ใกล้หมด · เหลือ ${sellable_stock} ชิ้น` : "พร้อมขาย"}
          </span>
        </div>
        <Link className="view-product" href={"/products/" + product.product_id}>
          ดูรายละเอียด / เลือกแบบ <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
