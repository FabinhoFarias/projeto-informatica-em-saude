import { municipality } from "@/lib/territorios/demo-data";
import {
  sectorPropertiesDemo,
  type PropertyType,
} from "@/lib/visitas/demo-data";

const propertyTypeCode: Record<PropertyType, string> = {
  RESIDENCIAL: "R",
  PREDIO: "O",
  COMERCIAL: "C",
  TERRENO: "TB",
  ESCOLA: "O",
  UBS: "O",
  IGREJA: "O",
  INDUSTRIAL: "O",
  PONTO_ESTRATEGICO: "PE",
  OUTRO: "O",
};

export const defaultDailyReportDate = "2026-11-06";

function dateInBrazil(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function reportCycle(date: string) {
  const [year, month] = date.split("-").map(Number);
  return `${Math.floor((month - 1) / 2) + 1}/${year}`;
}

export function availableDailyReportDates() {
  return [
    ...new Set(
      sectorPropertiesDemo.flatMap((property) =>
        property.ultimaVisita ? [property.ultimaVisita.dataAtividade] : [],
      ),
    ),
  ].sort((left, right) => right.localeCompare(left));
}

export function buildDailyReport(date: string) {
  const properties = sectorPropertiesDemo
    .filter((property) => property.ultimaVisita?.dataAtividade === date)
    .sort((left, right) => left.sequenciaPercurso - right.sequenciaPercurso);

  const rows = properties.map((property) => {
    const visit = property.ultimaVisita!;
    const form = visit.formulario;
    const pending =
      visit.acesso === "RECUSA" ? "R" : visit.acesso === "FECHADO" ? "F" : "";

    return [
      property.quarteirao,
      property.sequenciaPercurso,
      property.lado === "NORTE" ? "N" : "S",
      property.logradouro,
      property.numero,
      form.sequenciaNumero,
      property.complemento ?? "",
      propertyTypeCode[property.tipo],
      form.horaEntrada,
      form.tipoVisita,
      pending,
      form.depositos.A1,
      form.depositos.A2,
      form.depositos.B,
      form.depositos.C,
      form.depositos.D1,
      form.depositos.D2,
      form.depositos.E,
      form.imovelInspecionado ? "S" : "N",
      form.amostraInicial,
      form.amostraFinal,
      form.quantidadeTubitos,
      form.depositosEliminados,
      form.imovelTratado ? "S" : "N",
      form.larvicida1Tipo,
      form.larvicida1Quantidade,
      form.larvicida1Depositos,
      form.larvicida2Tipo,
      form.larvicida2Quantidade,
      form.perifocalTipo,
      form.perifocalCargas,
    ];
  });

  const inspectedDeposits = properties.reduce((total, property) => {
    const deposits = property.ultimaVisita!.formulario.depositos;
    return (
      total + Object.values(deposits).reduce((sum, value) => sum + value, 0)
    );
  }, 0);
  const samples = properties.reduce(
    (total, property) =>
      total + property.ultimaVisita!.formulario.quantidadeTubitos,
    0,
  );
  const treated = properties.filter(
    (property) => property.ultimaVisita!.formulario.imovelTratado,
  ).length;
  const completedProperties = properties.filter(
    (property) => property.ultimaVisita!.acesso === "REALIZADO",
  );
  const countType = (types: PropertyType[]) =>
    completedProperties.filter((property) => types.includes(property.tipo))
      .length;
  const depositTypes = ["A1", "A2", "B", "C", "D1", "D2", "E"] as const;
  const depositsByType = depositTypes.map((type) =>
    properties.reduce(
      (total, property) =>
        total + property.ultimaVisita!.formulario.depositos[type],
      0,
    ),
  );
  const forms = properties.map((property) => property.ultimaVisita!.formulario);
  const uniqueText = (values: string[]) =>
    [...new Set(values.filter(Boolean))].join(" + ");
  const sumForm = (select: (form: (typeof forms)[number]) => number) =>
    forms.reduce((total, form) => total + select(form), 0);
  const workedBlocks = [
    ...new Set(properties.map((property) => property.quarteirao)),
  ];
  const completedBlocks = workedBlocks.filter((block) => {
    const blockProperties = sectorPropertiesDemo.filter(
      (property) => property.quarteirao === block,
    );
    return blockProperties.every(
      (property) =>
        property.ultimaVisita?.dataAtividade === date &&
        property.ultimaVisita.acesso === "REALIZADO",
    );
  });
  const refusals = properties.filter(
    (property) => property.ultimaVisita!.acesso === "RECUSA",
  ).length;
  const closed = properties.filter(
    (property) => property.ultimaVisita!.acesso === "FECHADO",
  ).length;
  const focalTreatments = forms.filter((form) => form.imovelTratado).length;
  const perifocalTreatments = forms.filter(
    (form) => form.perifocalCargas > 0,
  ).length;
  const inspected = forms.filter((form) => form.imovelInspecionado).length;

  return {
    metadata: {
      municipio: municipality.name,
      localidade: "Setor 02 · Centro",
      categoria: "Urbana",
      zona: "Urbana",
      tipo: "1",
      concluida: "S",
      dataAtividade: dateInBrazil(date),
      cicloAno: reportCycle(date),
      agente: "Mariana Santos",
      supervisor: "Supervisão de Endemias",
    },
    rows,
    totals: {
      properties: properties.length,
      inspectedDeposits,
      samples,
      treated,
    },
    fieldSummary: {
      propertiesByType: [
        countType(["RESIDENCIAL"]),
        countType(["COMERCIAL"]),
        countType(["TERRENO"]),
        countType(["PONTO_ESTRATEGICO"]),
        countType(["PREDIO", "ESCOLA", "UBS", "IGREJA", "INDUSTRIAL", "OUTRO"]),
        completedProperties.length,
      ],
      properties: [
        focalTreatments,
        perifocalTreatments,
        inspected,
        refusals + closed,
      ],
      samples: [samples],
      pending: [refusals, closed],
      depositsInspected: [
        ...depositsByType,
        depositsByType.reduce((total, value) => total + value, 0),
      ],
      depositsTreated: [
        sumForm((form) => form.depositosEliminados),
        uniqueText(forms.map((form) => form.larvicida1Tipo)),
        sumForm((form) => form.larvicida1Quantidade),
        sumForm((form) => form.larvicida1Depositos),
        uniqueText(forms.map((form) => form.larvicida2Tipo)),
        sumForm((form) => form.larvicida2Quantidade),
        sumForm((form) => form.larvicida2Depositos),
        sumForm((form) => form.perifocalCargas),
      ],
      adulticide: [
        uniqueText(forms.map((form) => form.perifocalTipo)),
        sumForm((form) => form.perifocalCargas),
      ],
      workedBlocks: workedBlocks.join(", "),
      completedBlocks: completedBlocks.join(", "),
    },
  };
}
