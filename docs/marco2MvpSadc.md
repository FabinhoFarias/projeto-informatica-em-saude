# Marco 2 — MVP e sistema de apoio à decisão do VIGIA+

> A identidade do produto foi atualizada de Denguinhos para **VIGIA+**. O nome comunica vigilância, integração de sinais e apoio à ação municipal sem sugerir diagnóstico individual.

## Adequação da interface ao projeto VIGIA+

**Adequado no protótipo:** a página inicial apresenta a proposta de vigilância territorial, conduz para mapa de hotspots e priorização, e deixa explícito que os dados são ilustrativos. O painel interno separa observação territorial, entendimento do sinal e coordenação da resposta. A rota `/hotspots` demonstra a concentração de posições de agentes e focos informados.

**Adequado com ressalvas:** a camada de atividade dos agentes mostra cobertura operacional, não risco epidemiológico. A interface precisa manter fonte, data, incerteza e estado demonstrativo visíveis quando dados reais forem conectados. O mapa atual é esquemático e não substitui base cartográfica municipal validada.

**Ainda necessário para o projeto completo:** conectar fontes autorizadas (SINAN, clima, focos e dados locais), definir unidade territorial e desfecho, registrar justificativas e revisão humana dos alertas, oferecer interface móvel para ACE/ACS, implementar autenticação e trilha de auditoria e validar usabilidade com gestores e equipes de campo. O MVP não deve ser apresentado como modelo validado ou como diagnóstico.

**Estado em 7/11/2026:** protótipo navegável com dados fictícios. Este documento organiza o que pode ser demonstrado na disciplina, o que precisa ser produzido pela equipe e o que permanece como produto futuro. Não atribui validação clínica, epidemiológica ou municipal ao protótipo. **Ainda não há evidência suficiente para declarar a entrega acadêmica concluída.**

## 1. Recorte da entrega

**Problema:** a coordenação municipal precisa reunir sinais de notificações, focos e pendências de visitas para decidir quais territórios revisar primeiro. **Persona principal:** gestor ou coordenador da Vigilância Ambiental; o ACE recebe o planejamento aprovado, e o epidemiologista valida sinais e critérios. Pacientes não são usuários do fluxo principal. A persona e a jornada completas estão no [documento de requisitos](documento_de_requisitos.md).

**Fluxo do MVP:** abrir `/priorizacao-territorial` → selecionar um bairro fictício → ler os quatro indicadores e os motivos da sinalização → registrar “Encaminhar para revisão” ou “Manter em observação” → ler onde os dados reais entrariam. A decisão dura somente até atualizar a página. As demais telas oferecem contexto e navegação, mas não são necessárias para provar o fluxo central.

**Ferramenta:** o protótipo existente foi implementado em **Next.js**, com regras em TypeScript, porque já havia uma base navegável no repositório. O roteiro da disciplina apresentado para o Marco 2 pede explicitamente um **MVP no-code**. Portanto, a versão atual **não atende esse item**. Para cumprir o roteiro como escrito, reproduzir o mesmo fluxo mínimo em Glide, Bubble, PowerApps ou AppSheet e testar seu link público. Looker Studio pode mostrar um painel, mas exige outra solução para registrar a decisão. Uma eventual aceitação do Next.js como substituto depende de confirmação expressa da docência; não apresentar o código como no-code.

### 1.1 O que já veio do Marco 1

O [arquivo editável do Marco 1](Denguinhos_Marco_1_editavel.pptx), no slide 4, descreve **gestor municipal**, **epidemiologista** e **ACS/ACE**, com suas dores. O slide 8 apresenta a priorização de bairros como protótipo conceitual, e o slide 10 lista os próximos passos. Para o Marco 2, escolher o **gestor/coordenador** como persona principal do fluxo, explicar por que as outras duas personas participam e revisar as frases com a equipe. A persona não precisa ser inventada do zero; falta comprovar sua validação com usuário real, caso isso seja cobrado.

## 2. Revisão do código e evidências

