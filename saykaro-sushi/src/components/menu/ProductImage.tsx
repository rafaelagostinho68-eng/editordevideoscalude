import { ToriiIcon } from "../brand/Icons";

/**
 * Espaço fixo 4:3 para a fotografia do produto. Sem foto → placeholder elegante (nunca quebra o layout).
 */
export function ProductImage({ src, thumb, alt, className = "", priority = false, large = false }: {
  src: string | null; thumb: string | null; alt: string; className?: string; priority?: boolean; large?: boolean;
}) {
  if (!src) {
    return (
      <div className={`relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-gradient-to-br from-[#1d1214] via-[#17171b] to-[#101013] ${className}`} role="img" aria-label={`${alt} (foto em breve)`}>
        <div className="seigaiha absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(211,32,45,.18),transparent_60%)]" />
        <ToriiIcon className={`relative ${large ? "h-14 w-14" : "h-8 w-8"} text-shu/70`} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={large ? src : thumb ?? src}
      srcSet={!large && thumb ? `${thumb} 600w, ${src} 1200w` : undefined}
      sizes={!large ? "(max-width:640px) 120px, 280px" : undefined}
      alt={alt}
      width={4}
      height={3}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`aspect-[4/3] w-full object-cover ${className}`}
    />
  );
}
