import { FoodArt, type ArtKind } from "../brand/FoodArt";

/**
 * Espaço fixo 4:3 para a fotografia do produto. Sem foto → placeholder discreto (nunca quebra o layout).
 */
export function ProductImage({ src, thumb, alt, className = "", priority = false, large = false, art = "torii" }: {
  src: string | null; thumb: string | null; alt: string; className?: string; priority?: boolean; large?: boolean; art?: ArtKind;
}) {
  if (!src) {
    return (
      <div className={`grid aspect-[4/3] w-full place-items-center bg-surface2 ${className}`} role="img" aria-label={`${alt} (foto em breve)`}>
        <FoodArt kind={art} className={art === "torii" ? (large ? "h-14 w-14" : "h-7 w-7") : "h-auto w-[68%] max-w-[260px]"} />
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