| Item | Evidência atual | Situação para a apresentação |
|---|---|---|
| Persona e papéis | [Requisitos](documento_de_requisitos.md), `lib/identidade/permissions.ts` | Gestor é a persona da demonstração; seleção de perfil no protótipo é didática, sem autenticação real. |
| Tela principal | `app/(dashboard)/priorizacao-territorial/page.tsx`, `components/priorizacao/priorizacao-territorial.tsx` | Fluxo navegável e interativo, sem servidor nem banco. |
| Dados fictícios | `lib/priorizacao/demo-data.ts` | Quatro bairros de exemplo. Números não provêm de SINAN, APS ou LIRAa. |
| Regra “se-então” | `evaluateDemoTerritory()` em `lib/priorizacao/rules.ts` | Critérios arbitrários e identificados como didáticos; não são limiares do Ministério da Saúde. |
| Explicação do sinal | Lista de motivos no painel de decisão | Mostra quais entradas acionaram a regra. |
| Decisão humana | Botões de encaminhamento/observação | Estado de sessão; ainda sem persistência, trilha de auditoria ou envio ao ACE. |
| Integração conceitual | Quadro “Onde os dados reais entrariam” | Explica fontes e etapas; não há conexão com RNDS, SINAN municipal, e-SUS APS ou SisPNCD. |
| UX e acessibilidade | Botões de pelo menos 44 px, estados `aria-pressed`, `aria-live`, foco visível, texto junto da cor | Verificar com pessoas externas e teclado; ainda não há laudo de acessibilidade. |
| Modelo preditivo | [Pipeline de pesquisa](../treinamentoDoModelo/README.md) | Separado do front. Nenhum número do protótipo é saída desse modelo. |
| Rotina completa ACE e operação municipal | [Requisitos](documento_de_requisitos.md) | Planejada/parcial; não confundir com a demonstração funcional do Marco 2. |

O banner global no front informa que dados, probabilidades e impactos são fictícios. Isso também se aplica às páginas antigas de visão geral, diagnóstico e simulação. Nelas ainda existem rótulos como “casos previstos” e “redução estimada”; **na apresentação, usar `/priorizacao-territorial` como fluxo principal** e deixar claro que as demais páginas são telas conceituais. Antes de uma demonstração pública para gestores, revisar essas páginas para impedir interpretação como previsões operacionais.

### 2.1 O que existe na rota de priorização territorial e como atende ao Marco 2

O nome da rota descreve sua função no produto, independentemente da disciplina: reunir sinais territoriais para que a coordenação escolha o que revisar. Ela aparece no menu como **Priorização territorial**. O Marco 2 é apenas o contexto da demonstração e da documentação.

| Elemento visível na rota | O que demonstrar | Item da entrega atendido | Limite que deve ser dito em voz alta |
|---|---|---|---|
| Título “Do sinal territorial à decisão da equipe” e descrição da persona gestora | Apresentar o problema e quem decide. | Fase 1: persona; fase 2: fluxo principal. | A persona ainda precisa ser conferida com o material do Marco 1 e usuários reais. |
| Banner global “Protótipo acadêmico · dados fictícios” | Mostrar antes de navegar pelos indicadores. | Fase 2: mockup de dados coerentes; fase 3: linguagem clara. | Nenhum valor é dado oficial ou previsão validada. |
| Três cartões de resumo: territórios, prioridade e decisões na sessão | Explicar rapidamente o estado do exemplo. | Fase 3: painel enxuto para gestor. | A contagem de decisões existe só na memória da página. |
| Lista de quatro bairros fictícios com distrito, notificações e nível | Selecionar Ibura, depois Boa Viagem e Madalena para mostrar saídas diferentes. | Fase 2: navegação e dados de exemplo; fase 3: comparação legível. | São cenários criados para testar a regra, não dados dos bairros reais. |
| Quatro indicadores do bairro selecionado | Ler notificações atuais/anteriores, focos e imóveis pendentes. | Fase 2: entradas usadas pelo SADC. | Não há importação ou atualização automática. |
| Caixa “Por que apareceu este sinal?” | Relacionar cada motivo às entradas e à regra “se-então”. | Fase 2: lógica explicável e alerta visual. | Os limiares são didáticos; o sinal não é diagnóstico nem alerta oficial de surto. |
| Sugestão de conferência e botões de decisão | Encaminhar para revisão ou manter em observação; mostrar o estado atualizado. | Fase 2: recomendação e fluxo de decisão humana. | O clique não gera tarefa real para ACE nem persiste após recarregar. |
| Quadro “Regra demonstrativa do SADC” e link para diretrizes do MS | Explicar a base do fluxo de vigilância e separar diretriz oficial de limiar inventado. | Fase 1: levantamento de protocolo; fase 2: regra “se-então”. | O MS não aprovou esta regra nem seus números. |
| Quadro “Onde os dados reais entrariam” | Percorrer fonte → validação → regra → revisão → ação. | Fase 2: integração conceitual com sistemas de saúde. | Não existe conexão com RNDS, SINAN municipal, e-SUS APS ou SisPNCD. |
| Botões grandes, foco visível, estado de seleção e mensagem acessível | Navegar com teclado e mostrar a mudança sem depender apenas da cor. | Fase 3: adequação da interface à persona. | Teste com pessoas externas ainda está pendente. |

