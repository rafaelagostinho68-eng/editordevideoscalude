import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2A9.93 9.93 0 0 0 3.5 17.1L2 22l5.05-1.45A9.94 9.94 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3 .86.9-2.93-.2-.31a8.2 8.2 0 1 1 6.78 3.7Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.12-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

/** Torii simplificado — elemento de identidade usado na logo tipográfica e nos placeholders. */
export function ToriiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 56" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M2 9c18-6 42-6 60 0l-2.4 7C41 11.5 23 11.5 4.4 16L2 9Z" />
      <rect x="11" y="19" width="42" height="5" rx="1" />
      <rect x="29" y="15" width="6" height="9" />
      <rect x="15" y="15" width="6" height="40" rx="1" />
      <rect x="43" y="15" width="6" height="40" rx="1" />
    </svg>
  );
}
