import type { ReactElement } from "react";
import { ToriiIcon } from "./Icons";

/**
 * Ilustrações simples (NÃO são fotos) usadas no lugar da foto enquanto o produto não tem imagem.
 * Escolhidas pelo nome do produto/categoria (veja lib/art.ts); categorias desconhecidas usam a torii.
 */
import { artKind, type ArtKind } from "@/lib/art";
export { artKind };
export type { ArtKind };

const ART: Record<Exclude<ArtKind, "torii">, ReactElement> = {
  // fatias de sashimi sobre folha
  sashimi: (
    <g>
      <ellipse cx="60" cy="76" rx="48" ry="5" className="fa-shadow" />
      <ellipse cx="60" cy="58" rx="46" ry="16" className="fa-rice" />
      <path d="M22 54c10-14 22-18 34-14l-4 14c-10-2-20 0-30 0Z" className="fa-green" />
      <g transform="rotate(-8 48 50)"><rect x="30" y="38" width="38" height="16" rx="8" className="fa-red" /><path d="M38 40c2 4 2 8 0 12M48 40c2 4 2 8 0 12M58 40c2 4 2 8 0 12" className="fa-fish" /></g>
      <g transform="rotate(4 64 54)"><rect x="42" y="46" width="38" height="16" rx="8" className="fa-red" /><path d="M50 48c2 4 2 8 0 12M60 48c2 4 2 8 0 12M70 48c2 4 2 8 0 12" className="fa-fish" /></g>
      <g transform="rotate(14 78 56)"><rect x="56" y="52" width="38" height="16" rx="8" className="fa-red" /><path d="M64 54c2 4 2 8 0 12M74 54c2 4 2 8 0 12M84 54c2 4 2 8 0 12" className="fa-fish" /></g>
      <path d="M84 40c4-8 10-8 14-2M90 44c5-7 11-6 14 0" className="fa-pleat" />
    </g>
  ),
  // gyoza
  gyoza: (
    <g>
      <ellipse cx="60" cy="74" rx="46" ry="5" className="fa-shadow" />
      <path d="M14 62c0-22 18-34 36-34s36 12 36 34c0 4-3 6-7 6H21c-4 0-7-2-7-6Z" className="fa-gold" />
      <path d="M26 66c-3-12 2-24 12-30M40 66c-3-12 0-24 8-33M54 66c-2-12 0-24 6-32M68 66c-1-12 1-22 5-28" className="fa-pleat" />
      <path d="M22 62c2-9 8-16 16-20" className="fa-shine" />
      <path d="M72 66c0-16 12-28 28-28 6 0 9 4 8 10-3 12-12 18-24 18h-8c-3 0-4-1-4-3Z" className="fa-gold2" />
      <path d="M84 62c1-8 6-14 13-17" className="fa-shine" />
    </g>
  ),
  // missô / sopa
  soup: (
    <g>
      <ellipse cx="60" cy="76" rx="38" ry="5" className="fa-shadow" />
      <path d="M50 10c-3 4 3 7 0 11M62 8c-3 4 3 7 0 11M74 10c-3 4 3 7 0 11" className="fa-steam" />
      <ellipse cx="60" cy="40" rx="42" ry="11" className="fa-bowl" />
      <ellipse cx="60" cy="40" rx="37" ry="8" className="fa-sauce" />
      <rect x="44" y="36" width="9" height="7" rx="1.5" className="fa-cut" /><rect x="62" y="38" width="9" height="7" rx="1.5" className="fa-cut" /><rect x="76" y="35" width="8" height="6" rx="1.5" className="fa-cut" />
      <circle cx="54" cy="41" r="2" className="fa-green" /><circle cx="70" cy="36" r="2" className="fa-green" /><circle cx="40" cy="40" r="2" className="fa-green" />
      <path d="M18 42c0 20 14 32 42 32s42-12 42-32c-6 5-20 8-42 8s-36-3-42-8Z" className="fa-red" />
      <path d="M30 56c6 6 14 9 24 10" className="fa-shine" />
    </g>
  ),
  // nigiri de salmão + maki
  sushi: (
    <g>
      <ellipse cx="60" cy="74" rx="44" ry="5" className="fa-shadow" />
      <rect x="18" y="46" width="46" height="24" rx="12" className="fa-rice" />
      <path d="M14 50c4-14 22-20 40-17 8 1.5 14 5 16 10-2 7-8 11-16 12-14 2-34 0-40-5Z" className="fa-red" />
      <path d="M26 41c3 7 3 12 1 16M38 38c3 7 3 13 1 19M50 37c3 7 3 12 1 17" className="fa-fish" />
      <rect x="35" y="43" width="7" height="27" rx="2" className="fa-nori" />
      <circle cx="92" cy="54" r="18" className="fa-rice" />
      <circle cx="92" cy="54" r="14" className="fa-nori" />
      <circle cx="92" cy="54" r="10.5" className="fa-rice" />
      <circle cx="92" cy="54" r="5" className="fa-red" />
    </g>
  ),
  // entradas quentes: peças fritas douradas
  entrada: (
    <g>
      <ellipse cx="60" cy="76" rx="48" ry="5" className="fa-shadow" />
      <ellipse cx="60" cy="62" rx="46" ry="14" className="fa-rice" />
      {[[34, 48], [60, 44], [86, 48], [47, 62], [73, 62]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="12" className="fa-gold" />
          <circle cx={x} cy={y} r="7.4" className="fa-cut" />
          <circle cx={x - 1.5} cy={y - 1} r="1.8" className="fa-red" /><circle cx={x + 2.2} cy={y + 1.8} r="1.6" className="fa-green" />
          <path d={`M${x - 8} ${y - 6}c3-3 7-4 10-3`} className="fa-shine" />
        </g>
      ))}
    </g>
  ),
  // rolinhos fritos
  harumaki: (
    <g>
      <ellipse cx="60" cy="76" rx="46" ry="5" className="fa-shadow" />
      <g transform="rotate(-14 60 46)">
        <rect x="14" y="30" width="76" height="26" rx="13" className="fa-gold" />
        <path d="M24 36c14-4 36-4 56 0" className="fa-shine" />
        <ellipse cx="86" cy="43" rx="9" ry="13" className="fa-cut" />
        <circle cx="84" cy="38" r="2.6" className="fa-red" /><circle cx="87" cy="45" r="2.4" className="fa-green" /><circle cx="83" cy="49" r="2" className="fa-red" />
      </g>
      <path d="M20 66h36c0 8-8 12-18 12S20 74 20 66Z" className="fa-bowl" />
      <ellipse cx="38" cy="66" rx="18" ry="3.5" className="fa-sauce" />
    </g>
  ),
  // barca de sushi (combo)
  combo: (
    <g>
      <ellipse cx="60" cy="76" rx="50" ry="5" className="fa-shadow" />
      <path d="M8 56h104l-9 16c-1 2-3 3-5 3H22c-2 0-4-1-5-3L8 56Z" className="fa-wood" />
      <rect x="6" y="52" width="108" height="6" rx="3" className="fa-wood2" />
      {[24, 42, 60, 78, 96].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i % 2 ? 40 : 38} r="9.5" className="fa-rice" />
          <circle cx={x} cy={i % 2 ? 40 : 38} r="7.4" className="fa-nori" />
          <circle cx={x} cy={i % 2 ? 40 : 38} r="5.2" className="fa-rice" />
          <circle cx={x} cy={i % 2 ? 40 : 38} r="2.4" className={i % 2 ? "fa-green" : "fa-red"} />
        </g>
      ))}
    </g>
  ),
  // tigela de yakissoba
  yakissoba: (
    <g>
      <ellipse cx="60" cy="76" rx="44" ry="5" className="fa-shadow" />
      <path d="M52 8c-3 4 3 7 0 11M64 6c-3 4 3 7 0 11M76 8c-3 4 3 7 0 11" className="fa-steam" />
      <path d="M20 36c8-12 24-14 34-8 8-6 24-4 32 6l2 6H18l2-4Z" className="fa-gold" />
      <path d="M26 40c6-6 14-8 20-4M50 36c8-5 18-4 24 2M66 38c6-3 12-2 16 1" className="fa-pleat" />
      <circle cx="48" cy="30" r="3.4" className="fa-green" /><circle cx="72" cy="33" r="3" className="fa-red" />
      <path d="M12 42h96c0 20-14 32-48 32S12 62 12 42Z" className="fa-red" />
      <path d="M22 50c8 8 24 12 38 12" className="fa-shine" />
      <path d="M88 4 62 38M96 8 70 40" className="fa-stick" />
    </g>
  ),
  // arroz / sopa (acompanhamentos)
  side: (
    <g>
      <ellipse cx="60" cy="76" rx="38" ry="5" className="fa-shadow" />
      <path d="M52 12c-3 4 3 7 0 11M64 10c-3 4 3 7 0 11" className="fa-steam" />
      <path d="M30 40c4-14 16-20 30-20s26 6 30 20H30Z" className="fa-rice" />
      <circle cx="50" cy="32" r="1.4" className="fa-sesame" /><circle cx="62" cy="28" r="1.4" className="fa-sesame" /><circle cx="72" cy="35" r="1.4" className="fa-sesame" /><circle cx="56" cy="37" r="1.4" className="fa-sesame" />
      <path d="M20 40h80c0 18-12 32-40 32S20 58 20 40Z" className="fa-red" />
      <path d="M30 48c6 7 16 11 26 11" className="fa-shine" />
    </g>
  ),
};

export function FoodArt({ kind, className = "" }: { kind: ArtKind; className?: string }) {
  if (kind === "torii") return <ToriiIcon className={`text-line ${className}`} />;
  return (
    <svg viewBox="0 0 120 90" className={`food-art ${className}`} aria-hidden="true" focusable="false">
      {ART[kind]}
    </svg>
  );
}
