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
  };
}
