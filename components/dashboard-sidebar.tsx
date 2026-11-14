import Link from "next/link";
import Image from "next/image";
// import { municipality } from "@/lib/territorios/demo-data";
import type { NavigationItem } from "@/lib/plataforma/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Database,
  FileChartColumn,
  Gauge,
  House,
  MapPinned,
  Settings2,
  Users,
} from "lucide-react";

const navigationIcons = {
  "◫": House,
  "✓": ClipboardCheck,
  "◉": MapPinned,
  "◇": Gauge,
  "⌁": FileChartColumn,
  "⇧": Database,
  "⤢": BarChart3,
  "◎": Users,
  "⚙": Settings2,
} as const;

export function DashboardSidebar({
  pathname,
  items,
  expanded,
  onMouseEnter,
  onMouseLeave,
}: {
  pathname: string;
  items: NavigationItem[];
  expanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const desktopItems = items;
  const mobileItems = items
    .filter((item) => item.display === "todos")
    .slice(0, 5);
  return (
    <>
      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`hidden flex-col border-r border-color-border bg-white transition-[width] duration-300 md:sticky md:top-0 md:flex md:h-[100dvh] md:shrink-0 ${expanded ? "md:w-64" : "md:w-20"}`}
      >
        <div className="flex h-[8vh] w-full items-center justify-center border-b border-color-border px-3 py-3">
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src={
                expanded
                  ? "/brandingPrefeioturaLagoaDeItaenga/logoRetangular.png"
                  : "/brandingPrefeioturaLagoaDeItaenga/logoQuadrada.png"
              }
              alt="Prefeitura de Lagoa de Itaenga"
              width={expanded ? 190 : 62}
              height={52}
              className={`object-contain ${expanded ? "h-[7vh] w-full" : "h-[7.5vh]"}`}
            />
          </div>
        </div>
        {/* <Image
        src={
          expanded
            ? "/brandingPrefeioturaLagoaDeItaenga/logoRetangular.png"
            : "/brandingPrefeioturaLagoaDeItaenga/logoQuadrada.png"
        }
        alt="Prefeitura de Lagoa de Itaenga"
        width={expanded ? 190 : 52}
        height={52}
        className="h-[5vh] w-auto max-w-full object-contain"
      /> */}

        <nav
          aria-label="Navegação principal"
          className={`flex gap-3 overflow-x-auto px-3 py-3  md:flex-col md:overflow-visible ${expanded ? "" : "md:items-center"}`}
        >
          {desktopItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon =
              navigationIcons[item.icon as keyof typeof navigationIcons] ??
              Gauge;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={`flex h-12 shrink-0 items-center gap-3 rounded-xl border px-3 text-sm transition-colors ${expanded ? "" : "w-12 justify-center"} ${active ? "border-verde-escuro bg-verde-escuro font-semibold text-white" : "border-color-border bg-white text-slate-600 hover:border-verde-escuro hover:bg-verde-claro hover:text-verde-escuro"}`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {expanded ? (
                  item.label
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Navegação rápida móvel"
        className="fixed inset-x-3 bottom-3 z-[120] flex items-center justify-around rounded-[1.35rem] border border-slate-200 bg-white/95 p-2 shadow-[0_12px_35px_rgba(15,23,42,0.18)] backdrop-blur md:hidden"
      >
        {mobileItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon =
            navigationIcons[item.icon as keyof typeof navigationIcons] ?? Gauge;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${active ? "bg-verde-escuro text-white shadow-sm" : "text-slate-500 hover:bg-verde-claro hover:text-verde-escuro"}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
