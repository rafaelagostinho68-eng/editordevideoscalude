"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Atualiza os dados da página a cada N segundos (usado na lista de pedidos). */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
