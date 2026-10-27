"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";

export type CartOption = { groupId: number; optionId: number; groupName: string; optionName: string; priceCents: number };
export type CartLine = {
  key: string;
  productId: number;
  name: string;
  portion: string | null;
  /** Preço apenas para EXIBIÇÃO. O servidor recalcula tudo antes de registrar o pedido. */
  unitPriceCents: number;
  optionsCents: number;
  quantity: number;
  notes: string;
  options: CartOption[];
  thumbUrl: string | null;
};
export type NewCartLine = Omit<CartLine, "key">;

const STORAGE_KEY = "sk_cart_v1";
export const MAX_QTY = 50;

export function lineKey(l: Pick<CartLine, "productId" | "options" | "notes">): string {
  const opts = l.options.map((o) => `${o.groupId}:${o.optionId}`).sort().join(",");
  return `${l.productId}|${opts}|${l.notes.trim().toLowerCase()}`;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: NewCartLine }
  | { type: "qty"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "replace"; lines: CartLine[] }
  | { type: "clear" };

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "hydrate":
    case "replace":
      return a.lines;
    case "add": {
      const key = lineKey(a.line);
      const found = state.find((l) => l.key === key);
      if (found) return state.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + a.line.quantity) } : l));
      return [...state, { ...a.line, key, quantity: Math.min(MAX_QTY, a.line.quantity) }];
    }
    case "qty":
      return state.flatMap((l) => (l.key !== a.key ? [l] : a.quantity <= 0 ? [] : [{ ...l, quantity: Math.min(MAX_QTY, a.quantity) }]));
    case "remove":
      return state.filter((l) => l.key !== a.key);
    case "clear":
      return [];
  }
}

type Ctx = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotalCents: number;
  add: (l: NewCartLine) => void;
  setQty: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};
const CartCtx = createContext<Ctx | null>(null);

function parse(raw: string | null): CartLine[] {
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || data.v !== 1 || !Array.isArray(data.lines)) return [];
    return data.lines.filter((l: CartLine) => l && Number.isInteger(l.productId) && Number.isInteger(l.quantity) && l.quantity > 0 && typeof l.name === "string").slice(0, 40);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try { dispatch({ type: "hydrate", lines: parse(localStorage.getItem(STORAGE_KEY)) }); } catch { /* armazenamento bloqueado */ }
    setHydrated(true);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) dispatch({ type: "hydrate", lines: parse(e.newValue) }); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lines })); } catch { /* ignora */ }
  }, [lines, hydrated]);

  const add = useCallback((line: NewCartLine) => dispatch({ type: "add", line }), []);
  const setQty = useCallback((key: string, quantity: number) => dispatch({ type: "qty", key, quantity }), []);
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const replace = useCallback((l: CartLine[]) => dispatch({ type: "replace", lines: l }), []);

  const value = useMemo<Ctx>(() => ({
    lines, hydrated, add, setQty, remove, clear, replace, drawerOpen, setDrawerOpen,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotalCents: lines.reduce((s, l) => s + (l.unitPriceCents + l.optionsCents) * l.quantity, 0),
  }), [lines, hydrated, add, setQty, remove, clear, replace, drawerOpen]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}
