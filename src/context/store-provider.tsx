"use client";
import type { checkout_draft } from "@/types/checkout";
import * as cart_service from "@/services/cart.service";
import { api } from "@/services/api";
import type {
  checkout_input,
  product_input,
  review,
  shipping_status,
  store_data,
} from "@/types";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
const empty: store_data = {
  products: [],
  variants: [],
  orders: [],
  reviews: [],
  cart: [],
  merchants: [],
  categories: [],
  customers: [],
  current_customer_id: "1",
  report: [],
};
type store_state = {
  data: store_data;
  ready: boolean;
  notice: string;
  checkout_draft: checkout_draft | null;
  begin_checkout: (draft: checkout_draft) => void;
  refresh: () => Promise<void>;
  add_to_cart: (id: string, quantity: number) => boolean;
  set_quantity: (id: string, quantity: number) => void;
  remove_item: (id: string) => void;
  save_product: (input: product_input, id?: string) => Promise<void>;
  delete_product: (id: string) => Promise<void>;
  cancel_order: (order_id: string, cancel_reason: string) => Promise<void>;
  checkout: (input: checkout_input) => Promise<string>;
  update_shipment: (
    id: string,
    status: shipping_status,
  ) => Promise<void>;
  save_review: (
    input: Pick<review, "product_id" | "rating" | "comment">,
    id?: string,
  ) => Promise<void>;
  delete_review: (id: string) => Promise<void>;
};
const Context = createContext<store_state | null>(null);
// Read carts saved before the snake_case API migration without losing their contents.
function normalize_cart(cart: unknown[]): { variant_id: string; quantity: number }[] {
  return cart.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const variant_id = row.variant_id ?? row["variant" + "Id"];
    return typeof variant_id === "string" && Number.isInteger(row.quantity) && Number(row.quantity) > 0
      ? [{ variant_id, quantity: Number(row.quantity) }] : [];
  });
}
const cart_key = "ef-api-cart-v1";
const checkout_key = "shippy-checkout-v1";
export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, set_draft] = useState<checkout_draft | null>(null);
  const draft_ref = useRef<checkout_draft | null>(null);
  function save_draft(next: checkout_draft | null) {
    draft_ref.current = next;
    set_draft(next);
    try { if (next) sessionStorage.setItem(checkout_key, JSON.stringify(next)); else sessionStorage.removeItem(checkout_key); } catch {}
  }
  const [data, set_data] = useState(empty),
    [ready, set_ready] = useState(false),
    [notice, set_notice] = useState(""),
    [error, set_error] = useState("");
  const ref = useRef(data),
    generation = useRef(0),
    pending = useRef(false);
  function commit(next: store_data) {
    ref.current = next;
    set_data(next);
  }
  function save_cart(next: store_data) {
    commit(next);
    try {
      localStorage.setItem(cart_key, JSON.stringify(next.cart));
    } catch {
      set_notice("ไม่สามารถบันทึกตะกร้าในเบราว์เซอร์นี้ได้");
    }
  }
  async function refresh() {
    const version = ++generation.current;
    try {
      const result = await api<Omit<store_data, "cart">>("/store");
      if (version !== generation.current) return;
      commit({ ...result, cart: ref.current.cart });
      set_ready(true);
      set_error("");
    } catch (e) {
      if (version === generation.current)
        set_error(e instanceof Error ? e.message : "API unavailable");
    }
  }
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem(cart_key) || "[]");
      if (Array.isArray(cart))
        ref.current = {
          ...ref.current,
          cart: normalize_cart(cart).filter(
            (i) =>
              i &&
              typeof i.variant_id === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0,
          ),
        };
    } catch {}
    try {
      const stored = JSON.parse(sessionStorage.getItem(checkout_key) || "null");
      if (stored && ["cart", "buy_now"].includes(stored.mode) && Array.isArray(stored.items)) {
        const items = normalize_cart(stored.items);
        if (items.length && items.length === stored.items.length && new Set(items.map((item)=>item.variant_id)).size===items.length)
          // Hydrate the tab-specific checkout draft from external session storage.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          save_draft({ mode: stored.mode, items });
      }
    } catch {}
    void refresh();
    const sync = () => {
      if (!pending.current && document.visibilityState === "visible") void refresh();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === cart_key) {
        try {
          const cart = JSON.parse(event.newValue || "[]");
          if (Array.isArray(cart)) commit({ ...ref.current, cart: normalize_cart(cart) });
        } catch {}
      }
      sync();
    };
    const timer = setInterval(sync, process.env.NODE_ENV === "production" ? 60000 : 5000);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", storage);
    const token = generation;
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", storage);
      token.current++;
    };
    // One shared snapshot; polling/focus also picks up edits made in pgAdmin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => set_notice(""), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  async function mutate<T>(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    if (pending.current)
      throw new Error("Please wait for the current operation");
    pending.current = true;
    generation.current++;
    try {
      const result = await api<T>(path, method, body);
      await refresh();
      return result;
    } finally {
      pending.current = false;
    }
  }
  const value: store_state = {
    data,
    ready,
    notice,
    checkout_draft: draft,
    begin_checkout: (next) => save_draft({mode: next.mode, items: next.items.map((item)=>({...item}))}),
    refresh,
    add_to_cart: (id, quantity) => {
      try {
        save_cart(cart_service.add_cart_item(ref.current, id, quantity));
        set_notice("เพิ่มสินค้าลงตะกร้าแล้ว");
        return true;
      } catch (e) {
        set_notice((e as Error).message);
        return false;
      }
    },
    set_quantity: (id, n) =>
      save_cart(cart_service.set_cart_quantity(ref.current, id, n)),
    remove_item: (id) => save_cart(cart_service.remove_cart_item(ref.current, id)),
    save_product: async (input, id) => {
      await mutate(
        "/products" + (id ? "/" + id : ""),
        id ? "PUT" : "POST",
        input,
      );
      set_notice("product saved");
    },
    delete_product: async (id) => {
      await mutate("/products/" + id, "DELETE");
    },
    checkout: async (input) => {
      const purchase = draft_ref.current;
      if (!purchase?.items.length) throw new Error("กรุณาเลือกรายการที่ต้องการซื้อใหม่");
      if (purchase.mode === "cart" && purchase.items.some((item) =>
        !ref.current.cart.some((line) => line.variant_id === item.variant_id && line.quantity >= item.quantity)))
        throw new Error("ตะกร้ามีการเปลี่ยนแปลง กรุณากลับไปเลือกรายการใหม่");
      const result = await mutate<{ order_id: string }>(
        "/orders/checkout",
        "POST",
        { ...input, items: purchase.items },
      );
      if (purchase.mode === "cart") {
        const cart = ref.current.cart.flatMap((line) => {
          const bought = purchase.items.find((item) => item.variant_id === line.variant_id)?.quantity ?? 0;
          const quantity = line.quantity - bought;
          return quantity > 0 ? [{ ...line, quantity }] : [];
        });
        save_cart({ ...ref.current, cart });
      }
      save_draft(null);
      return result.order_id;
    },
    cancel_order: async (order_id, cancel_reason) => {
      await mutate("/orders/" + order_id + "/cancel", "POST", { cancel_reason });
      set_notice("ยกเลิกคำสั่งซื้อและคืนสต็อกเรียบร้อยแล้ว");
    },
    update_shipment: async (id, status) => {
      await mutate("/shipments/" + id, "PATCH", { status });
      set_notice("อัปเดตสถานะสินค้าทุกชิ้นในพัสดุแล้ว");
    },
    save_review: async (input, id) => {
      await mutate(
        "/reviews" + (id ? "/" + id : ""),
        id ? "PUT" : "POST",
        input,
      );
    },
    delete_review: async (id) => {
      await mutate("/reviews/" + id, "DELETE");
    },
  };
  return (
    <Context.Provider value={value}>
      {error && (
        <div className="container notice" role="alert">
          Cannot load database: {error}{" "}
          <button className="text-link" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider missing");
  return store;
}

