"use client";
import { ArrowUpRight, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MerchantNav() {
  const path = usePathname();
  return (
    <div className="merchant-nav">
      <div className="row gap-2">
        <Store size={18} />
        <b>ส่วนจัดการร้านค้า</b>
      </div>
      <nav aria-label="merchant navigation">
        {["products", "orders", "reports"].map((item) => (
          <Link
            key={item}
            className={path.includes(item) ? "active" : ""}
            href={"/merchant/" + item}
          >
            {{ products: "จัดการสินค้า", orders: "จัดส่งคำสั่งซื้อ", reports: "รายงานยอดขาย" }[item]}
          </Link>
        ))}
      </nav>
      <Link href="/" className="button secondary">
        กลับไปหน้าซื้อสินค้า <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
