import type { ReactNode } from "react";

type MapViewportProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

/**
 * Área estável para qualquer provedor de mapas.
 *
 * O conteúdo atual é demonstrativo, mas este contêiner também pode receber
 * Google Maps futuramente sem alterar a estrutura responsiva das páginas.
 */
export function MapViewport({
  children,
  className = "",
  label,
}: MapViewportProps) {
  return (
    <div
      role="region"
      aria-label={label}
      className={`relative isolate h-[min(70dvh,520px)] min-h-[360px] w-full min-w-0 overflow-hidden overscroll-contain bg-[#e4eee9] [touch-action:pan-x_pan-y_pinch-zoom] sm:h-auto sm:min-h-[430px] sm:aspect-[16/10] ${className}`}
    >
      {children}
    </div>
  );
}
