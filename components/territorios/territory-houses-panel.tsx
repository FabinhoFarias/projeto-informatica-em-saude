"use client";

import { useMemo, useState } from "react";
import { lagoaDeItaengaMockup } from "@/lib/mockups/lagoa-de-itaenga";

const { houses: casasTerritoriaisDemo, territories: mappedTerritories } =
  lagoaDeItaengaMockup;

export function TerritoryHousesPanel() {
  const [territoryId, setTerritoryId] = useState(mappedTerritories[0].id);
  const houses = useMemo(
    () =>
      casasTerritoriaisDemo.filter(
        (house) => house.territorioId === territoryId,
      ),
    [territoryId],
  );
  const territory =
    mappedTerritories.find((item) => item.id === territoryId) ??
    mappedTerritories[0];

  return (
    <section
      aria-labelledby="casas-territoriais-heading"
      className="border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
            Setorização demonstrativa
          </p>
          <h2
            id="casas-territoriais-heading"
            className="mt-1 text-lg font-bold text-slate-950"
          >
            Imóveis demonstrativos por território
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Casas fictícias para validar o fluxo de visitas. Nenhum código
            abaixo representa uma residência real.
          </p>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Território
          <select
            value={territoryId}
            onChange={(event) => setTerritoryId(event.target.value)}
            className="ml-2 border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            {mappedTerritories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.zone}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm text-slate-700">
        <strong>{territory.name}</strong> · {territory.zone} · {houses.length}{" "}
        casas fictícias · {houses.filter((house) => house.foco).length} foco(s)
        demonstrativo(s)
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {houses.map((house) => (
          <article key={house.id} className="border border-slate-200 p-3">
            <p className="font-mono text-xs font-semibold text-slate-900">
              {house.codigo}
            </p>
            <p className="mt-2 text-xs text-slate-600">{house.setor}</p>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {house.situacao}
            </p>
            {house.foco && (
              <span className="mt-2 inline-block bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900">
                Foco demonstrativo
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
