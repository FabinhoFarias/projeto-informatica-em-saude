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

export const properties: Property[] = Array.from(
  { length: 996 },
  (_, index) => {
    const number = index + 1;
    const block = Math.floor(index / 33) + 1;
    return {
      id: `property-${number}`,
      number: String(number),
      street: streets[index % streets.length],
      neighborhood: [
        "Centro",
        "Nova Itaenga",
        "Vila Boa Esperança",
        "Bom Jesus",
      ][index % 4],
      sector: `Setor ${String((index % 10) + 1).padStart(2, "0")}`,
      block,
      type: types[index % types.length],
      // O ciclo atual cobre 12 quarteirões: três quarteirões (~99 imóveis)
      // para cada ACE. Os demais imóveis permanecem sem atribuição.
      assignedAceId: block <= 12 ? aceIds[(block - 1) % aceIds.length] : null,
    };
  },
);
