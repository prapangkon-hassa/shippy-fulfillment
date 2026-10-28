import { MerchantNav } from "@/components/layout/merchant-nav";
export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <MerchantNav />
      {children}
    </div>
  );
}
