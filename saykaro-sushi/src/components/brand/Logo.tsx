import { ToriiIcon } from "./Icons";

/**
 * Logo. Se o painel tiver uma imagem de logo cadastrada, usa a imagem;
 * senão renderiza a versão tipográfica limpa (nome correto: "Saykaro Sushi").
 */
export function Logo({ name, logoUrl, size = "lg" }: { name: string; logoUrl?: string | null; size?: "sm" | "lg" }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={size === "lg" ? "mx-auto h-24 w-auto max-w-[78vw] object-contain" : "h-9 w-auto object-contain"} />;
  }
  const [first, ...rest] = name.split(" ");
  const second = rest.join(" ") || "Sushi";
  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-2">
        <ToriiIcon className="h-6 w-6 text-shu" />
        <span className="font-display text-lg font-bold uppercase tracking-[0.12em]">{first}</span>
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center" aria-label={name}>
      <ToriiIcon className="mb-1.5 h-9 w-9 text-shu sm:mb-2 sm:h-11 sm:w-11 drop-shadow-[0_0_14px_rgba(211,32,45,.45)]" />
      <div className="font-display text-[38px] font-extrabold uppercase leading-none tracking-[0.1em] text-ink sm:text-6xl">{first}</div>
      <div className="mt-1 font-display text-xl font-bold uppercase leading-none tracking-[0.42em] text-shu sm:text-3xl">{second}</div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.5em] text-gold-soft">
        <span className="h-px w-8 bg-gold/70" />
        Delivery
        <span className="h-px w-8 bg-gold/70" />
      </div>
    </div>
  );
}
