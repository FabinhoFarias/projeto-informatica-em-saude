# Entrega de redesign, adesão e otimização de fluxo

Este documento organiza a atividade de redesign do VIGIA+ com base nos critérios da disciplina. Ele descreve o que deve ser analisado, quais evidências precisam ser produzidas e como apresentar a evolução do protótipo. Esta etapa é documental: não altera o código do projeto.

## 1. Objetivo

Demonstrar que a interface foi revisada para reduzir fricção, cliques desnecessários e sobrecarga cognitiva sem comprometer segurança clínica, acessibilidade, rastreabilidade ou conformidade com a LGPD.

O redesign deve ser avaliado por perfil de usuário. O VIGIA+ possui, principalmente, os seguintes fluxos:

| Perfil | Tarefa principal a observar |
| --- | --- |
| ACE de campo | Encontrar o imóvel, registrar a visita e consultar pendências/retornos |
| ACE laboratorista | Registrar coleta, tubitos, recebimento e resultado da amostra |
| Digitador | Transcrever ficha de papel e gerar consolidados |
| Gestor | Conferir cobertura, atribuir setores, acompanhar ACEs e planejar o ciclo |
| Administrador | Configurar prefeitura, usuários, módulos e políticas de acesso |
| Profissional APS | Consultar informações autorizadas e alertas operacionais |

## 2. Fundamentação teórica

### 2.1 Customização e sobrecarga cognitiva

Excesso de dados pode gerar estresse e dificultar a adesão. A tela inicial e a navegação devem mostrar o que é relevante para o perfil ativo, deixando funções avançadas e dados preditivos restritos aos usuários autorizados.

Perguntas para a revisão:

- O usuário sabe qual é a próxima ação em até três segundos?
- Há informações que não ajudam na tarefa atual?
- O mesmo dado aparece repetido em telas diferentes?
- A navegação pode ser resumida sem esconder uma decisão importante?

### 2.2 Acessibilidade e inclusão

O protótipo deve funcionar para pessoas com baixa visão, baixo letramento digital, pouca familiaridade tecnológica e uso em ambientes externos.

Verificar:

- contraste suficiente;
- textos legíveis em celular e tablet;
- alvos de toque grandes;
- linguagem simples;
- ícones acompanhados de texto quando necessário;
- foco visível e navegação por teclado;
- mensagens que expliquem o que aconteceu e qual é o próximo passo;
- ausência de dependência exclusiva de cor;
- redução de elementos que dificultem o uso sob luz solar.

### 2.3 Feedback e reforço

Reduzir telas não significa eliminar feedback. Toda ação importante deve produzir uma resposta clara:

- salvamento confirmado;
- erro explicado próximo ao campo;
- sincronização com estado visível;
- conflito ou pendência destacado;
- publicação do ciclo confirmada;
- bloqueio por horário acompanhado de justificativa;
- ação irreversível precedida de confirmação.

## 3. Fase 1 — Diagnóstico e caminhada cognitiva

### 3.1 Usuário menos propenso à adesão

O grupo deve escolher um perfil para a caminhada. Para o VIGIA+, recomenda-se iniciar pelo ACE de campo em celular, pois ele pode trabalhar sob sol, com conectividade limitada e com baixa disponibilidade para navegar por menus.

### 3.2 Tarefa de referência

Tarefa recomendada:

> Encontrar um imóvel não visitado, abrir sua ficha, registrar a visita, informar depósitos inspecionados e salvar o resultado.

Registrar:

1. tela inicial;
2. quantidade de cliques;
3. quantidade de trocas de rota/tela;
4. campos que exigem digitação repetida;
5. momentos de dúvida;
6. feedback recebido;
7. tempo estimado para concluir;
8. riscos de erro ou exposição de dados.

### 3.3 Perguntas obrigatórias

- O usuário entende a próxima ação em três segundos?
- Onde está a principal fricção?
- O usuário reconhece o imóvel e o ciclo atual?
- É possível reunir etapas sem perder segurança clínica?
- Quais dados poderiam vir do cadastro territorial ou de outro sistema?
- O usuário sabe se o registro foi salvo, está pendente ou foi sincronizado?

## 4. Fase 2 — Redesign e otimização

### Regra de decisão

Para cada tela removida, campo agrupado ou botão adicionado, registrar se a mudança aumenta:

- **Useful** — utilidade para a tarefa;
- **Usable** — facilidade de uso;
- **Credible** — confiança, rastreabilidade e segurança.

