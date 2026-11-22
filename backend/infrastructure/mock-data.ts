export const mockApiData = {
  usuarios: [
    { id: "u-4", nome: "João Pedro Alves", funcao: "CAMPO", status: "ATIVO" },
    { id: "u-5", nome: "Ana Cláudia Melo", funcao: "CAMPO", status: "ATIVO" },
    { id: "u-8", nome: "Lucas Barros", funcao: "CAMPO", status: "INATIVO" },
    {
      id: "u-10",
      nome: "Rafael Gomes da Silva",
      funcao: "CAMPO",
      status: "ATIVO",
    },
  ],
  territorios: [
    { id: "centro", nome: "Centro", zona: "Urbana" },
    { id: "nova-itaenga", nome: "Nova Itaenga", zona: "Urbana" },
    { id: "vila-boa-esperanca", nome: "Vila Boa Esperança", zona: "Urbana" },
    { id: "bom-jesus", nome: "Bom Jesus", zona: "Urbana" },
  ],
  ciclos: [
    { id: "ciclo-2026-6", nome: "novembro–dezembro / 2026", status: "ATIVO" },
    {
      id: "ciclo-2026-5",
      nome: "setembro–outubro / 2026",
      status: "ENCERRADO",
    },
  ],
  cobertura: {
    cicloId: "ciclo-2026-6",
    atribuidos: 996,
    visitados: 582,
    pendentes: 414,
    percentual: 58,
  },
  amostras: [
    {
      id: "amostra-001",
      imovelId: "property-1",
      status: "RECEBIDA",
      resultado: null,
    },
    {
      id: "amostra-002",
      imovelId: "property-3",
      status: "PENDENTE",
      resultado: null,
    },
  ],
  estoque: [
    {
      id: "bti",
      nome: "Larvicida biológico Bti",
      saldo: 840,
      unidade: "gramas",
    },
    { id: "diflu", nome: "Diflubenzuron", saldo: 180, unidade: "gramas" },
    {
      id: "tubitos",
      nome: "Tubitos para coleta",
      saldo: 92,
      unidade: "unidades",
    },
  ],
};