**Fora da rota:** Canvas, CEIS, teste de usabilidade, vídeo, PDF e link público são evidências da apresentação, não funções do aplicativo. Também não existe versão no-code deste fluxo. Esses itens permanecem no checklist da seção 8.

## 3. Lógica do SADC e protocolo

| Condição demonstrativa | Saída | Ação permitida no MVP |
|---|---|---|
| Aumento de notificações fictícias ≥ 50% **e** (focos fictícios ≥ 5 **ou** imóveis fictícios pendentes ≥ 30) | Revisão prioritária | Sugerir conferência pela vigilância e planejamento pela coordenação. |
| Pelo menos um dos três sinais acima, sem a combinação prioritária | Acompanhar | Conferir registros e atualizar na semana seguinte. |
| Nenhum sinal | Rotina | Manter plano de trabalho já aprovado. |

A regra é **operacional e didática**, não clínica. O produto não classifica pacientes, não prescreve tratamento e não deve usar uma regra simplista do tipo “febre + manchas = dengue”. O Ministério da Saúde publica [diretrizes de prevenção e controle de epidemias](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/diretrizes_nacionais_prevencao_controle_dengue.pdf) para orientar vigilância e controle vetorial. Se a equipe decidir demonstrar triagem clínica no futuro, será necessário um fluxo separado, validado por profissionais habilitados e alinhado ao [manual oficial de diagnóstico e manejo clínico](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/dengue-diagnostico-e-manejo-clinico-adulto-e-crianca/view). Não chamar os números da tabela de “protocolo oficial”.

**Para sair do modo didático:** a prefeitura deve aprovar fonte, definição de caso/surto, janela temporal, limiares locais, cobertura dos dados, responsável pela revisão, prazo e conduta. O [plano de modelagem](modelagem/modeloPreditivoDengueNordeste.md) já descreve validação temporal, incerteza e monitoramento; nenhum desses resultados está conectado ao front de demonstração.

## 4. Integração conceitual e privacidade

`SINAN/fonte municipal autorizada → validação e agregação por território/semana → indicadores e versão da regra → revisão por epidemiologista → decisão da coordenação → tarefa ACE → retorno da ação`.

Para integração real, documentar contrato de dados, identificador territorial, origem e data de cada registro, permissões, deduplicação, atraso de notificação, logs e exportação para o fluxo oficial. O protótipo trabalha somente com agregados fictícios; não requer dados de pacientes. RNDS/e-SUS APS e sistemas de campo só devem ser integrados por interfaces e autorizações apropriadas. Isso está detalhado nas seções de integração e isolamento do [documento de requisitos](documento_de_requisitos.md).

## 5. UX, teste rápido e critério de aceite

Peça a três pessoas que não construíram o projeto para executar, sem orientação: abrir o protótipo, identificar o território prioritário, explicar por que recebeu o sinal, registrar uma decisão e dizer se os dados são reais. Marque sucesso/erro, tempo e hesitações. Teste também somente com teclado, em tela estreita e em aba anônima. Corrija os bloqueios observados; não declare “usabilidade validada” antes desse teste.

