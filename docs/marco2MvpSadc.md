# Marco 2 — MVP e sistema de apoio à decisão do Denguinhos

**Estado em 7/11/2026:** protótipo navegável com dados fictícios. Este documento organiza o que pode ser demonstrado na disciplina, o que precisa ser produzido pela equipe e o que permanece como produto futuro. Não atribui validação clínica, epidemiológica ou municipal ao protótipo.

## 1. Recorte da entrega

**Problema:** a coordenação municipal precisa reunir sinais de notificações, focos e pendências de visitas para decidir quais territórios revisar primeiro. **Persona principal:** gestor ou coordenador da Vigilância Ambiental; o ACE recebe o planejamento aprovado, e o epidemiologista valida sinais e critérios. Pacientes não são usuários do fluxo principal. A persona e a jornada completas estão no [documento de requisitos](documento_de_requisitos.md).

**Fluxo do MVP:** abrir `/priorizacao-territorial` → selecionar um bairro fictício → ler os quatro indicadores e os motivos da sinalização → registrar “Encaminhar para revisão” ou “Manter em observação” → ler onde os dados reais entrariam. A decisão dura somente até atualizar a página. As demais telas oferecem contexto e navegação, mas não são necessárias para provar o fluxo central.

**Ferramenta:** o protótipo existente foi implementado em **Next.js**, com regras em TypeScript, porque já havia uma base navegável no repositório. Isso **não atende literalmente** a uma exigência de ferramenta no-code. Se a avaliação da disciplina exigir Glide, Bubble, PowerApps, AppSheet ou Looker Studio, a equipe deve reproduzir o mesmo fluxo mínimo em uma dessas plataformas e testar seu link público. Não apresentar o Next.js como no-code. Looker Studio pode mostrar o painel, mas não substitui facilmente o registro da decisão; a escolha da ferramenta deve considerar essa interação.

## 2. Revisão do código e evidências

| Item | Evidência atual | Situação para a apresentação |
|---|---|---|
| Persona e papéis | [Requisitos](documento_de_requisitos.md), `lib/rbac.ts` | Gestor é a persona da demonstração; seleção de perfil no protótipo é didática, sem autenticação real. |
| Tela principal | `app/(dashboard)/priorizacao-territorial/page.tsx`, `components/marco-dois-demo.tsx` | Fluxo navegável e interativo, sem servidor nem banco. |
| Dados fictícios | `lib/marco-dois-rules.ts` | Quatro bairros de exemplo. Números não provêm de SINAN, APS ou LIRAa. |
| Regra “se-então” | `evaluateDemoTerritory()` em `lib/marco-dois-rules.ts` | Critérios arbitrários e identificados como didáticos; não são limiares do Ministério da Saúde. |
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

## 8. Checklist da entrega

- [x] Fluxo principal navegável com dados fictícios e regra “se-então” visível.
- [x] Alerta explicado e decisão interativa de demonstração.
- [x] Fonte oficial de vigilância documentada e integração futura representada.
- [x] Aviso claro de que o front usa dados fictícios.
- [ ] Revisar persona do Marco 1 com a equipe e registrar evidência da entrevista.
- [ ] Confirmar com a disciplina se **no-code é obrigatório**; se for, reconstruir o fluxo mínimo na ferramenta escolhida.
- [ ] Executar testes de usabilidade com pessoas externas e registrar resultados.
- [ ] Revisar Canvas com o aprendizado dos testes e atribuir responsáveis pelos blocos da fala.
- [ ] Produzir slides, ensaiar 20–30 minutos e gravar vídeo de contingência.
- [ ] Exportar PDF, verificar tamanho máximo de 5 MB e abrir o arquivo exportado.
- [ ] Publicar protótipo, testar link sem senha em aba anônima e garantir disponibilidade por sete dias após a apresentação.

**Comandos locais:** `npm install`, `npm run dev`, abrir `http://localhost:3000/priorizacao-territorial`. O link público, o PDF, o vídeo e a validação humana não podem ser concluídos apenas editando o repositório.