Uma alteração só deve ser mantida quando não prejudicar os três critérios.

### O que priorizar no VIGIA+

- Mostrar ao ACE primeiro os imóveis não visitados;
- Manter o ciclo e o setor visíveis no contexto da visita;
- Trazer bairro, setor, quarteirão e tipo de imóvel do cadastro;
- Reduzir digitação em campos já conhecidos;
- Usar seleção e valores padrão quando não houver risco de erro;
- Manter depósitos e tratamentos agrupados por finalidade;
- Mostrar o estado de sincronização imediatamente após salvar;
- Permitir que o gestor acompanhe a cobertura sem abrir cada ficha;
- Manter dados preditivos separados do fluxo operacional do ACE;
- Usar a cor como apoio, nunca como único sinal de estado.

## 5. Fase 3 — Evidência antes e depois

Para cada fluxo analisado, produzir uma tabela como esta:

| Item | Antes | Depois | Evidência |
| --- | --- | --- | --- |
| Telas percorridas | preencher | preencher | capturas ou gravação |
| Cliques | preencher | preencher | contagem reproduzível |
| Campos digitados | preencher | preencher | formulário comparado |
| Tempo estimado | preencher | preencher | mesma tarefa e perfil |
| Feedback | preencher | preencher | mensagem/estado visível |
| Risco mitigado | preencher | preencher | justificativa técnica |

### O que mudou

Explicar mudanças concretas: menu resumido, card de imóvel, ações no mesmo ciclo, cobertura individual do ACE, histórico em rota própria e indicadores de cobertura com faixa de desempenho.

### O que não mudou

Toda tela complexa mantida deve ter justificativa. Exemplos:

- campos de depósitos permanecem separados porque representam categorias diferentes do formulário oficial;
- identificação do ciclo e do território não é removida porque garante rastreabilidade;
- confirmação e estados de sincronização permanecem porque o ACE precisa saber se o registro foi aceito;
- dados sensíveis não aparecem em mapas ou cards sem autorização;
- informações preditivas continuam separadas do fluxo operacional para evitar interpretação indevida.

## 6. Métricas da narrativa de dados

A apresentação deve comparar, quando possível:

- cliques por tarefa;
- telas percorridas;
- tempo de conclusão;
- erros ou retornos ao passo anterior;
- campos preenchidos manualmente;
- compreensão da próxima ação;
- clareza do feedback;
- cobertura acompanhada pelo gestor;
- quantidade de pendências identificadas.

Os números devem ser apresentados como teste do protótipo ou estimativa documentada. Não declarar ganho real de produtividade sem teste com usuários e dados observados.

## 7. Roteiro da apresentação — 5 a 10 minutos

### 1. Narrativa da fricção — antes

- Quem era o usuário com baixa propensão à adesão?
- Qual tarefa foi escolhida?
- Quantos cliques e telas eram necessários?
- Onde havia sobrecarga, dúvida ou risco de erro?

### 2. Intervenção — depois

- Mostrar o fluxo redesenhado;
- Informar quantidade de telas e cliques;
- Demonstrar navegação sumarizada;
- Mostrar feedback imediato;
- Explicar dados reutilizados do cadastro territorial;
- Demonstrar a cobertura do ACE para o gestor.

### 3. Justificativa técnica e ética

- O que foi simplificado?
- O que foi mantido por segurança clínica?
- Como a interface evita exposição desnecessária de dados?
- Como a LGPD e a rastreabilidade influenciaram a decisão?
- Quais funções ainda são mockadas e quais dependem de integração?

## 8. Checklist de entrega

- [ ] Perfil menos propenso à adesão definido;
- [ ] Tarefa principal documentada;
- [ ] Caminhada cognitiva realizada;
- [ ] Cliques e telas do antes contabilizados;
- [ ] Fluxo depois documentado;
- [ ] Mudanças justificadas por utilidade, usabilidade e credibilidade;
- [ ] Telas mantidas justificadas tecnicamente;
- [ ] Acessibilidade revisada;
- [ ] Feedback de cada ação principal demonstrado;
- [ ] Evidências visuais antes/depois reunidas;
- [ ] Apresentação organizada como narrativa de dados;
- [ ] Limitações do mock separadas das integrações futuras;
- [ ] PDF e protótipo testados antes da entrega.

## 9. Referência

Huberts et al. (2025), conforme referência fornecida na atividade. A citação completa deve ser conferida pelo grupo na bibliografia indicada pelo professor antes da versão final dos slides.
