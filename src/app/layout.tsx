import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StoreProvider } from "@/context/store-provider";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  icons: { icon: "/shippy-logo.png" },
  title: "Shippy · E-Commerce & Fulfillment",
  description:
    "เลือกซื้อสินค้า ติดตามคำสั่งซื้อ และจัดการร้านค้าในระบบสาธิต",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>
        <StoreProvider>
          <a href="#main" className="skip-link">
            ข้ามไปเนื้อหา
          </a>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
