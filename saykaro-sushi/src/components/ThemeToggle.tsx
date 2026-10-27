"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Alterna entre tema claro (padrão) e escuro. A escolha fica salva só neste aparelho. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("sk_theme", next); } catch { /* sem armazenamento: vale só nesta visita */ }
    setDark(!dark);
  };
  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"} title={dark ? "Tema claro" : "Tema escuro"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-surface2 ${className}`}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