Aceite mínimo da demonstração: navegação sem travar; sinal e motivos legíveis sem depender só de cor; botão altera o estado visível; aviso de dados fictícios perceptível; integração futura descrita sem afirmar conexão ativa. A página não deve ser usada para decisões reais de saúde pública.

## 6. Canvas e CEIS para a disciplina

| Bloco | Hipótese de trabalho a apresentar | Validação pendente |
|---|---|---|
| Cliente | Prefeituras, via Vigilância Ambiental/Epidemiológica | Entrevistas com gestor, coordenação e ACE. |
| Usuário | Gestor decide; epidemiologista valida; ACE executa | Teste de jornada e permissões na cidade piloto. |
| Proposta de valor | Reduzir tempo entre sinal, revisão e ação documentada | Medir tempo de decisão, retrabalho e alertas úteis. |
| Canais | Piloto municipal, demonstração e parceria com equipes locais | Processo de contratação e integração por prefeitura. |
| Receita | Implantação + assinatura + serviços conforme [modelo de negócio](possiveis_modelos_de_negocios.md) | Custos e disposição a pagar; não apresentar preço hipotético como contrato. |
| Custos | Hospedagem, suporte, treinamento, manutenção dos dados e modelos | Estimativa com infraestrutura real e SLA. |
| Recursos/parcerias | Equipe técnica, epidemiologistas, prefeitura e fontes oficiais | Acordos, governança e sustentação. |

**Conexão com o CEIS:** potencial de economizar tempo de equipe e fortalecer desenvolvimento local de software aplicado ao SUS. Isso é uma hipótese de impacto; não afirmar redução de casos ou custos sem estudo. Sustentação depende de implantação, suporte, atualização dos protocolos, manutenção de integrações e financiamento recorrente. A [análise de concorrentes](analiseConcorrentesDenguinhos.md) ajuda a explicar por que um novo painel isolado não basta.

### 6.1 Diagnóstico de conclusão da entrega

“Pronto” significa que há material ou comportamento verificável no repositório. “Parcial” significa que há base, mas falta uma evidência exigida pelo roteiro. “Pendente” significa que o artefato da apresentação ainda não foi encontrado aqui; não presume que a equipe não o tenha fora do repositório.

| Exigência do roteiro recebido | Estado | O que já pode entrar na apresentação | O que falta para fechar |
|---|---|---|---|
| Problema e persona do Marco 1 | **Parcial** | Slide 4 do [Marco 1](Denguinhos_Marco_1_editavel.pptx) e recorte do gestor nesta seção. | Revisar com o grupo e, se solicitado, mostrar evidência de validação com usuário. |
| Ferramenta no-code | **Pendente** | O fluxo Next.js serve como especificação visual e funcional. | Escolher ferramenta no-code, construir o fluxo equivalente e obter link público; ou autorização expressa da docência para substituir esse requisito. |
| Protocolo oficial e lógica do SADC | **Parcial** | [Diretrizes de prevenção e controle da dengue](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/diretrizes_nacionais_prevencao_controle_dengue.pdf), regra e limites da seção 3. | Preparar um slide que separe **o que vem da diretriz** dos limiares didáticos criados pela equipe. Se for exigida lógica *clínica*, confirmar com a docência o recorte operacional ou desenvolver outro fluxo com validação profissional. |
| Fluxo principal e dados fictícios | **Pronto no protótipo em código** | Rota `/priorizacao-territorial`, quatro territórios, indicadores e três níveis de sinal. | Reproduzir no no-code para cumprir literalmente a entrega. |
| Alerta, explicação e decisão | **Pronto no protótipo em código** | Motivos do sinal, sugestão de revisão e botões com estado visível. | Reproduzir no no-code; não alegar persistência ou envio real de tarefa. |
| Integração conceitual | **Pronto** | Quadro na rota e fluxo da seção 4. | Diagramar em um slide simples; não mostrar RNDS/e-SUS como integração ativa. |
| UX e acessibilidade | **Parcial** | Aviso de simulação, botões grandes, foco e texto além de cor. | Teste rápido com pessoas externas, teclado e celular; registrar achados e ajustes. |
| Canvas e CEIS | **Parcial** | Hipóteses da seção 6 e [modelo de negócio](possiveis_modelos_de_negocios.md). | Transformar em Canvas visual atualizado; estimar custos de operação com premissas e anexar o que foi aprendido no teste. |
| Slides do Marco 2 | **Pendente** | Estrutura e falas sugeridas na seção 7; apresentação do Marco 1 pode fornecer contexto. | Criar slides próprios, dividir falas e ensaiar 20–30 minutos. |
| Vídeo de contingência | **Pendente** | Sequência da demonstração na seção 7. | Gravar screencast, conferir áudio/legibilidade e testar reprodução sem internet. |
| PDF de até 5 MB | **Pendente** | Apresentação do Marco 1 existe em PPTX, mas não é o PDF do Marco 2. | Exportar slides finais, verificar tamanho e abrir o PDF exportado. |
| Link público por sete dias | **Pendente** | Rota local documentada. | Publicar o protótipo aceito pela disciplina, testar em aba anônima e confirmar prazo de disponibilidade. |

