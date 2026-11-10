/**
 * Mockup completo e autocontido da prefeitura de Lagoa de Itaenga.
 *
 * Para demonstrar outra prefeitura, duplique este arquivo, altere o município
 * e substitua os arrays territoriais, casas, usuários e registros. Nenhum dado
 * deste arquivo representa endereço ou pessoa real.
 */
import { initialUsers } from "@/lib/identidade/demo-users";
import { demoHeaders, demoRows } from "@/lib/ingestao/demo-data";
import { demoTerritories } from "@/lib/priorizacao/demo-data";
import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";
import { casasTerritoriaisDemo } from "@/lib/territorios/casas-demo";
import {
  mappedTerritories,
  municipality,
  neighborhoods,
} from "@/lib/territorios/demo-data";

export const lagoaDeItaengaMockup = {
  id: "lagoa-de-itaenga",
  municipality,
  territories: mappedTerritories,
  neighborhoods,
  houses: casasTerritoriaisDemo,
  fieldVisits: sectorPropertiesDemo,
  users: initialUsers,
  prioritization: demoTerritories,
  ingestion: { headers: demoHeaders, rows: demoRows },
  metadata: {
    label: "Lagoa de Itaenga · demonstração acadêmica",
    ibgeCode: "2608503",
    source: "Diagnóstico municipal e dados fictícios para protótipo",
    realData: false,
  },
} as const;

export type PrefeituraMockup = typeof lagoaDeItaengaMockup;
