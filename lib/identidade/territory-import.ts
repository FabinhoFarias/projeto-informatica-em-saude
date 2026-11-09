import { parseCsv } from "@/lib/ingestao/processor";
import type { TerritorialAssignment } from "./types";

export interface TerritoryAssignmentRow {
  personId: string;
  personName?: string;
  email?: string;
  role?: string;
  sectorCode?: string;
  sectorName?: string;
  microareaCode?: string;
  microareaName?: string;
  localityCode?: string;
  localityName?: string;
  blockCode?: string;
  validFrom?: string;
  validUntil?: string;
  sourceFile?: string;
}

const aliases: Record<keyof TerritoryAssignmentRow, string[]> = {
  personId: [
    "id_pessoa",
    "pessoa_id",
    "id_agente",
    "codigo_agente",
    "matricula",
    "cpf",
  ],
  personName: ["nome", "nome_agente", "nome_pessoa"],
  email: ["email", "e_mail"],
  role: ["perfil", "tipo_vinculo", "funcao"],
  sectorCode: ["codigo_setor", "cod_setor", "setor_id"],
  sectorName: ["setor", "nome_setor"],
  microareaCode: ["codigo_microarea", "cod_microarea", "microarea_id"],
  microareaName: ["microarea", "nome_microarea"],
  localityCode: ["codigo_localidade", "cod_localidade", "localidade_id"],
  localityName: ["localidade", "nome_localidade"],
  blockCode: [
    "quarteirao",
    "codigo_quarteirao",
    "cod_quarteirao",
    "numero_quarteirao",
  ],
  validFrom: ["vigencia_inicio", "inicio_vigencia", "data_inicio"],
  validUntil: ["vigencia_fim", "fim_vigencia", "data_fim"],
  sourceFile: ["arquivo_origem", "fonte"],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function value(
  row: Record<string, string>,
  field: keyof TerritoryAssignmentRow,
) {
  const key = Object.keys(row).find((header) =>
    aliases[field].includes(normalize(header)),
  );
  return key ? row[key]?.trim() || undefined : undefined;
}

export function parseTerritoryAssignmentCsv(
  content: string,
  sourceFile?: string,
): TerritoryAssignmentRow[] {
  const [header = [], ...rows] = parseCsv(content);
  return rows
    .map((cells) => {
      const raw = Object.fromEntries(
        header.map((column, index) => [column, cells[index] ?? ""]),
      );
      const parsed = Object.fromEntries(
        Object.keys(aliases).map((field) => [
          field,
          value(raw, field as keyof TerritoryAssignmentRow),
        ]),
      ) as unknown as TerritoryAssignmentRow;
      return { ...parsed, sourceFile: parsed.sourceFile ?? sourceFile };
    })
    .filter(
      (row) =>
        Boolean(row.personId) &&
        Boolean(
          row.sectorCode ||
            row.sectorName ||
            row.microareaCode ||
            row.localityCode,
        ),
    );
}

export function assignmentFromRow(
  row: TerritoryAssignmentRow,
  source: TerritorialAssignment["source"] = "sispncd",
): TerritorialAssignment {
  return {
    sectorCode: row.sectorCode,
    sectorName: row.sectorName,
    microareaCode: row.microareaCode,
    microareaName: row.microareaName,
    localityCode: row.localityCode,
    localityName: row.localityName,
    blockCodes: row.blockCode ? [row.blockCode] : [],
    source,
    sourceFile: row.sourceFile,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
  };
}
