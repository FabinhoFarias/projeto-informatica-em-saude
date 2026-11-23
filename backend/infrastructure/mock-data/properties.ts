import type { Property } from "../../domain/entities/property";

const streets = ["Rua das Palmeiras", "Travessa do Sol", "Rua do Açude"];
const types: Property["type"][] = [
  "RESIDENCIAL",
  "COMERCIAL",
  "PREDIO",
  "TERRENO",
  "ESCOLA",
  "IGREJA",
];
const aceIds = ["u-4", "u-5", "u-8", "u-10"];
const neighborhoods = [
  "Centro",
  "Nova Itaenga",
  "Vila Boa Esperança",
  "Bom Jesus",
  "Saudade",
  "Salinas",
  "São Sebastião",
  "Independência",
  "Campo",
  "Irmãos Oliveira",
  "Moinho",
  "Baixa Fria",
  "Jacaré I",
  "Jacaré II",
  "Sítio Camboa",
  "Sítio Imbé",
  "Sítio Açude de Pedra",
  "Sítio Quatis",
  "Sítio Arrombados",
  "Sítio Cai Cai",
  "Sítio Marrecos",
  "Sítio Amarelado",
  "Sítio Angicos",
];

export const properties: Property[] = Array.from(
  { length: 3000 },
  (_, index) => {
    const number = index + 1;
    const block = Math.floor(index / 33) + 1;
    return {
      id: `property-${number}`,
      number: String(number),
      street: streets[index % streets.length],
      neighborhood: neighborhoods[index % neighborhoods.length],
      sector: `Setor ${String((index % 10) + 1).padStart(2, "0")}`,
      block,
      type: types[index % types.length],
      // O ciclo atual cobre 60 quarteirões em áreas de tamanhos diferentes.
      assignedAceId:
        block <= 60
          ? aceIds[block <= 12 ? 0 : block <= 27 ? 1 : block <= 44 ? 2 : 3]
          : null,
    };
  },
);
