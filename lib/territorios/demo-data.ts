import type { MunicipalityConfiguration, Neighborhood } from "./types";

export const municipality: MunicipalityConfiguration = {
  name: "Lagoa de Itaenga",
  state: "PE",
  prefeitura: "Prefeitura de Lagoa de Itaenga",
  district: "Territorialização municipal de Lagoa de Itaenga",
} as const;

type MappedTerritory = { id: string; name: string; zone: "Urbana" | "Rural" };

export const mappedTerritories: MappedTerritory[] = [
  ["centro", "Centro", "Urbana"], ["nova-itaenga", "Nova Itaenga", "Urbana"],
  ["vila-boa-esperanca", "Vila Boa Esperança", "Urbana"], ["bom-jesus", "Bom Jesus", "Urbana"],
  ["saudade", "Saudade", "Urbana"], ["salinas", "Salinas", "Urbana"],
  ["sao-sebastiao", "São Sebastião", "Urbana"], ["independencia", "Independência", "Urbana"],
  ["campo", "Campo", "Urbana"], ["irmaos-oliveira", "Irmãos Oliveira", "Urbana"],
  ["moinho", "Moinho", "Urbana"], ["baixa-fria", "Baixa Fria", "Urbana"],
  ["jacare-i", "Jacaré I", "Urbana"], ["jacare-ii", "Jacaré II", "Urbana"],
  ["sitio-camboa", "Sítio Camboa", "Rural"], ["sitio-imbe", "Sítio Imbé", "Rural"],
  ["sitio-acude-de-pedra", "Sítio Açude de Pedra", "Rural"], ["sitio-quatis", "Sítio Quatis", "Rural"],
  ["sitio-arrombados", "Sítio Arrombados", "Rural"], ["sitio-cai-cai", "Sítio Cai Cai", "Rural"],
  ["sitio-marrecos", "Sítio Marrecos", "Rural"], ["sitio-amarelado", "Sítio Amarelado", "Rural"],
  ["sitio-angicos", "Sítio Angicos", "Rural"],
].map(([id, name, zone]) => ({ id, name, zone } as MappedTerritory));

export const neighborhoods: Neighborhood[] = mappedTerritories.map((territory, index) => {
  const suspectedCases = 8 + ((index * 7) % 34);
  return {
    id: territory.id, name: territory.name, city: municipality.name,
    district: territory.zone === "Urbana" ? "Área Urbana" : "Área Rural",
    population: 2800 + index * 410, suspectedCases,
    forecastCases: suspectedCases + 5 + (index % 8), ratePer100k: 74 + ((index * 31) % 290),
    incidenceProbability: 24 + ((index * 9) % 68),
    risk: index % 7 === 0 ? "Crítico" : index % 3 === 0 ? "Alto" : index % 2 === 0 ? "Médio" : "Baixo",
    density: territory.zone === "Urbana" ? 4200 + index * 350 : 900 + index * 120,
    vectorFoci: 2.1 + (index % 9) * 1.4, apsVisits: 90 + index * 17,
    apsCases: 12 + (index % 13), apsStatus: index % 3 === 0 ? "Atenção" : "Em observação",
    trigger: index % 4 === 0,
  };
});
