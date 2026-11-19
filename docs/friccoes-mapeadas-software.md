# Mapa de fricções do VIGIA+

Documento de diagnóstico estático para a atividade de redesign. A análise foi feita sobre as rotas e componentes atuais do protótipo. Ela identifica hipóteses de fricção que ainda precisam ser confirmadas em uma caminhada cognitiva ou teste com usuários reais.

## Resumo executivo

As maiores fricções estão concentradas em quatro pontos:

1. O ACE precisa navegar por muitos módulos para concluir uma tarefa de campo.
2. O gestor encontra cobertura territorial e acompanhamento de ACEs em locais diferentes.
3. O sistema ainda informa mock, ausência de persistência e integração futura em vários pontos, o que pode reduzir confiança na demonstração.
4. Há fluxos importantes com seleção de território, ciclo e atividade, mas sem uma visão única da consequência da escolha.

## Escala

- **Alta:** pode impedir a conclusão da tarefa ou gerar erro operacional.
- **Média:** aumenta tempo, cliques ou carga cognitiva.
- **Baixa:** desconforto visual ou inconsistência que não impede o fluxo.

## 1. ACE de campo

| Fricção | Evidência no software | Impacto | Prioridade |
| --- | --- | --- | --- |
| Encontrar o próximo imóvel exige interpretação da lista e do agrupamento | `/visitas` oferece organização por quarteirão/rua, busca, ciclo e cards de situação | O ACE pode não saber qual imóvel deve priorizar | Alta |
| Estados dependem de cor | Cards usam verde, amarelo e branco/vermelho para situação da visita | Usuários com baixa visão ou daltonismo podem não distinguir estados | Alta |
| O contexto do ciclo pode ficar distante do formulário | O ciclo é escolhido na lista e a ficha é aberta em outra rota | Risco de registrar uma visita no ciclo errado | Alta |
| A ficha possui muitos grupos de campos | `property-visit-form.tsx` reúne depósitos, amostra, tratamento, ocorrência e atividade | Sobrecarga cognitiva em uso no celular ou sob sol | Alta |
| Não há resumo persistente do que foi salvo antes de sair | O registro é mockado e o feedback fica concentrado no botão/estado | ACE pode repetir ou acreditar que perdeu a visita | Alta |
| Histórico e retornos aparecem apenas quando existe visita anterior | `property-operation-support.tsx` oculta o painel em imóveis nunca visitados | Regra correta, mas pouco explícita para o usuário | Média |
| Funções operacionais podem não estar visíveis durante a tarefa | Funções do usuário são configuradas em `/usuarios`, mas não aparecem no fluxo da visita | ACE pode abrir uma atividade que não pertence à sua função | Média |

### Hipótese de melhoria

Na entrada de `/visitas`, mostrar uma fila “Próxima ação” com ciclo, quarteirão, imóvel, pendência e botão direto para a ficha. Na ficha, manter um resumo fixo do imóvel e do ciclo, com confirmação de salvamento e sincronização.

## 2. Laboratório e coleta

| Fricção | Evidência | Impacto | Prioridade |
| --- | --- | --- | --- |
| Fila, resumo, recebimento e análise são componentes separados | `sample-queue`, `sample-summary`, `sample-timeline` e `analysis-form` | Laboratorista pode alternar excessivamente entre blocos | Média |
| O vínculo com o imóvel depende de abrir outra rota | O resumo possui link para a visita | Quebra do contexto da amostra | Média |
| Estados de amostra precisam ser interpretados | Recebida, pendente, analisada e resultado aparecem em componentes diferentes | Pode haver confusão entre pendente e resultado negativo | Alta |
| A fila não evidencia prioridade ou prazo | A ordenação é demonstrativa | Amostras urgentes podem não se destacar | Média |

### Hipótese de melhoria

Exibir no mesmo painel código da amostra, imóvel, ACE, data, estado, prazo e próxima ação. Usar uma linha do tempo curta e linguagem operacional (“receber”, “analisar”, “registrar resultado”).

## 3. Gestor e cobertura

| Fricção | Evidência | Impacto | Prioridade |
| --- | --- | --- | --- |
| Cobertura municipal e cobertura individual ficam separadas | `/painel` mostra cards de ACE; `/usuarios/ace/[id]` mostra o histórico detalhado | Gestor precisa abrir vários perfis para comparar agentes | Média |
| A atribuição territorial está em outra rota | `/territorio-conferencia` atribui setores; painel mostra cobertura | Difícil entender o efeito da atribuição antes de salvar | Alta |
| Ação específica por bairro fica dentro do planejamento, mas não aparece na cobertura | `/planejamento` cria ações; `/painel` apresenta cobertura agregada | Gestor não vê se a ação foi concluída | Alta |
| Cobertura pode ser confundida com desempenho clínico | Indicadores de cobertura estão próximos de outros dados operacionais | Risco de interpretação indevida | Média |
| Meta e faixa de cobertura são mockadas | Perfil do ACE mostra meta de 80% e faixa de desempenho | Usuário pode interpretar como política municipal real | Média |
| Muitos módulos aparecem para o gestor | Sidebar reúne ingestão, mapas, saneamento, estoque, laboratório e planejamento | Sobrecarga e dificuldade para escolher a próxima ação | Alta |

### Hipótese de melhoria

Criar uma visão “Minha equipe” com comparação entre ACEs, setores atribuídos, cobertura, pendências e última sincronização. A atribuição de setor deve mostrar uma prévia: ACE escolhido, imóveis previstos e impacto na cobertura.

