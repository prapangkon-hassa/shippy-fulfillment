import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SiteLink as Link } from "./site-link";

export function Footer() {
  return (
    <footer>
      <div className="row between wrap">
        <div>
          <Link className="brand shippy-brand" href="/" aria-label="Shippy หน้าแรก">
            <Image src="/shippy-logo.png" alt="Shippy" width={1061} height={442} className="shippy-logo" />
          </Link>
          <p>เลือกสินค้า → ใส่ตะกร้า → ยืนยันคำสั่งซื้อ</p>
        </div>
        <div className="footer-links">
          <Link href="/#catalog">เลือกซื้อสินค้า</Link>
          <Link href="/orders">ติดตามคำสั่งซื้อ</Link>
          <Link href="/merchant/products">
            ส่วนผู้ขาย <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Shippy · E-Commerce & Fulfillment</span>
        <span>โครงงานระบบฐานข้อมูล · การชำระเงินจำลอง</span>
      </div>
    </footer>
  );
}
