"use client";

import { useState } from "react";
import { ConsolidatedReports } from "@/components/digitacao/consolidated-reports";
import {
  ManualEntryForm,
  type ManualEntry,
} from "@/components/digitacao/manual-entry-form";
import { PageHeading, Panel } from "@/components/plataforma/dashboard-ui";

export function DigitizationWorkspace({
  apiData: _apiData,
}: {
  apiData?: unknown;
}) {
  const properties =
    _apiData && typeof _apiData === "object" && "properties" in _apiData
      ? Array.isArray((_apiData as { properties?: unknown }).properties)
        ? (_apiData as { properties: unknown[] }).properties
        : []
      : [];
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  return (
    <div className="min-w-0">
      <PageHeading
        eyebrow="Operação assistida"
        title="Digitação e relatórios"
        description="Alternativa inclusiva para equipes que continuam trabalhando em papel. A ficha física é transcrita com origem e responsabilidade preservadas."
      />
      <div className="space-y-5">
        <ManualEntryForm
          properties={properties}
          onSave={(entry) => setEntries((current) => [entry, ...current])}
        />
        {entries.length > 0 && (
          <Panel
            title="Fichas transcritas nesta sessão"
            description="Registros simulados ainda não persistidos em banco."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Ficha</th>
                    <th className="p-3">ACE</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Origem</th>
                    <th className="p-3">Digitador</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-200">
                      <td className="p-3 font-semibold">
                        {entry.paperFormNumber}
                      </td>
                      <td className="p-3">{entry.agent}</td>
                      <td className="p-3">
                        {new Date(
                          `${entry.activityDate}T12:00:00`,
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                          PAPEL
                        </span>
                      </td>
                      <td className="p-3">{entry.transcribedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        <ConsolidatedReports />
      </div>
    </div>
  );
}
