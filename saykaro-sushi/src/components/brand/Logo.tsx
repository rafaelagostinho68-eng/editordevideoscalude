import { ToriiIcon } from "./Icons";

/**
 * Logo. Se o painel tiver uma imagem de logo cadastrada, usa a imagem;
 * senão renderiza a versão tipográfica simples (nome correto: "Saykaro Sushi").
 */
export function Logo({ name, logoUrl, size = "lg" }: { name: string; logoUrl?: string | null; size?: "sm" | "lg" }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={size === "lg" ? "h-14 w-auto max-w-[60vw] object-contain object-left sm:h-16" : "h-8 w-auto object-contain"} />;
  }
  const [first, ...rest] = name.split(" ");
  const second = rest.join(" ");
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={name}>
      <ToriiIcon className={`${big ? "h-8 w-8 sm:h-9 sm:w-9" : "h-6 w-6"} shrink-0 text-shu`} />
      <span className={`font-brand font-extrabold uppercase leading-none tracking-[0.08em] ${big ? "text-2xl sm:text-[28px]" : "text-lg"}`}>
        {first}{second && <> <span className="text-shu-hot">{second}</span></>}
      </span>
    </span>
  );
}
