"use client";

import { useState } from "react";
import { HotspotWorkspace } from "@/components/operacao/hotspot-workspace";
import { MapViewport } from "@/components/operacao/map-viewport";
import { PageHeading } from "@/components/plataforma/dashboard-ui";
import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";

export function MapsWorkspace() {
  const [layer, setLayer] = useState<"imoveis" | "hotspots">("imoveis");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sectorPropertiesDemo.find(
    (property) => property.id === selectedId,
  );

  return (
    <div className="min-w-0">
      <PageHeading
        eyebrow="Território · mapas"
        title="Mapas da operação"
        description="Consulte os imóveis do setor e os hotspots informados pelos agentes. As posições exibidas são fictícias."
      />
      <div
        role="tablist"
        aria-label="Camadas do mapa"
        className="mb-4 grid grid-cols-2 gap-2 border-b border-slate-200 pb-3 sm:flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={layer === "imoveis"}
          onClick={() => setLayer("imoveis")}
          className={`min-h-10 min-w-0 px-3 text-sm font-semibold sm:px-4 ${layer === "imoveis" ? "bg-emerald-800 text-white" : "bg-white text-slate-700"}`}
        >
          Imóveis do setor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={layer === "hotspots"}
          onClick={() => setLayer("hotspots")}
          className={`min-h-10 min-w-0 px-3 text-sm font-semibold sm:px-4 ${layer === "hotspots" ? "bg-emerald-800 text-white" : "bg-white text-slate-700"}`}
        >
          Hotspots
        </button>
      </div>
      {layer === "hotspots" ? (
        <HotspotWorkspace />
      ) : (
        <section className="min-w-0 overflow-hidden border border-slate-200 bg-white p-2 sm:p-4">
          <MapViewport
            label="Mapa demonstrativo dos imóveis do setor"
            className="bg-[#e8f0eb] sm:aspect-[16/9]"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <rect width="800" height="500" fill="#e8f0eb" />
              <path
                d="M-20 142L820 101M-20 340L820 382M229-20L270 530M560-20L521 530"
                stroke="white"
                strokeWidth="27"
              />
              <path
                d="M-20 142L820 101M-20 340L820 382M229-20L270 530M560-20L521 530"
                stroke="#b8c9bd"
                strokeWidth="2"
              />
            </svg>
            {sectorPropertiesDemo.map((property) => (
              <button
                key={property.id}
                type="button"
                title={`${property.logradouro}, ${property.numero}`}
                aria-label={`Imóvel ${property.codigoLocal}: ${property.logradouro}, ${property.numero}`}
                onClick={() => setSelectedId(property.id)}
                style={{
                  left: `${property.pontoMapa.x}%`,
                  top: `${property.pontoMapa.y}%`,
                }}
                className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-xs font-bold text-white shadow ${selectedId === property.id ? "bg-blue-700 ring-2 ring-blue-900" : "bg-emerald-700"}`}
              >
                {property.sequenciaPercurso}
              </button>
            ))}
          </MapViewport>
          {selected && (
            <p className="mt-3 text-sm text-slate-800">
              <strong>
                {selected.logradouro}, {selected.numero}
              </strong>{" "}
              · {selected.codigoLocal} · Quarteirão {selected.quarteirao}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