## 4. Planejamento por ciclo

| Fricção | Evidência | Impacto | Prioridade |
| --- | --- | --- | --- |
| Ciclo, atividades e ações específicas estão na mesma página, mas em blocos longos | `/planejamento` reúne configuração, seleção, ação por bairro e revisão | Pode exigir rolagem extensa e dificultar revisão | Média |
| Atividades múltiplas não mostram dependências | Levantamento, tratamento, recuperação e PE podem ser selecionados juntos | Gestor pode não perceber ordem ou responsável | Alta |
| Ações específicas não têm responsável visível | O formulário registra nome, atividade e bairro, mas não ACE/equipe | Ação pode ficar sem executor definido | Alta |
| Publicação não apresenta resumo final suficiente | Botão publica o ciclo, mas o resumo pode não mostrar todas as atribuições | Risco de publicar configuração incompleta | Alta |

### Hipótese de melhoria

Dividir a tela em etapas curtas: período → atividades → territórios → responsáveis → ações específicas → revisão/publicação. Antes de publicar, apresentar um resumo com contagem de ACEs, bairros, imóveis, atividades e ações sem responsável.

## 5. Digitação e relatórios

| Fricção | Evidência | Impacto | Prioridade |
| --- | --- | --- | --- |
| Tela concentra transcrição e consolidados | `digitization-workspace` renderiza formulário, fichas da sessão e relatórios na mesma página | Digitador pode perder a posição do formulário | Média |
| Identificador de documento e parâmetros aparecem abaixo do relatório | Rastreabilidade está presente, mas pode exigir rolagem | Dificulta conferência rápida | Baixa |
| Origem papel exige confirmação adicional | Há checkbox de conferência da ficha física | Segurança necessária, mas deve explicar por que é obrigatória | Baixa |
| Dados mockados podem parecer produção real | Fichas e consolidados usam exemplos | Risco de credibilidade na apresentação | Média |

### Hipótese de melhoria

Usar abas ou seções claramente nomeadas: “Transcrever ficha”, “Fichas da sessão” e “Consolidados”. Manter a origem PAPEL e a confirmação, mas explicar a finalidade com ajuda contextual.

## 6. Administração e usuários

| Fricção | Evidência | Impacto | Prioridade |
| --- | --- | --- | --- |
| Perfil de acesso e função operacional são conceitos diferentes | A tela agora permite múltiplas funções para um usuário | Sem explicação, administrador pode escolher o papel errado | Alta |
| Muitos filtros em uma única área | Usuários possuem busca, perfil, território e status | Pode aumentar o tempo para encontrar um ACE | Média |
| Regra de horário dos ACEs ainda não está visível como política operacional | RNF-017 está documentado, mas a tela de configuração do horário ainda não foi implementada | Gestor pode não saber como reduzir exposição fora do expediente | Alta |
| Fotos e identidade visual dependem de dados mockados | Avatares usam imagens externas demonstrativas | Pode gerar inconsistência ou indisponibilidade | Baixa |

## 7. Fricções transversais

| Fricção | Impacto |
| --- | --- |
| O mesmo conceito aparece como bairro, setor, microárea e quarteirão sem uma legenda persistente | Usuário pode não entender a hierarquia territorial |
| Estados de mock, futuro e integrado aparecem em textos diferentes | Pode confundir o que já funciona de verdade |
| Rótulos de rota e permissões estão separados, mas a navegação ainda pode mostrar opções diferentes do fluxo do perfil | Excesso de opções ou ausência de contexto |
| Mensagens de erro técnicas do Google Maps podem aparecer para usuário final | Reduz credibilidade e acessibilidade |
| Mudanças de rota exigem reorientação pelo header e sidebar | A tarefa principal não fica sempre evidente |
| A responsividade é tratada por rota, sem um teste consolidado por dispositivo | Risco de sobreposição em celular/tablet |

## 8. Plano de validação

### Teste ACE

1. Abrir a rota de visitas;
2. Localizar o próximo imóvel não visitado;
3. Registrar uma visita com depósito;
4. Salvar;
5. Confirmar o estado da sincronização;
6. Encontrar um retorno pendente.

Medir cliques, tempo, erros e compreensão do estado salvo.

### Teste gestor

1. Criar um ciclo com três atividades;
2. Criar uma ação no bairro específico;
3. Atribuir o bairro a um ACE;
4. Abrir o perfil completo do ACE;
5. Conferir cobertura, pendências e histórico;
6. Alterar a atribuição.

Medir se o gestor identifica o responsável, a meta, a origem da cobertura e o impacto da alteração.

## 9. Priorização para o redesign

### Prioridade 1 — segurança e conclusão da tarefa

- Feedback de salvamento e sincronização;
- Contexto fixo de ciclo e território;
- Ação específica com responsável;
- Prévia antes de publicar ciclo;
- Estados não dependentes apenas de cor.

### Prioridade 2 — redução de cliques

- Fila de próxima ação do ACE;
- Visão comparativa da equipe do gestor;
- Prévia de cobertura na atribuição territorial;
- Resumo de amostras e próxima ação.

### Prioridade 3 — polimento

- Redução de rolagem em digitação;
- Legendas territoriais persistentes;
- Mensagens mais simples;
- Tratamento visual dos dados mockados.

## 10. Limitações do diagnóstico

Esta varredura é estática e baseada no código e nas rotas disponíveis. Ela não substitui teste com ACE, gestor, digitador, laboratorista ou usuário com baixa visão. As fricções devem ser confirmadas com observação de uso antes de serem apresentadas como resultados mensurados.
