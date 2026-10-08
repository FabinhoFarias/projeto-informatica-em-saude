"use client";

import { useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { PageHeading, Panel } from "@/components/dashboard-ui";
import { municipality, neighborhoods } from "@/lib/dashboard-data";

type ImportResult = {
  headers: string[];
  rows: string[][];
  totalRows: number;
  importedRows: number;
  correctedLocations: number;
  warnings: string[];
};

const demoHeaders = ["Data do atendimento", "Bairro informado", "Classificação", "Unidade de saúde"];
const demoRows = [
  ["2026-09-28", "Ibura", "Suspeita de dengue", "USF Ibura"],
  ["2026-09-28", "Água Fria", "Síndrome febril", "USF Água Fria"],
  ["2026-09-29", "Boa Viagem", "Suspeita de dengue", "USF Boa Viagem"],
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length];
}

function resolveNeighborhood(input: string) {
  const normalizedInput = normalize(input);
  const exact = neighborhoods.find((neighborhood) => normalize(neighborhood.name) === normalizedInput);
  if (exact) return exact.name;

  const closest = neighborhoods
    .map((neighborhood) => ({ neighborhood, distance: editDistance(normalizedInput, normalize(neighborhood.name)) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!closest || closest.distance > Math.max(1, Math.floor(normalizedInput.length * 0.2))) return input;
  return closest.neighborhood.name;
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = content.replace(/^\uFEFF/, "");
  const firstBreak = text.search(/[\r\n]/);
  const firstRecord = firstBreak < 0 ? text : text.slice(0, firstBreak);
  const delimiters = [",", ";", "\t"];
  const delimiterCounts = delimiters.map((delimiter) => {
    let count = 0;
    let insideQuotes = false;
    for (let index = 0; index < firstRecord.length; index += 1) {
      if (firstRecord[index] === '"' && firstRecord[index + 1] === '"') index += 1;
      else if (firstRecord[index] === '"') insideQuotes = !insideQuotes;
      else if (!insideQuotes && firstRecord[index] === delimiter) count += 1;
    }
    return count;
  });
  const delimiter = delimiters[delimiterCounts.indexOf(Math.max(...delimiterCounts))];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("O CSV contém um campo entre aspas que não foi fechado.");
  if (cell || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}

export function IngestionDashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState("e-SUS PEC");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const chooseFile = (candidate?: File) => {
    if (!candidate) return;
    if (candidate.size > 20 * 1024 * 1024) {
      setError("O arquivo excede o limite de 20 MB.");
      setFile(null);
      setResult(null);
      return;
    }
    const supported = /\.(csv|xlsx)$/i.test(candidate.name);
    if (!supported) {
      setError("Formato não suportado. Selecione um arquivo .csv ou .xlsx.");
      setFile(null);
      setResult(null);
      return;
    }
    setError("");
    setFile(candidate);
    setResult(null);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    try {
      const rawRows: unknown[][] = /\.csv$/i.test(file.name)
        ? parseCsv(await file.text())
        : await readSheet(file);
      if (rawRows.length < 2) throw new Error("O arquivo precisa conter uma linha de cabeçalho e ao menos um registro.");

      const headers = rawRows[0].map((cell) => String(cell).trim());
      if (headers.every((header) => !header)) throw new Error("Não foi possível identificar os nomes das colunas na primeira linha.");
      const rows = rawRows.slice(1).map((row) => headers.map((_, index) => {
        const cell = row[index];
        return cell instanceof Date ? cell.toISOString().slice(0, 10) : String(cell ?? "").trim();
      }));

      const dateIndex = headers.findIndex((header) => /data|date/i.test(header));
      const locationIndex = headers.findIndex((header) => /bairro|localidade/i.test(header));
      const warnings: string[] = [];
      const validRows: string[][] = [];
      let skippedRows = 0;
      let correctedLocations = 0;

      rows.forEach((row, index) => {
        if (dateIndex >= 0 && !row[dateIndex]) {
          skippedRows += 1;
          warnings.push(`Linha ${index + 2} ignorada por ausência de data de atendimento.`);
          return;
        }
        if (locationIndex >= 0 && row[locationIndex]) {
          const officialName = resolveNeighborhood(row[locationIndex]);
          if (officialName !== row[locationIndex]) {
            row[locationIndex] = officialName;
            correctedLocations += 1;
          }
        }
        validRows.push(row);
        if (dateIndex >= 0 && !row[dateIndex]) warnings.push(`Linha ${index + 2} ignorada por ausência de data de atendimento.`);
      });

      if (dateIndex < 0) warnings.push("Coluna de data não identificada. Nenhuma linha foi descartada por esse critério.");
      if (skippedRows > 1) warnings.push(`${skippedRows} linhas ignoradas por ausência de data de atendimento.`);

      setResult({
        headers,
        rows: validRows.slice(0, 6),
        totalRows: rows.length,
        importedRows: validRows.length,
        correctedLocations,
        warnings,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível processar este arquivo.");
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const previewHeaders = result?.headers ?? demoHeaders;
  const previewRows = result?.rows ?? demoRows;

  return (
    <div>
      <PageHeading
        eyebrow={`${municipality.prefeitura} · Entrada de dados`}
        title="Ingestão de dados"
        description="Importe planilhas de e-SUS APS, SINAN ou SIM e confira o esquema e a qualidade dos registros antes da consolidação."
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)]">
        <div className="space-y-5">
          <Panel title="Importar arquivo" description="Arquivos processados nesta tela permanecem no seu navegador.">
            <label htmlFor="data-source" className="mb-2 block text-sm font-medium text-slate-700">Fonte dos dados</label>
            <select
              id="data-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="mb-5 min-h-11 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option>e-SUS PEC</option>
              <option>SINAN</option>
              <option>SIM</option>
            </select>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              aria-label="Selecionar planilha CSV ou XLSX"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                chooseFile(event.dataTransfer.files[0]);
              }}
              className={`flex min-h-48 w-full flex-col items-center justify-center border border-dashed px-5 text-center transition-colors ${
                isDragging ? "border-blue-700 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50"
              }`}
            >
              <svg viewBox="0 0 24 24" className="mb-3 h-8 w-8 text-blue-700" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>
              <span className="text-sm font-semibold text-slate-800">
                {file ? file.name : "Arraste a planilha para cá ou clique para selecionar"}
              </span>
              <span className="mt-2 text-xs text-slate-500">CSV ou XLSX · até 20 MB · Fonte: {source}</span>
            </button>

            {error && <p role="alert" className="mt-4 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            {file && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · pronto para validação</p>
                <button
                  type="button"
                  onClick={processFile}
                  disabled={isProcessing}
                  className="min-h-10 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {isProcessing ? "Validando arquivo…" : "Validar e processar"}
                </button>
              </div>
            )}
          </Panel>

          <Panel title="Pré-visualização de colunas" description={result ? `${result.importedRows} de ${result.totalRows} registros válidos · primeiras linhas` : "Exemplo do formato detectado após a leitura do arquivo."}>
            {result && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">Fonte: {source}</span>
                <span className="bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Esquema identificado</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-slate-500">{previewHeaders.map((header, index) => <th key={`${header}-${index}`} className="px-3 py-3 font-semibold">{header || `Coluna ${index + 1}`}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="text-slate-700">
                      {previewHeaders.map((header, columnIndex) => <td key={`${header}-${columnIndex}`} className="max-w-56 truncate px-3 py-3">{row[columnIndex] ?? ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result && <p className="mt-3 text-[11px] text-slate-500">Prévia ilustrativa · os dados serão substituídos após o processamento do arquivo.</p>}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Validação e higienização" description="Checagens realizadas antes de integrar os dados ao painel.">
            <ul className="space-y-4">
              {[
                ["Mapeamento de esquema", "Identifica cabeçalhos e campos de data e bairro"],
                ["Consistência temporal", "Sinaliza registros sem data de atendimento"],
                ["Normalização territorial", "Compara nomes informados com bairros oficiais"],
                ["Integridade do arquivo", "Verifica se há cabeçalho e linhas de dados"],
              ].map(([title, detail]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-slate-300 text-[10px] text-slate-600">✓</span>
                  <div><p className="text-sm font-medium text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Relatório do processamento" description={result ? "Resultado da leitura do arquivo selecionado." : "O resultado será apresentado após a validação."}>
            {result ? (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3"><p className="text-xs text-slate-500">Registros importáveis</p><p className="mt-1 text-xl font-bold text-slate-900">{result.importedRows}</p></div>
                  <div className="bg-slate-50 p-3"><p className="text-xs text-slate-500">Bairros normalizados</p><p className="mt-1 text-xl font-bold text-slate-900">{result.correctedLocations}</p></div>
                </div>
                {result.correctedLocations > 0 && <p className="mt-4 border-l-2 border-blue-700 bg-blue-50 px-3 py-2 text-sm leading-5 text-blue-900">{result.correctedLocations} logradouro(s) corrigido(s) automaticamente para nomes oficiais de bairros.</p>}
                {result.correctedLocations === 0 && <p className="mt-4 text-sm leading-5 text-slate-600">Nenhum nome de bairro precisou de correção por correspondência aproximada.</p>}
                {result.warnings.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {result.warnings.map((warning) => <li key={warning} className="border-l-2 border-slate-400 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">{warning}</li>)}
                  </ul>
                )}
                {result.warnings.length === 0 && <p className="mt-3 border-l-2 border-green-700 bg-green-50 px-3 py-2 text-sm text-green-900">Nenhum erro ou aviso encontrado nesta leitura.</p>}
              </div>
            ) : (
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Aguardando arquivo</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">Após a leitura, serão exibidos registros válidos, correções de nomes aproximados e avisos de qualidade.</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">Exemplos de checagem: linha sem data de atendimento; variação ortográfica de bairro reconciliada com a lista oficial.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
