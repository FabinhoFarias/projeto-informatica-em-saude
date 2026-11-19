const descriptions: Record<string, string> = {
  Atividade: "Modalidade do trabalho realizado nesta visita.",
  "Acesso ao imóvel":
    "Informe se a entrada foi permitida, recusada ou se o imóvel estava fechado.",
  "Tipo da visita":
    "Normal é a visita de rotina; recuperação é uma nova tentativa após uma pendência.",
  Supervisor: "Profissional responsável pela supervisão do trabalho de campo.",
  "Nº do quarteirão": "Número do quarteirão no cadastro territorial do setor.",
  "Sequência do quarteirão": "Ordem do imóvel no percurso do quarteirão.",
  Lado: "Lado do quarteirão em que o imóvel está cadastrado.",
  "Nome do logradouro": "Nome da rua, avenida ou travessa do endereço.",
  Número: "Número do imóvel no endereço cadastrado.",
  "Sequência do número":
    "Identificador complementar para diferenciar imóveis com o mesmo número.",
  Complemento:
    "Informação adicional do endereço, como bloco, apartamento ou fundos.",
  "Hora de entrada": "Horário em que o agente iniciou a visita ao imóvel.",
  "Imóvel LI":
    "Indique se o imóvel foi inspecionado para levantamento de índice.",
  "Levantamento de índice":
    "Indique se o imóvel foi inspecionado para o levantamento de índice.",
  "Nº da amostra inicial":
    "Primeiro código de identificação da coleta; não representa a quantidade de exemplares.",
  "Nº da amostra final": "Último código de identificação informado na coleta.",
  "Quantidade de tubitos":
    "Número de recipientes usados para acondicionar o material coletado.",
  "Depósitos eliminados":
    "Quantidade de recipientes eliminados durante a visita.",
  "Imóvel tratado":
    "Informe se houve tratamento no imóvel durante esta atividade.",
  "Número da ficha de papel":
    "Identificação da ficha física que está sendo transcrita.",
  "ACE responsável pela ficha":
    "Agente que executou a atividade em campo e preencheu o papel.",
  "Data da atividade":
    "Dia em que a visita ocorreu, independentemente da data da digitação.",
  Imóvel: "Selecione o endereço de origem da ficha física.",
  "Resultado do acesso":
    "Situação encontrada pelo ACE: visita realizada, imóvel fechado ou recusa.",
  "Origem do registro":
    "Indica que os dados foram transcritos de uma ficha preenchida em papel.",
  A1: "Depósitos elevados de armazenamento de água, como caixas d’água.",
  A2: "Depósitos de armazenamento de água ao nível do solo, como tonéis e barris.",
  B: "Depósitos móveis, como vasos, pratos e recipientes transportáveis.",
  C: "Depósitos fixos, como calhas e estruturas que acumulam água.",
  D1: "Pneus e outros materiais rodantes que podem acumular água.",
  D2: "Resíduos e recipientes descartados que podem acumular água.",
  E: "Depósitos naturais, como ocos de árvores e cavidades naturais.",
};

function explanation(label: string) {
  if (descriptions[label]) return descriptions[label];
  if (label.startsWith("Data")) return descriptions["Data da atividade"];
  if (label.includes("tipo"))
    return "Nome do produto utilizado e registrado na ficha da atividade.";
  if (label.includes("depósitos tratados"))
    return "Número de depósitos que receberam este produto durante a visita.";
  if (label.includes("quantidade"))
    return "Quantidade aplicada, respeitando a unidade indicada no campo.";
  return "Anote informações relevantes da atividade, conforme a ficha de campo.";
}

/** Ajuda disponível por mouse, teclado, toque e leitura assistiva. */
export function FieldHelp({ label }: { label: string }) {
  return (
    <span
      tabIndex={0}
      className="group relative inline-block cursor-help outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {label}
      <span className="ml-1 text-slate-500" aria-hidden="true">
        ⓘ
      </span>
      <span className="sr-only">. {explanation(label)}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-60 max-w-[75vw] rounded-md bg-slate-900 p-3 text-left text-xs font-normal leading-5 text-white shadow-lg group-hover:block group-focus:block"
      >
        {explanation(label)}
      </span>
    </span>
  );
}
