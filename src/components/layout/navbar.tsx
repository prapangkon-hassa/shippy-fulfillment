"use client";
import Image from "next/image";
import { useStore } from "@/context/store-provider";
import { ChevronDown, Search, ShoppingBag, Store } from "lucide-react";
import { SiteLink as Link, site_navigation_event } from "./site-link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Navbar() {
  const { data } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [home_section, set_home_section] = useState("home");
  const menu_ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function sync_section() {
      set_home_section(window.location.hash === "#catalog" ? "products" : "home");
      if (menu_ref.current) menu_ref.current.open = false;
    }
    function on_site_navigation(event: Event) {
      const url = new URL(
        (event as CustomEvent<string>).detail,
        window.location.href,
      );
      set_home_section(url.hash === "#catalog" ? "products" : "home");
      if (menu_ref.current) menu_ref.current.open = false;
    }

    // Home และ Products ใช้ pathname เดียวกัน จึงต้องอ่าน hash ด้วย
    sync_section();
    window.addEventListener("hashchange", sync_section);
    window.addEventListener("popstate", sync_section);
    window.addEventListener(site_navigation_event, on_site_navigation);
    return () => {
      window.removeEventListener("hashchange", sync_section);
      window.removeEventListener("popstate", sync_section);
      window.removeEventListener(site_navigation_event, on_site_navigation);
    };
  }, [pathname]);

  // merchant pages have their own panel navigation.
  if (pathname === "/merchant" || pathname.startsWith("/merchant/")) return null;

  const home_active = pathname === "/" && home_section === "home";
  const products_active =
    pathname.startsWith("/products") ||
    (pathname === "/" && home_section === "products");
  const orders_active = pathname.startsWith("/orders");
  const count = data.cart.reduce((n, i) => n + i.quantity, 0);
  return (
    <>
      <header className="header">
        <div className="nav-wrap">
          <Link href="/" className="brand shippy-brand" aria-label="Shippy หน้าแรก">
            <Image src="/shippy-logo.png" alt="Shippy" width={1061} height={442} className="shippy-logo" priority />
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link
              className={home_active ? "active" : ""}
              aria-current={home_active ? "page" : undefined}
              href="/"
            >
              หน้าแรก
            </Link>
            <Link
              className={products_active ? "active" : ""}
              aria-current={products_active ? "page" : undefined}
              href="/#catalog"
            >
              สินค้าทั้งหมด
            </Link>
            <Link
              className={orders_active ? "active" : ""}
              aria-current={orders_active ? "page" : undefined}
              href="/orders"
            >
              คำสั่งซื้อของฉัน
            </Link>
          </nav>
          <div className="nav-tools">
            <button
              className="icon-button search-toggle"
              aria-label="ค้นหาสินค้า"
              onClick={() => {
                set_home_section("products");
                router.push("/#catalog");
                setTimeout(
                  () => document.getElementById("product-search")?.focus(),
                  100,
                );
              }}
            >
              <Search size={20} />
            </button>
            <Link
              href="/cart"
              className="cart-link"
              aria-label={"Cart, " + count + " items"}
            >
              <ShoppingBag size={20} />
              <span>ตะกร้า ({count})</span>
            </Link>
            <details ref={menu_ref} className="user-menu">
              <summary aria-label="บัญชีทดลองและเมนูผู้ขาย">
                <span className="avatar">DC</span>
                <ChevronDown size={13} />
              </summary>
              <div>
                <b>
                  {data.customers.find(
                    (c) => c.customer_id === data.current_customer_id,
                  )?.full_name ?? "customer"}
                </b>
                <small>บัญชีลูกค้าทดลอง</small>
                <Link href="/orders">คำสั่งซื้อของฉัน</Link>
                <Link href="/merchant/products">
                  <Store size={15} /> จัดการร้านค้า (ผู้ขาย)
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
