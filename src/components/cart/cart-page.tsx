"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, LoadingSkeleton } from "@/components/ui/feedback";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useStore } from "@/context/store-provider";
import { money } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { OrderSummary } from "./order-summary";
import { useCartLines } from "./use-cart-lines";

function ShopCheckbox({checked, mixed, label, on_change}: {checked:boolean; mixed:boolean; label:string; on_change:()=>void}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{if(ref.current) ref.current.indeterminate=mixed;},[mixed]);
  return <input ref={ref} type="checkbox" checked={checked} aria-checked={mixed ? "mixed" : checked} aria-label={label} onChange={on_change} />;
}
export function CartPage() {
  const { data, ready, set_quantity, remove_item, begin_checkout } = useStore();
  const router = useRouter();
  const lines = useCartLines();
  const [excluded, set_excluded] = useState<string[]>([]);
  const selected = lines.filter((line)=>!excluded.includes(line.variant_id));
  const subtotal = selected.reduce((n,line)=>n+line.quantity*line.variant.price,0);
  const invalid = selected.some((line)=>!line.product.active || line.variant.status!=="active" || line.quantity>line.variant.stock_quantity);
  const shops = [...new Set(lines.map((line)=>line.product.merchant_id))];
  function toggle(ids:string[], checked:boolean) {
    set_excluded((previous)=>checked ? previous.filter((id)=>!ids.includes(id)) : [...new Set([...previous,...ids])]);
  }
  if(!ready) return <div className="container section"><LoadingSkeleton /></div>;
  return <div className="container section">
    <Link href="/#catalog" className="back-link"><ArrowLeft size={15}/> เลือกสินค้าเพิ่ม</Link>
    <div className="page-heading"><span className="eyebrow">ขั้นตอนที่ 1 จาก 2 · เลือกรายการที่จะซื้อ</span><h1>ตะกร้าของฉัน<span className="heading-dot">.</span></h1><p>เลือกทั้งร้านหรือเลือกสินค้าแต่ละรายการ สินค้าที่ไม่ได้เลือกจะยังอยู่ในตะกร้า</p></div>
    {!lines.length ? <EmptyState title="ตะกร้ายังว่างอยู่" description="เลือกสินค้าแล้วกดเพิ่มลงตะกร้า"><Link className="button" href="/#catalog">เลือกซื้อสินค้า</Link></EmptyState> : <div className="checkout-grid">
      <div className="space-y-5">{shops.map((merchant_id)=>{
        const items = lines.filter((line)=>line.product.merchant_id===merchant_id);
        const count = items.filter((line)=>!excluded.includes(line.variant_id)).length;
        const name = data.merchants.find((shop)=>shop.merchant_id===merchant_id)?.merchant_name ?? "ร้านค้า";
        return <section className="panel cart-list" key={merchant_id}>
          <label className="cart-shop-heading"><ShopCheckbox checked={count===items.length} mixed={count>0&&count<items.length} label={`เลือกสินค้าทั้งร้าน ${name}`} on_change={()=>toggle(items.map((line)=>line.variant_id),count!==items.length)}/><b>{name}</b><span className="muted">เลือก {count}/{items.length} รายการ</span></label>
          {items.map((line)=><article key={line.variant_id} className="cart-item">
            <input className="cart-item-checkbox" type="checkbox" aria-label={`เลือก ${line.product.name} ${line.variant.variant_name}`} checked={!excluded.includes(line.variant_id)} onChange={(e)=>toggle([line.variant_id],e.target.checked)}/>
            <div className="cart-info"><Link href={"/products/"+line.product.product_id}><h3>{line.product.name}</h3></Link><p>{line.variant.variant_name}</p><span>{money(line.variant.price)} / ชิ้น</span>
              <QuantitySelector value={line.quantity} max={line.variant.stock_quantity} on_change={(n)=>set_quantity(line.variant_id,n)}/>
              {(!line.product.active||line.variant.status!=="active"||line.quantity>line.variant.stock_quantity)&&<p className="field-error">สินค้าไม่พร้อมขายหรือมีไม่พอ กรุณาปรับจำนวนหรือยกเลิกการเลือก</p>}
            </div>
            <div className="cart-right"><b>{money(line.variant.price*line.quantity)}</b><button className="icon-button muted" aria-label={"ลบสินค้า "+line.product.name} onClick={()=>remove_item(line.variant_id)}><Trash2 size={17}/></button></div>
          </article>)}
        </section>;
      })}</div>
      {selected.length ? <OrderSummary subtotal={subtotal}>
        <p className="mb-4" aria-live="polite">เลือก {selected.length} รายการ · {selected.reduce((n,line)=>n+line.quantity,0)} ชิ้น</p>
        {invalid&&<p role="alert" className="field-error mb-4">กรุณาตรวจสอบสินค้าที่เลือกก่อนดำเนินการ</p>}
        <button className="button w-full" disabled={invalid} onClick={()=>{begin_checkout({mode:"cart",items:selected.map(({variant_id,quantity})=>({variant_id,quantity}))});router.push("/checkout");}}>ชำระรายการที่เลือก <ArrowRight size={16}/></button>
      </OrderSummary> : <aside className="panel summary"><h2>ยังไม่ได้เลือกสินค้า</h2><p>ติ๊กสินค้าอย่างน้อย 1 รายการเพื่อดูยอดรวมและไปชำระเงิน</p><button className="button w-full mt-4" disabled>ชำระรายการที่เลือก</button></aside>}
    </div>}
  </div>;
}