**Caminho crítico:** decidir a ferramenta no-code ou obter a exceção da docência → produzir o protótipo público → testar com pessoas externas → fechar Canvas e slides → gravar vídeo → exportar e verificar PDF → ensaiar a apresentação. Essas são dependências da entrega, não funcionalidades adicionais do modelo de dengue.

## 7. Apresentação de 20–30 minutos

| Tempo sugerido | Conteúdo | Evidência |
|---|---|---|
| 0–4 min | Problema, persona e jornada | Uma situação concreta da coordenação municipal. |
| 4–8 min | Solução e limites da regra | Tabela do SADC e diretrizes do Ministério; explicar que limiares são didáticos. |
| 8–16 min | Demonstração ao vivo | `/priorizacao-territorial`: comparar bairros, abrir Ibura, mostrar motivos, registrar decisão e integração conceitual. |
| 16–20 min | UX e teste | Avisos de simulação, acessibilidade e resultados de três testes externos quando feitos. |
| 20–25 min | Canvas, CEIS e sustentabilidade | Hipóteses de valor, custo e contratação. |
| 25–30 min | Limitações, próximos passos e perguntas | Piloto, dados reais e validação prospectiva. |

Dividir os blocos entre **todos os integrantes** e ensaiar com cronômetro. Os nomes e a ordem dos apresentadores devem ser preenchidos pela equipe. Gravar um vídeo de 2–3 minutos navegando no fluxo e inseri-lo ou vinculá-lo nos slides como plano B; o vídeo não está produzido neste repositório.

### 7.1 Roteiro de slides pronto para montar

Use cerca de **10 slides em 25 minutos**, deixando até cinco minutos para perguntas ou atrasos. O [PPTX do Marco 1](Denguinhos_Marco_1_editavel.pptx) é fonte de contexto, não a apresentação final. Os nomes abaixo são os que aparecem naquele arquivo; a equipe deve confirmar participação e ordem antes de usar.

| Slide e duração | Conteúdo que deve aparecer | Fala e demonstração | Evidência/pendência |
|---|---|---|---|
| 1. Abertura — 1 min | Nome Denguinhos, pergunta central “Como priorizar a revisão territorial?” e equipe. | Situar que é um MVP acadêmico com dados fictícios. | Criar slide novo. |
| 2. Problema e persona — 3 min | Dor do gestor, decisão que precisa tomar e participação de epidemiologista e ACE. | Retomar as personas do slide 4 do Marco 1. Exemplo: “A coordenação precisa saber que território merece conferência primeiro e justificar a decisão.” | Material de origem existe; revisar afirmações com a equipe. |
| 3. Jornada antes/depois — 2 min | Antes: sinais dispersos → revisão manual; MVP: indicadores → regra → decisão registrada na sessão. | Mostrar qual parte do trabalho o protótipo simplifica, sem alegar economia medida. | Diagrama a produzir. |
| 4. SADC e fonte oficial — 3 min | Tabela da seção 3 com entradas, condição, saída e responsável humano; link/rodapé da diretriz do MS. | Dizer explicitamente: “As diretrizes fundamentam a vigilância; os números 50%, 5 e 30 foram criados para demonstrar a lógica, não são limiares oficiais.” | Conteúdo documentado; slide a produzir. |
| 5. Demo ao vivo — 6 min | Tela `/priorizacao-territorial` como referência; apresentar o link no-code na entrega, salvo exceção autorizada pela docência. | Selecionar Ibura, ler os quatro indicadores e os motivos; comparar Boa Viagem e Madalena; voltar a Ibura e clicar em “Encaminhar para revisão”. Mostrar que o estado muda. | Funciona no protótipo em código; faltam versão no-code e link público. |
| 6. Integração conceitual — 2 min | Fluxo da seção 4 com fonte → validação → regra → revisão → tarefa ACE. | Apontar precisamente onde SINAN, registros de campo e eventual APS entrariam. Dizer que não há integração ativa. | Quadro já existe na tela; slide a produzir. |
| 7. UX e acessibilidade — 2 min | Aviso de dados fictícios, foco de teclado, texto junto da cor, tamanho dos controles e dois achados de teste. | Mostrar uma navegação curta com teclado. Não inventar resultados de usuários. | Teste externo e registro dos achados pendentes. |
| 8. Canvas e CEIS — 3 min | Cliente, valor, canal, custos e receita em um Canvas enxuto; argumento de eficiência do SUS e inovação local. | Diferenciar hipótese de impacto de economia comprovada. | Canvas visual e estimativas pendentes. |
| 9. Limitações e próximos passos — 2 min | Sem dados reais, sem validação de limiares, sem persistência; piloto e integração condicionados a autorização. | Explicar que o modelo de pesquisa não alimenta o front. | Conteúdo já documentado. |
| 10. Encerramento — 1 min | Uma frase de valor e convite a perguntas. | Repetir a decisão que o MVP permite ensaiar. | Criar slide novo. |

**Divisão sugerida para três integrantes (ajustável):** Fábio apresenta slides 1–3; Jamilly, slides 4–6 e a demonstração; Raniele, slides 7–10. Cada pessoa deve falar e ensaiar sua parte. Se os integrantes forem outros, redistribuir os blocos mantendo o tempo total.

**Plano B da demo:** gravar exatamente a sequência do slide 5, com cursor visível e zoom legível, em vídeo local de 2–3 minutos. Incorporar o arquivo aos slides ou manter cópia offline testada no computador da apresentação. O link do protótipo continua necessário quando exigido; o vídeo cobre apenas falha de internet durante a fala.

**Conferência final dos artefatos:** anotar o URL público e data até a qual ficará ativo; abrir em janela anônima sem sessão da equipe; exportar o PDF; confirmar tamanho `≤ 5 MB`, abrir e percorrer todas as páginas; verificar que o vídeo toca offline; cronometrar o ensaio completo com troca de apresentadores. Guardar capturas ou uma ata simples desses testes.

## 8. Checklist da entrega

- [x] Fluxo principal navegável com dados fictícios e regra “se-então” visível.
- [x] Alerta explicado e decisão interativa de demonstração.
- [x] Fonte oficial de vigilância documentada e integração futura representada.
- [x] Aviso claro de que o front usa dados fictícios.
- [ ] Revisar a persona do slide 4 do Marco 1 com a equipe e registrar evidência de validação com usuário, se exigida.
- [ ] Construir o fluxo mínimo em ferramenta **no-code** e publicar o link; somente substituir essa etapa se houver autorização expressa da docência.
- [ ] Preparar slide que distingue diretriz oficial, regra didática e eventual protocolo clínico exigido pela disciplina.
- [ ] Executar testes de usabilidade com pessoas externas e registrar resultados.
- [ ] Revisar Canvas com o aprendizado dos testes e atribuir responsáveis pelos blocos da fala.
- [ ] Produzir os dez slides da seção 7.1, atribuir falas, ensaiar 20–30 minutos e gravar vídeo de contingência.
- [ ] Exportar PDF, verificar tamanho máximo de 5 MB e abrir o arquivo exportado.
- [ ] Publicar protótipo, testar link sem senha em aba anônima e garantir disponibilidade por sete dias após a apresentação.

**Comandos locais:** `npm install`, `npm run dev`, abrir `http://localhost:3000/priorizacao-territorial`. O link público, o PDF, o vídeo e a validação humana não podem ser concluídos apenas editando o repositório.
