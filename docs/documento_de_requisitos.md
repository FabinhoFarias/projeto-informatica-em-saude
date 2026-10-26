# Documento de Requisitos de Software — Plataforma Denguinhos

**Versão:** 1.6 — entregas programadas e visibilidade das predições

**Data:** 26 de outubro de 2026

**Estado:** especificação proposta; pontos assinalados como pendentes exigem validação municipal.

**Fontes:** [transcrição de Moura](transcricoes/transcricaoMoura.txt), requisitos anteriores e esclarecimentos do solicitante sobre consolidação, impressão, assinatura, sistema territorial atual e consulta de moradores da Atenção Básica (26/10/2026).

## Como consultar este documento

Os requisitos estão organizados pelo papel responsável pela tarefa e agrupados por funcionalidade. Cada RF/RNF possui uma única definição; quando atende a mais de um papel, os demais módulos fazem referência ao mesmo ID. A numeração dos IDs foi preservada e não determina ordem de implementação. Papéis delimitam acesso; módulos compartilhados concentram dados e regras comuns, sem duplicar cadastros ou serviços por perfil.

| Seção | Papel / módulo | Conteúdo principal |
| :--- | :--- | :--- |
| 2 | Todos os papéis | Responsabilidades, limites e acesso por tarefa. |
| 3 | ACE | Setor, imóvel, moradores, visita, retorno, PE e offline. |
| 4 | Coordenação/supervisão | Cadastro territorial, planejamento, produção e aprovação. |
| 5 | Digitador/operador | Papel, relatórios, impressão e encaminhamento. |
| 6 | Laboratório e equipe de levantamento | Plano amostral, amostras e resultados. |
| 7 | Direção/gestor | Mapa, recomendações, diagnóstico e simulação. |
| 8 | Epidemiologista | Modelos, séries, nowcasting, calibração e exportação. |
| 9 | Integrações / APS e operação autorizada | Importação, fontes, vinculação e política de compartilhamento. |
| 10 | Administração / plataforma | Papéis, configuração, auditoria e continuidade. |
| 11–15 | Compartilhado | Dados, fluxos, prioridades, evidências, validação e índice de requisitos. |

## 1. Visão geral do sistema

A **Plataforma Denguinhos** é uma solução Software as a Service (SaaS) voltada à gestão preditiva de surtos de arboviroses (dengue, zika e chikungunya). O sistema combina dados de notificação histórica/em tempo real, variáveis climáticas, dados da Atenção Primária em Saúde (APS) e indicadores territoriais para gerar previsões de risco em nível intramunicipal (bairros e distritos sanitários), apoiando decisões dos gestores e o trabalho operacional dos Agentes de Combate às Endemias (ACE). A plataforma também deve agregar a produção das visitas, reduzir somas e redigitação e gerar documentos para conferência, impressão e eventual assinatura. O ACE é usuário operacional prioritário; coordenação e direção de Vigilância Ambiental validam a produção e decidem sua utilização. O fluxo de ACS/APS é relacionado, mas distinto e não deve ser tratado como equivalente ao trabalho do ACE.


## 2. Papéis, responsabilidades e limites

| Papel | Responsabilidades | Limites |
| :--- | :--- | :--- |
| ACE | Consultar área atribuída; registrar produção; acompanhar pendências; solicitar correção e conferir sua produção. | Não aprova a própria consolidação final nem muda protocolo técnico. |
| Coordenador/supervisor | Planejar ciclos, atribuir áreas, conferir e devolver produção; aprovar consolidação e acompanhar pendências. | Mudanças em registros exigem motivo e histórico; não apagar produção silenciosamente. |
| Digitador/operador | Receber fichas em papel, lançar origem identificada, conferir demonstrativos e registrar envio ao destino. | Não compartilhar credencial do ACE; não presumir que geração de arquivo equivale a transmissão. |
| Direção de Vigilância Ambiental / gestor autorizado | Validar formulários, destinatários, assinaturas e fluxo pós-coleta; decidir prioridades e autorizar encaminhamento. | Decisão de adoção não é delegada ao agente de campo. |
| Laboratório/responsável habilitado | Receber amostras e registrar resultados quando módulo estiver habilitado. | Observação de larva em campo não equivale a confirmação laboratorial. |
| Epidemiologista | Validar indicadores, limitações e modelos e avaliar recomendações. | Modelo não substitui levantamento de campo ou procedimento oficial. |
| Administrador municipal | Gerir usuários, permissões, catálogos e configuração municipal autorizada. | Administração técnica não concede aprovação sanitária automática. |

Coordenação, digitação e laboratório devem ter permissões próprias; não reaproveitar perfil ADMIN para todo acesso. Acúmulo de papéis é configurável e auditado conforme a equipe real.

### 2.1 Regra de acesso e composição dos módulos

O acesso combina papel, município, território atribuído e finalidade da tarefa. A mesma pessoa pode acumular papéis autorizados; isso não elimina autoria nem validações de aprovação. A interface mostra ações permitidas e os serviços validam novamente a autorização. Os papéis descritos são a referência funcional; não pressupõem que todos já existam no protótipo.

A consulta de moradores pela Atenção Básica é consumida pelo ACE (RF-032); ingestão e vinculação pertencem ao módulo compartilhado de integrações. ACS/APS não herda permissões do ACE e seu fluxo assistencial não é ampliado por esta reorganização. Coordenação e digitador trabalham sobre a mesma produção; laboratório registra resultados relacionados às amostras, sem duplicar a visita.

## 3. ACE — território, imóvel e operação de campo

**Decisão de produto:** o ACE já usa uma ferramenta para saber quais casas pertencem ao seu setor, conforme esclarecimento do solicitante. A solução deve aproveitar essa referência de trabalho, e não exigir que o agente reaprenda seu território. A entrevista também descreve o e-Visita anteriormente utilizado; não há confirmação de que ele seja o sistema consultado atualmente. Demonstrar a ferramenta atual antes de definir equivalência visual. A adesão e recomendação espontânea entre agentes são resultados desejados de utilidade e familiaridade, não tarefas obrigatórias do trabalhador.

**Fluxo principal:** Meu setor → imóveis → ficha do imóvel → consulta opcional de moradores → registro de visita → conferência da própria produção. O planejamento vem da coordenação (RF-019); entrega e correções seguem RF-026. Levantamento/amostras são especificados no módulo 6 (RF-023).

### RF-012 — Atribuição de Rota Inteligente

O aplicativo deve exibir a área e o planejamento aprovados para o ACE, incluindo quarteirões, lados, imóveis, pendências e retornos. Sugestões preditivas são auxiliares e não substituem a cobertura do ciclo, o planejamento amostral ou a decisão da coordenação. Reatribuição deve ser autorizada e rastreável.

### RF-031 — Meu setor, lista de imóveis e ficha do imóvel

**Entrada:** após autenticação, mostrar “Meu setor” com código/nome usado pelo município e contexto de ciclo. Se houver substituição ou mais de uma atribuição válida, permitir selecionar somente setores autorizados. Setor e área devem ter correspondência explícita na configuração municipal, sem presumir que sejam sempre a mesma divisão.

**Lista de imóveis:**

- Disponibilizar consulta por quarteirão e lado, com rua, número/complemento, tipo de imóvel e código conhecido. Manter ordenação territorial familiar, sem substituir a lista padrão por ranking de IA ou mapa obrigatório.
- Busca por código, rua, número/complemento e filtros por situação/pendência da visita e ciclo; distinguir situação cadastral de situação da última tentativa. Preservar filtros e posição ao retornar da ficha.
- Exibir última visita conhecida, data de atualização e disponibilidade offline. Não interpretar “sem visita recebida” como “ACE não trabalhou”; mostrar pendência de sincronização quando conhecida.
- Permitir imóveis sem número, endereços repetidos e várias unidades no mesmo endereço, diferenciados por código/complemento. Cadastro ausente pode gerar solicitação de inclusão ou identificação local provisória para conferência, sem duplicação automática.
- Mapas, novas priorizações e gráficos são auxiliares; a tarefa básica deve funcionar pela lista, inclusive sem coordenadas.

**Dentro do imóvel:**

| Área da ficha | Conteúdo e comportamento |
| :--- | :--- |
| Identificação sempre visível | Código, setor, quarteirão/lado, rua, número/complemento e tipo. Diferenciar claramente imóveis vizinhos e mostrar contexto antes de salvar. |
| Resumo operacional | Situação cadastral e atualização, última tentativa/visita, pendências e eventual retorno vinculado; dados não informados são explicitados. |
| Ação principal | “Registrar visita” reutiliza o imóvel e contexto atual; mantém sequência da ficha conhecida, aplica campos de modalidade e salva offline. Não exige acessar moradores primeiro. |
| Histórico | Linha temporal de tentativas, inspeções e tratamentos autorizados, com data, modalidade e resultado; preserva autoria, correções e origem papel/digital. Não mistura histórico clínico de pessoas com histórico do imóvel. |
| Moradores — Atenção Básica | Consulta opcional do RF-032, separada dos dados de visita. No protótipo, aviso persistente de dados fictícios e integração ainda não conectada. |
| Divergência cadastral | Solicitar correção do território ou sinalizar divergência da APS com motivo; não alterar silenciosamente a fonte externa. Separar observação do ACE de cadastro confirmado pela APS. |
| Navegação | Voltar à lista na mesma posição; imóvel anterior/próximo somente com identificação explícita e sem descartar rascunho. Ação de saída deve preservar rascunho ou solicitar decisão sobre alterações não salvas. |

**Aceite:** usando dados de teste e setor baixado, o ACE encontra um imóvel pela referência que utiliza hoje, confirma sua identificação, vê o histórico e conclui visita sem redigitar o endereço. Reabrir lista/ficha mantém contexto; selecionar imóvel homônimo não mistura registros. Setor sem imóveis, cadastro ausente e dispositivo offline têm orientação acionável. A validação deve incluir ACE habituados ao sistema atual, além da gestão.

### RF-032 — Consulta de moradores da Atenção Básica com integração inicialmente simulada

**Objetivo:** representar a lacuna relatada de não conhecer, no cadastro do ACE, quem mora no imóvel. Prever a integração na ficha desde o desenho, usando exclusivamente pessoas e vínculos fictícios na demonstração. A fonte real, seu acesso e seu contrato ainda não estão confirmados; esta revisão autoriza a especificação do mock, não a importação de pessoas reais.

- Separar provedor de dados da interface: contrato de consulta por referência territorial local com implementações `mock` e `APS` futura. A troca de provedor não deve exigir refazer lista, ficha ou formulário de visita. O contrato abaixo é proposta interna, não API já existente na Atenção Básica.
- Resultado mínimo: `property_ref`, `link_status`, `residents[]`, `source`, `source_updated_at`, `fetched_at`, `is_mock` e `data_status`. Cada pessoa fictícia contém `source_person_ref`, `display_name` e situação de vínculo com o imóvel; outros campos dependem de necessidade e autorização validadas. CPF, Cartão SUS e histórico clínico não são requisitos de exibição.
- Estados de vínculo: confirmado, não vinculado e ambíguo. Correspondência apenas por texto de endereço não confirma vínculo automaticamente; apresentar divergência para conferência autorizada. Não permitir busca irrestrita de pessoas em outros setores.
- Distinguir lista vazia confirmada, ausência de vínculo, fonte indisponível, acesso negado e dados desatualizados. Falha de integração nunca é exibida como “não há moradores” ou como imóvel vago.
- Mostrar fonte e datas; não assumir que visita bimestral atualiza composição familiar em tempo real. Informação da APS e observação feita pelo ACE têm origem e status próprios.
- Prever consulta somente leitura. ACE pode sinalizar divergência com fluxo a definir com a APS; não editar a composição familiar oficial pelo aplicativo sem novo requisito autorizado.
- Mock deve ser determinístico, isolado de bases reais e cobrir imóveis com um/múltiplos moradores, sem vínculo, vínculo ambíguo, ausência de atualização, falha e falta de permissão. Aviso “Demonstração — moradores fictícios; Atenção Básica não conectada” deve permanecer visível na consulta.
- Dados simulados não entram em relatório oficial, produção, indicadores epidemiológicos ou treinamento de ML. Não misturar contagens fictícias com produção real em ambiente híbrido.
- Integração real seguirá RNF-006 e permissões por área/finalidade. Consulta identificável pode usar o ambiente operacional autorizado, local ou hospedado, com API autenticada e acesso por tarefa/território. Pessoas e vínculos não devem ser copiados indiscriminadamente para visões analíticas, terceiros ou modelos. Política de cache/offline, expiração, revogação e retenção deve ser definida antes de ativar dados reais; não pré-carregar moradores reais por padrão.
- Ausência de permissão para moradores não impede consultar os dados territoriais autorizados e registrar visita. Não condicionar o trabalho a CPF, CadÚnico, resposta da APS ou conexão.

**Aceite:** alternar cenários mock mantendo a mesma ficha e referência de imóvel; demonstrar aviso de simulação, origem e atualização. Cadastro sem vínculo ou APS indisponível permite seguir com a visita. Usuário sem permissão recebe estado de acesso negado sem nomes fictícios expostos. Não há transmissão à APS real nem dados simulados nos relatórios de produção. Ativação do conector real depende de V-08 e V-12.

### RF-014 — Alertas de Campo

Alertas que incluam predições seguem a programação e a política de visibilidade de RF-033; a equipe pode receber somente orientações operacionais quando o gestor restringir os resultados do modelo.

O sistema deve disponibilizar alertas territoriais autorizados e ações de campo para a área atribuída ao ACE, informando fonte, data e atualização. Novos alertas dependem de conexão; alertas já baixados permanecem consultáveis offline. Identificação e endereço só podem aparecer na consulta operacional autenticada quando necessários à tarefa e autorizados para o perfil/território; notificações de tela bloqueada não devem expor dados pessoais ou de saúde. Aplicar RNF-006 também no ambiente hospedado.

### RF-013 — Registro de Visita e Criadouro

O ACE deve registrar visitas a diferentes tipos de imóvel, resultados de acesso, depósitos inspecionados, tratamentos, orientações e, quando aplicável, amostras, conforme RF-018 a RF-029 e RF-031/032. Contagens são numéricas; suspeita visual e confirmação laboratorial são estados diferentes. O salvamento local deve funcionar sem conexão e sem exigir dados de moradores.

### RF-020 — Ficha diária digital do ACE

- Iniciar a jornada com agente e território previamente selecionados; reaproveitar contexto de quarteirão/lado/rua entre registros e permitir correção explícita.
- Registrar identificador da visita, autor, data da atividade, data do lançamento, modalidade, ciclo, imóvel local e resultado de acesso.
- Catálogo inicial de tipos: residência, comércio, terreno baldio e outros com descrição; PE tem fluxo próprio, não é confundido com residência.
- Admitir rascunho e conclusão; exigir somente campos pertinentes ao acesso e à modalidade. Abrir a ficha de visita a partir do imóvel selecionado (RF-031), sem redigitar endereço/códigos. A consulta opcional de moradores (RF-032) não bloqueia a visita nem exige CPF, nome de morador ou cadastro familiar.
- **Aceite:** fechar e reabrir aplicativo sem perder visita salva; impedir conclusão com contagem negativa ou campo obrigatório aplicável ausente.

### RF-021 — Depósitos, inspeção e tratamento

- Registrar quantidades por categoria homologada (códigos mencionados: A1, A2, B, C, D1, D2, E), distinguindo encontrados/inspecionados, positivos quando aplicável e tratados segundo o formulário aprovado.
- Catálogo deve conter descrição validada, versão e vigência. Falas sobre categorias, volumes e produtos têm ambiguidades; não converter a transcrição em dosagem ou prescrição.
- Para tratamento registrar tipo focal/perifocal, produto autorizado, quantidade, unidade, referência de depósito/área e lote quando exigido pelo fluxo homologado.
- Diferenciar capacidade do reservatório, volume de água tratado e quantidade de produto; campos/unidades não podem ser intercambiáveis. Zero é distinto de não informado e não se aplica.
- **Aceite:** registrar vários depósitos da mesma categoria em um imóvel, com contagens inteiras; rejeitar unidade incompatível e não exigir tratamento em toda inspeção.

### RF-022 — Imóveis fechados, vazios e recuperação

- Separar resultado da tentativa (inspecionado, fechado, recusa ou outro motivo homologado) da situação cadastral (ocupado, vago ou desconhecido).
- Criar retorno vinculado à tentativa anterior, com data e resultado, preservando os dois eventos. Recuperação conta conforme regra oficial de competência, sem transformar retrospectivamente tentativa frustrada em inspeção.
- Exibir pendências e permitir justificar retorno não realizado. Não afirmar ausência de moradores apenas porque o imóvel estava fechado.
- **Aceite:** uma tentativa fechada seguida de retorno inspecionado gera duas tentativas, uma inspeção e histórico de recuperação; relatório aplica a regra homologada para imóveis únicos.

### RF-024 — Pontos estratégicos (PE)

- Cadastro e ficha específicos, agenda de inspeção e agenda de tratamento distintas; histórico de inspeção, recipientes, amostras e intervenções quando aplicáveis.
- Configurar periodicidades por município e vigência; o relato quinzenal/bimestral é referência local sujeita a confirmação.
- **Aceite:** uma inspeção sem aplicação não gera consumo nem tratamento perifocal; ausência de tratamento fica justificada quando necessário.

**Qualidade e restrições deste módulo:**

### RNF-004 — Funcionamento Offline do App Móvel

O módulo de campo deve permitir consultar o planejamento previamente baixado, registrar visitas e manter pendências inteiramente offline. A sincronização ocorre quando houver conexão e sessão válida, incluindo no retorno à base. Login inicial, novas atribuições, alertas novos e envio à secretaria dependem de conectividade. Mostrar claramente o que foi salvo localmente, enviado e aceito pelo servidor.

### RNF-005 — Design Responsivo e Ergonômico

A interface mobile deve ser otimizada para operação com uma única mão, alto contraste (para uso sob luz solar direta) e telas de tamanho variado em dispositivos Android de entrada.

### RNF-015 — Usabilidade operacional validada com ACE

testar as tarefas de visita comum, imóvel fechado, recuperação, vários depósitos e jornada offline com profissionais de campo e aparelhos reais. Alvo proposto: pelo menos 90% de conclusão sem ajuda nas tarefas essenciais, zero perda de registros salvos e nenhuma digitação obrigatória repetida de contexto territorial. Medir tempo de registro em comparação com a ficha; a melhoria pretendida é administrativa, sem prometer reduzir tempo técnico de inspeção. Meta final e amostra do teste serão pactuadas antes do piloto.

### RNF-016 — Sincronização sem perda ou duplicação

UUID idempotente por operação, confirmação por item, reenvio após falha, persistência após reinício e preservação de conflitos. Testar queda antes/depois do envio, resposta perdida, reconexão, sessão expirada e aparelho sem espaço. Não usar sobrescrita silenciosa; registro pendente deve permanecer visível.

### RNF-017 — Dispositivos pessoais e compartilhados

confirmar titularidade e disponibilidade antes da implantação. Suportar isolamento de contas e encerramento de sessão sem revelar dados de outro agente; acesso local protegido, retenção mínima, procedimento para perda/troca do aparelho e recuperação dos dados já sincronizados. Trabalho não sincronizado em aparelho perdido não tem recuperação garantida: orientar sincronização e contingência. Não exigir equipamento pessoal ou conectividade móvel contínua para adesão.

### RNF-023 — Familiaridade, implantação gradual e adesão do ACE

- Levantar com agentes os nomes dos campos, sequência da consulta, organização da lista e modelo de ficha utilizados atualmente; registrar correspondência entre fluxo atual e proposto antes de fechar as telas.
- Priorizar identificação do imóvel, formulário e retorno à lista; reduzir digitação repetida e introduzir recursos opcionais de forma gradual. Não exigir dados adicionais sem finalidade operacional e validação com usuários.
- Validar em demonstrações e piloto com ACE de diferentes níveis de familiaridade digital: localizar casa, conferir ficha, registrar inspeção/fechada/retorno e consultar mock de moradores. Observar erros de seleção de imóvel, perda de contexto e pedidos de ajuda, além do tempo.
- Comparar as tarefas com a ferramenta e ficha atuais; registrar dificuldades, correções e aceite dos agentes antes da expansão. RNF-015 permanece a referência de meta proposta, com parâmetros pactuados no piloto.
- Não presumir fidelidade visual sem acesso às telas atuais e não tornar treinamento extenso um pré-requisito para registrar uma visita comum. Disponibilizar orientação curta e apoio inicial conforme o piloto indicar.

## 4. Coordenação/supervisão — território, planejamento e produção

**Fluxo principal:** manter território/atribuições → planejar ciclo/modalidade → acompanhar produção → conferir, devolver ou aprovar. A lista de campo do ACE consome esse cadastro (RF-031). Emissão e encaminhamento usam o mesmo fechamento no módulo 5; metas e decisões de intervenção são pactuadas, não impostas automaticamente pelo modelo.

### RF-002 — Geocodificação e Tratamento Territorial

O sistema deve mapear indicadores por bairro/distrito e suportar a hierarquia operacional município → área → quarteirão → lado → logradouro → imóvel. Geocodificação e vinculação podem ocorrer no ambiente operacional autorizado, local ou hospedado, com controle de acesso e finalidade conforme RNF-006; consultas a geocodificadores externos devem minimizar o endereço enviado e não incluir nome, diagnóstico ou composição familiar. Ausência de coordenadas não impede o registro territorial por código/endereço local.

### RF-018 — Cadastro territorial e atribuição de área

- Manter códigos estáveis para área, quarteirão, lado e imóvel; código externo, tipo e situação cadastral, origem e data da atualização, quando disponíveis.
- Suportar quarteirão com mais de quatro lados, imóvel sem número, múltiplos imóveis em um endereço, área sem mapa e alterações cadastrais sem apagar visitas anteriores.
- Importar cadastro com prévia, validação, identificação de duplicatas e relatório de rejeições. Ausência de cadastro completo não bloqueia início assistido com identificadores locais.
- Registrar vigência da atribuição ACE/área e substituições; preservar autoria e território da produção passada.
- Preservar os códigos territoriais utilizados no sistema atual, a ordem de consulta e a referência do imóvel; mapear códigos externos sem obrigar recadastro manual de toda a área. Detalhes de navegação em RF-031.
- **Aceite:** reatribuir área não transfere autoria de visitas; tentativa de consultar outra área sem autorização é negada. Dados identificáveis seguem RNF-006.

### RF-019 — Planejamento por ciclo e modalidade

- Configurar ciclo, datas, área, responsável, dias úteis, exceções e metas pactuadas. Distinguir visita de rotina, retorno/recuperação, levantamento amostral, ponto estratégico e ação de bloqueio autorizada.
- Informar pendências por quarteirão e cobertura do ciclo; quarteirão trabalhado não é automaticamente concluído.
- Recomendações de risco devem mostrar justificativa, validade e decisão do supervisor; não reordenar silenciosamente trabalho baixado.
- **Aceite:** registrar produção cotidiana fora da semana amostral; inspeção de amostra não encerra automaticamente o ciclo da área.

### RF-025 — Produção diária, semanal e por ciclo

- Consolidar automaticamente registros por ACE, área, período, modalidade e tipo de imóvel; expor tentativas, inspeções, tratamentos, depósitos, recuperações e quarteirões trabalhados/concluídos conforme regras homologadas.
- Distinguir quantidade de visitas, imóveis únicos, depósitos e tratamentos; não somar medidas de unidades diferentes nem contar reenvio como nova produção.
- Totais devem permitir reconciliação com os registros de origem no ambiente autorizado. Mostrar produção incompleta, rejeitada e ainda não recebida; ausência de sincronização não equivale a produção zero.
- Configurar corte semanal, calendário e competência; lançamento tardio não troca automaticamente a data da atividade pela data da digitação.
- **Aceite:** a mesma visita reenviada não aumenta total; soma por agente reconcilia com consolidado municipal da mesma versão e escopo.

### RF-026 — Conferência, fechamento e correção

- Estados da produção: rascunho → entregue → em conferência → aprovada; devolvida retorna ao responsável com motivo. Documento emitido aponta versão aprovada.
- ACE confere produção; coordenação aprova ou devolve; digitador mantém a transcrição de papel identificada. Registro entregue tem correção controlada, nunca exclusão silenciosa.
- Correção após fechamento exige solicitação, motivo, aprovação e nova versão de consolidação/documento; preservar versões anteriores e destinatários afetados.
- **Aceite:** usuário sem permissão não aprova produção; alteração posterior permite identificar autor, data, motivo e diferença dos totais.

### RF-030 — Consumo de insumos e limite do estoque

- Consolidar consumo registrado em tratamentos por produto, unidade, modalidade e período. Registrar correções sem alterar retroativamente registros aprovados.
- Pedidos, entradas, saídas e saldo oficial pertencem ao sistema municipal/estadual citado, até confirmar seu nome e interface; módulo completo de estoque não faz parte do primeiro escopo.
- **Aceite:** somar gramas apenas com gramas, litros apenas com litros; consumo estimado não é apresentado como saldo de estoque ou solicitação já enviada.

**Qualidade e restrições deste módulo:**

### RNF-022 — Transparência da qualidade

diferenciar zero, desconhecido, não se aplica, não sincronizado e pendente de conferência. Exibir atualização por fonte; indisponibilidade de ML não bloqueia coleta nem relatório operacional de dados conferidos.

## 5. Digitador/operador — papel, documentos e encaminhamento

**Fluxo principal:** receber/transcrever ficha → resolver duplicatas → encaminhar à conferência → emitir versão aprovada → imprimir/colher assinatura quando exigida → registrar encaminhamento. O digitador não substitui a aprovação da coordenação (RF-026); direção valida leiautes/destinatários. RF-025 é a fonte única dos totais.

### RF-029 — Papel e operação assistida

- Permitir uso digital, transcrição de papel ou operação híbrida por equipe/período, com origem de cada lançamento e responsável pela digitação.
- Identificar ficha, agente, data de atividade e competência; confrontar importação/transcrição com registros digitais existentes. Duplicata suspeita exige conferência, não soma automática.
- Papel pode ser contingência e documento de assinatura; eliminar dupla escrituração como obrigação somente após validação municipal.
- **Aceite:** ficha digitada posteriormente preserva data de campo e digitador real; mesma ficha não pode entrar duas vezes sem alerta e resolução rastreável.

### RF-027 — Relatório de produção para impressão e assinatura

- Gerar PDF a partir de versão consolidada, com prévia; oferecer diário individual, consolidado semanal e por ciclo/modalidade conforme modelos homologados.
- Cabeçalho mínimo: município/unidade, nome e código do relatório, competência, área, agente/equipe conforme necessidade, modalidade, status, versão e data de emissão. Corpo: colunas e totais validados; rodapé: páginas e responsáveis/campos de assinatura quando exigidos.
- Distinguir relatório preliminar de aprovado e reemissão de retificação. O documento deve ser legível em preto e branco, sem depender de cor, sem cortar tabelas e sem ocultar status em páginas seguintes.
- Papel/tamanho, orientação, campos, destinatários e assinantes dependem do formulário municipal real; A4 é proposta inicial, não comprovação de formato oficial.
- Permitir baixar e imprimir pela secretaria sem devolver fisicamente o celular pessoal do agente. Assinatura manuscrita após impressão é suficiente quando aceita; assinatura eletrônica não é obrigação desta versão.
- Guardar versão emitida e referência de encaminhamento; anexar cópia assinada somente se o fluxo validado exigir, com acesso e retenção definidos. Não marcar “assinado” automaticamente ao gerar PDF.
- **Aceite:** imprimir relatório com mais de uma página sem perda de linhas; totais iguais à consolidação aprovada; retificação identificada e original preservado. Só chamar o modelo de “oficial homologado” após aceite do destinatário.

### RF-028 — Encaminhamento e sistemas legados

- Gerar espelho/arquivo no leiaute aceito pelo destinatário após validação. Registrar destino, competência, responsável, versão, data e situação: preparado, encaminhado, aceito ou rejeitado; protocolo quando fornecido.
- Sem API/importador homologado, entregar relatório para apoiar lançamento manual no sistema atual. Digitação remanescente deve ser explicitada na implantação.
- **Aceite:** PDF gerado não aparece como enviado; reenvio da mesma versão tem histórico e evita duplicar competência no controle interno. Falha externa não apaga produção.

**Qualidade e restrições deste módulo:**

### RNF-018 — Reprodutibilidade documental

relatório emitido referencia um snapshot e regras versionadas; gerar novamente a mesma versão deve manter os mesmos dados e totais. Mudança de catálogo/leiaute não altera documento anterior. Impressão com paginação, rótulos repetidos e totais reconciliados deve ser verificada com a secretaria.

### RNF-013 — Operação Sem Necessidade de TI Local (*No-Code Interface*)

A interface web de gestão e alimentação de dados por planilhas deve ser autoexplicativa e pronta para uso por gestores municipais, dispensando a necessidade de programadores ou técnicos de TI locais.

### RNF-009 — Arquitetura Sem Migração de Bases

A solução deve interoperar com as bases de dados municipais e federais existentes por meio de conectores/APIs sem exigir substituição dos sistemas legados. A captura digital e a agregação são mudanças assistidas de processo; manter saídas utilizáveis no fluxo atual e contingência em papel. Integração direta só será prometida após verificar documentação, acesso e homologação do destino.

## 6. Laboratório e levantamento — amostragem e resultados

**Responsáveis:** coordenação aprova o plano; ACE executa a coleta; laboratório/responsável habilitado recebe e registra resultados. Compartilham campanha, códigos de amostra e histórico; resultado laboratorial não altera silenciosamente a visita. PE é especificado em RF-024.

### RF-023 — Levantamento de índices e laboratório

- Manter campanha, estratos, plano amostral, quarteirões selecionados, imóveis elegíveis, seleção executada e responsável pelo plano.
- Aceitar plano gerado por ferramenta oficial externa; geração de sorteio própria depende de validação metodológica e não é requisito obrigatório do primeiro ciclo.
- Registrar amostra por código único local, origem territorial, coletor, data, remessa, recebimento e resultado pendente/positivo/negativo/inconclusivo, com método e responsável quando exigidos.
- Índices devem explicitar fórmula, numerador, denominador, período, modalidade e limitações; não calcular indicador oficial sem regra aprovada e dados suficientes.
- **Aceite:** resultado pendente não vira negativo; rotina sem coleta não exige amostra; resultado corrigido mantém a versão anterior.

## 7. Direção/gestor — visão situacional e decisão

**Fluxo principal:** consultar mapa/diagnóstico → analisar recomendações → simular recursos → decidir e encaminhar execução à coordenação. Relatórios oficiais de produção e assinaturas são definidos no módulo 5 (RF-027/028), com validação da direção. Permissão de gestão não libera automaticamente cadastro nominativo ou calibração do modelo.

### RF-008 — Mapa Interativo de Calor/Risco

O dashboard deve apresentar um mapa geoespacial interativo do município com camadas de risco visual (ex.: verde, amarelo, laranja, vermelho) por bairro e distrito.

### RF-017 — Módulo de Diagnóstico Situacional Automatizado

A plataforma deve gerar relatórios visuais consolidados com indicadores e temas prioritários do território, unificando os dados da APS e da Vigilância Epidemiológica para subsidiar planos de intervenção sem necessidade de análise manual.

### RF-009 — Geração de Recomendações de Ação

O sistema deve traduzir o risco territorial em recomendações explicadas e datadas para revisão da coordenação. A decisão operacional e os parâmetros de intervenção pertencem ao responsável autorizado; a IA não prescreve dose de produto, não confirma foco laboratorial e não altera automaticamente ciclos ou atribuições.

### RF-011 — Simulação e Alocação de Recursos

O sistema deve permitir ao gestor simular o quantitativo de agentes (ACS/ACE) e insumos (larvicidas, testes rápidos) necessários com base na projeção de risco por região.

### RF-033 — Programação de recebimento, registro e comunicação das predições

**Responsável:** profissional gestor autorizado no município. Deve poder escolher um ou mais horários do dia para receber as predições e decidir se os dados serão apresentados diretamente à equipe/ACE ou somente à gestão para posterior comunicação.

- Configurar horários, dias da semana, fuso horário municipal, territórios acompanhados e destinatários autorizados. Permitir editar, pausar e reativar a programação, com confirmação da próxima entrega; não fixar horários iguais para todos os municípios.
- Distinguir preferência individual de recebimento da política de compartilhamento da equipe: o gestor pode ajustar sua programação; somente quem tiver permissão de gestão de visibilidade pode liberar ou restringir a exposição a outros usuários. Havendo mais de um gestor, registrar responsável e vigência da política comum para evitar decisões conflitantes.
- Oferecer dois modos: **restrito à gestão**, com dados preditivos acessíveis apenas aos gestores e perfis analíticos autorizados; e **compartilhado**, com liberação explícita para equipes/perfis e territórios selecionados. No modo restrito, o gestor pode enviar apenas orientação operacional à equipe sem revelar probabilidade, projeção ou resultado bruto do modelo.
- Aplicar a política em consultas à API, telas, mapas, notificações, relatórios e exportações, inclusive aos resultados preditivos de RF-008/017. Ocultar a tela ou desativar o aviso não basta. Restringir predições não bloqueia setor, registro de visita, alertas operacionais não preditivos ou trabalho offline autorizado do ACE.
- No horário escolhido, disponibilizar a última previsão publicada e válida para o escopo, com data de geração, período dos dados, horizonte, território, versão do modelo e limitações. A agenda de recebimento não significa novo treinamento ou nova inferência a cada horário. Se não houver previsão válida ou ela estiver desatualizada conforme critério técnico configurado, informar essa condição sem apresentar estimativa antiga como atual.
- Criar registro de entrega no sistema, consultável pelo gestor, contendo horário previsto/efetivo, destinatários, snapshot da previsão e estado: programada, disponibilizada, falhou ou cancelada. Separar disponibilização, leitura e comunicação à equipe; nenhuma delas comprova que a ação de campo foi executada.
- Permitir ao gestor registrar encaminhamento da orientação, com mensagem, equipe destinatária, autor, data e referência à previsão que fundamentou a decisão. Aplicar a visibilidade escolhida ao conteúdo enviado; não anexar resultado bruto automaticamente no modo restrito.
- Usar inicialmente a central de notificações do próprio sistema; outros canais dependem de definição e integração próprias. Ausência de conexão posterga a leitura, sem prometer recebimento imediato no aparelho. Avisos externos ou de tela bloqueada não expõem dados sensíveis nem predições restritas.
- Executar agendamento com reenvio idempotente por programação, ocorrência e destinatário; registrar falhas sem duplicar a entrega. Alterações de horários/destinatários não modificam registros históricos. Ao restringir acesso, bloquear novas consultas/envios e invalidar cópias controladas pelo aplicativo quando houver conexão; informar que não é possível recolher impressões ou exportações já realizadas.

**Aceite:** configurar, por exemplo, 08h e 14h no fuso municipal e verificar próxima ocorrência e uma entrega por horário/destinatário; repetir execução do agendador sem duplicação. No modo restrito, ACE não acessa predições por tela, API ou exportação e continua registrando visitas; recebe apenas a orientação explicitamente encaminhada pelo gestor. No modo compartilhado, somente equipe/território autorizados acessam o snapshot. Ausência de previsão válida gera aviso, e histórico permite distinguir disponibilização, leitura e comunicação.

**Qualidade e restrições deste módulo:**

### RNF-001 — Tempo de Resposta do Dashboard

O dashboard web deve carregar os mapas interativos e painéis analíticos em no máximo 3 segundos sob condições normais de navegação.

## 8. Epidemiologista — análise e modelos preditivos

**Fluxo principal:** avaliar dados e séries → corrigir atraso de notificação → construir/validar previsões e hotspots → calibrar e exportar resultados autorizados. RF-008 e RF-017 são visualizações compartilhadas com gestão. Modelos usam conjuntos analíticos definidos pelo módulo 9 e não bloqueiam coleta/produção.

### RF-010 — Módulo Epidemiológico Avançado

O dashboard deve permitir a exportação de dados em formatos padrão (CSV, JSON, XLSX), visualização de séries temporais, curvas epidêmicas e ajuste de parâmetros de sensibilidade do modelo.

### RF-007 — Ajuste de Atraso de Notificação (*Nowcasting*)

O sistema deve aplicar correção estatística ao volume de notificações recentes para compensar a defasagem temporal entre a ocorrência dos sintomas e a consolidação do registro no SINAN.

### RF-005 — Modelagem Preditiva por Bairro

O sistema deve gerar estimativas da probabilidade e magnitude de surtos epidêmicos com antecedência útil (de 2 a 4 semanas) separadamente por bairro/distrito.

### RF-006 — Identificação de Hotspots Históricos

O sistema deve executar algoritmos de clusterização espacial (ex.: DBSCAN, SaTScan) no histórico de dados do município para identificar bairros "gatilho" (áreas com reincidência histórica de início de epidemias).

### RF-016 — Cruzamento Preditivo Territorial - Saúde Única

O módulo de análise espacial deve cruzar a densidade populacional e de atendimentos da Atenção Primária (PEC) com as notificações/focos da Vigilância Epidemiológica (SINAN/LIRAa) para identificar áreas de vulnerabilidade sobrepostas no território.

**Qualidade e restrições deste módulo:**

### RNF-012 — Mitigação de Viés Algorítmico e Falsos Alarmes

O sistema deve disponibilizar relatórios periódicos de calibração do modelo preditivo para que epidemiologistas ajustem as margens de erro e previnam a "fadiga de alertas" nos órgãos de decisão.

### RNF-014 — Tolerância a Inconsistências de Cadastros (Tratamento de Subnotificação/Lacunas)

O motor de análise e cruzamento de dados deve ser capaz de tratar automaticamente lacunas de cobertura do PEC/Atenção Primária, gerando diagnósticos e alertas sem falhar devido a faltas pontuais de cadastro de residentes.

## 9. Integrações e APS — ingestão, vinculação e compartilhamento

**Responsáveis:** gestor/operador autorizado executa importações; administradores habilitam conectores; APS e demais fontes validam origem/campos; epidemiologista acompanha qualidade. Serviços de integração são compartilhados entre papéis. A ficha de moradores e o contrato mock estão em RF-032, junto à experiência do ACE, evitando duplicação.

### RF-001 — Ingestão Multifonte

O sistema deve integrar bases oficiais (SINAN, DATASUS, InfoDengue) e dados climáticos/ambientais por conectores autorizados quando disponíveis, com importação assistida quando não houver integração. Registrar fonte, competência, data de obtenção, versão e limitações; não pressupor API ou atualização em tempo real em todas as fontes.

### RF-015 — Ingestão Manual via Importação de Planilhas (CSV/XLSX)

O sistema deve permitir que gestores ou técnicos sem perfil técnico selecionem localmente relatórios e planilhas exportadas do PEC (Atenção Primária) e SINAN/SIM (Vigilância Epidemiológica), validem campos e importem os dados necessários ao ambiente operacional autorizado, inclusive registros identificados quando previstos na finalidade. Anonimização/agregação aplica-se às saídas analíticas e ao compartilhamento externo conforme RNF-006; arquivos brutos têm acesso restrito e retenção definida, sem publicação ou inclusão em logs. Atender também secretarias sem integração direta por API.

### RF-003 — Normalização de Nomes e Padrões

O sistema deve normalizar e mapear inconsistências em nomes de bairros e logradouros locais presentes nas fichas manuais do SINAN.

### RF-004 — Leitura de Dados de Prontuário

O sistema deve permitir a ingestão autorizada de dados de atendimentos de sintomas gripais/febris da Atenção Primária (e-SUS APS/PEC) e UPAs locais, inclusive identificados quando necessários à vinculação operacional. Preservar origem, data, finalidade e campos autorizados; disponibilizar visão agregada e sem identificadores diretos para análise e ML.

**Qualidade e restrições deste módulo:**

### RNF-010 — Padronização Técnica de Dados

A estrutura de integração de saúde deve prever mapeamento utilizando códigos padrão da **CID-10/11** para diagnósticos e notificações.

### RNF-006 — Proteção por finalidade e fronteira de compartilhamento

O ambiente operacional autorizado do Denguinhos pode receber, armazenar e relacionar dados reais identificados do SINAN, da Atenção Básica e de outros setores municipais, quando o acesso e os campos estiverem autorizados para a finalidade definida. Hospedagem em nuvem não implica anonimização obrigatória de toda a base operacional. Separar dados operacionais identificados das visões analíticas agregadas e dos conjuntos de ML; autorizar acesso por município, perfil, território e tarefa, com criptografia, auditoria e retenção. Antes de enviar dados a APIs externas, serviços de terceiros, exportações ou outros destinatários, aplicar política por fluxo: minimizar campos e anonimizar/agregar quando a finalidade não exigir identificação. Trocas identificadas indispensáveis com uma fonte ou destino autorizado devem ter contrato de dados e finalidade explícitos, sem anonimização que inviabilize o vínculo necessário. API interna autenticada e integração municipal autorizada não são equivalentes a divulgação pública. Pseudonimização com chave reversível continua sendo dado identificável; remover nome/CPF, isoladamente, não comprova anonimização. Detalhamento e critérios na seção 9.

**Esclarecimento de escopo de 26/10/2026:** as fontes municipais podem conter pessoas reais identificadas. A solução deve preservar a utilidade desses dados no fluxo operacional autorizado, inclusive consulta de moradores por imóvel. A restrição anterior que obrigava manter todo dado identificável exclusivamente na borda foi substituída por RNF-006 na versão 1.4. A existência de uma API, por si só, não define se a troca deve ser anônima: importam origem, destinatário, finalidade e campos necessários. A integração APS permanece mockada até existir contrato e acesso reais; esta alteração não a declara implementada.

### 9.1 Matriz de tratamento por fluxo

| Fluxo | Tratamento especificado | Condição verificável |
| :--- | :--- | :--- |
| SINAN/APS/outro setor → ingestão operacional | Receber campos identificados autorizados, validar esquema, origem e competência; não anonimizar antes do vínculo quando identificação for necessária. | Credencial de serviço restrita, conjunto de campos aprovado, lote rastreável e rejeição de campos não previstos. Não pressupor que todo acesso ao SINAN disponibilize dados nominativos. |
| Base operacional → ficha do imóvel/consulta de moradores | Exibir apenas dados necessários à tarefa para usuário autorizado; guardar proveniência e atualização. | Negar consulta fora do município/território/perfil; impedir enumeração irrestrita de pessoas. Não transformar acesso a moradores em acesso automático ao prontuário. |
| Operação → análises e ML | Agregar por território/período, remover identificadores diretos e tratar grupos pequenos e atributos reidentificáveis. | Dataset versionado com esquema de atributos aprovado, sem nome, CPF, Cartão SUS ou endereço individual como feature. Identificador reversível não é rotulado como anônimo. |
| Sistema → API externa de clima/indicadores/geocodificação | Enviar somente parâmetros indispensáveis: território/período ou endereço mínimo necessário. | Não incluir moradores, diagnóstico ou fichas de visita na consulta; documentar campos efetivamente enviados ao terceiro. |
| Sistema → serviço externo de IA/ML | Preferir agregados sem identificação e sem vínculos reversíveis; não enviar base operacional nominativa por padrão. | Credencial, destinatário e política de payload definidos; bloqueio de campos proibidos antes da chamada. |
| Sistema → outro órgão/sistema oficial autorizado | Aplicar leiaute e finalidade aprovados; envio identificado apenas se indispensável e expressamente previsto nesse fluxo. | Registrar destinatário, campos, responsável, versão e protocolo/resultado; transporte protegido e acesso limitado. |
| Relatório operacional/impressão | Identificação territorial e de responsáveis conforme modelo aprovado; moradores/pacientes apenas se necessários e autorizados naquele documento. | Prévia, permissão de exportação, destinatário e trilha de emissão; relatório de produção não inclui lista de moradores por padrão. |
| Painel público, demonstração e logs | Público: somente agregados com avaliação de reidentificação. Demonstração: dados sintéticos. Logs: metadados técnicos sem payload nominativo. | Não copiar dados reais para mock, URL, mensagem de erro ou telemetria. |

### 9.2 Vinculação e separação de dados

- Conservar referência e versão da fonte, registro de origem, data de obtenção e regra de correspondência. Não presumir que duas pessoas ou imóveis sejam iguais apenas por nomes/endereço semelhantes.
- Tratar vínculo confirmado, candidato, ambíguo e rejeitado; correção autorizada mantém histórico. Dados divergentes entre secretarias permanecem atribuídos à sua fonte até resolução, sem sobrescrita silenciosa.
- Separar cadastro de pessoa, vínculo pessoa–imóvel, visita do ACE e notificação/atendimento. Permissão para uma entidade não concede consulta irrestrita às demais.
- Manter a informação identificada necessária dentro do perímetro operacional definido, com isolamento por município e política para cópias de segurança, arquivos importados e cache offline. Não exigir instalação local como única opção de implantação.
- Antes de cada integração real, registrar matriz de campos de entrada/saída, finalidade, fonte/destinatário, responsáveis por autorizar e operar, retenção e transformação. Preferir bloqueio por padrão de campos não previstos no contrato.
- Importação de dados reais não autoriza compartilhamento secundário; conector novo exige política própria. O detalhamento técnico não substitui a validação institucional dos acessos.

### 9.3 Critérios de aceite da proteção nas integrações

1. Importar lote sintético nominativo autorizado, vincular imóvel e apresentar moradores somente ao perfil e território permitidos.
2. Negar acesso equivalente a outro município e a usuário sem permissão de moradores; o registro de visita continua disponível quando autorizado.
3. Produzir conjunto analítico sem identificadores diretos, com regra documentada para grupos pequenos e atributos reidentificáveis.
4. Inspecionar payloads de teste para API externa: campos não previstos são removidos ou bloqueados, sem alteração silenciosa da finalidade.
5. Demonstrar fluxo oficial identificado apenas no contrato que o autoriza; outro destinatário não herda essa autorização.
6. Confirmar que logs, erros, mock e notificações de tela bloqueada não contêm dados reais de pacientes/moradores.

**Compatibilidade documental:** diagramas e protótipos que ainda indiquem “nenhuma PII na nuvem” ou “somente agregados na entrada” representam a regra anterior e precisam ser alinhados à versão 1.4 antes de orientar implementação. Esta revisão altera os requisitos, sem ativar integrações reais.

## 10. Administração — acesso, configuração e sustentação

**Responsáveis:** administrador municipal e operação técnica autorizada. Configuração abrange município, usuários/papéis, atribuições, modalidades, catálogos e leiautes com vigência. Administração técnica não substitui aprovação sanitária. As regras funcionais de atribuição estão em RF-018/019 e as de aprovação em RF-026; a configuração implementa seus limites comuns.

**Qualidade e restrições deste módulo:**

### RNF-008 — Controle de Acesso de Usuários

O sistema deve adotar controle de acesso baseado em papéis (RBAC - *Role-Based Access Control*) com autenticação multifator (MFA) para perfis administrativos e de gestão.

### RNF-002 — Arquitetura Multitenant / SaaS

A arquitetura deve suportar múltiplos municípios de forma isolada e escalável na nuvem, permitindo a adição de novas cidades sem reestruturação do código-fonte.

### RNF-007 — Criptografia de Dados

Todos os dados devem ser criptografados em trânsito (protocolo TLS 1.3) e em repouso (algoritmo AES-256).

### RNF-019 — Auditoria e segregação

rastrear criação, transcrição, correção, entrega, conferência, aprovação, emissão e encaminhamento, com usuário, data e motivo pertinente. Autorizar no servidor/serviço local e limitar por município, área e função; logs não contêm nomes de pacientes nem cópias de fichas identificáveis.

### RNF-020 — Configuração sem bifurcar o produto

calendários, tipos, unidades, modalidades, perfis e relatórios são configuráveis com vigência, aprovação e prévia do impacto. Não fixar números ou práticas do município entrevistado como regras nacionais. Histórico deve conservar regras originais.

### RNF-003 — Escalabilidade de Dados

O banco de dados geoespacial deve processar e armazenar até 10 anos de histórico de notificações e milhões de registros, mantendo as metas de consulta em carga de referência documentada. Capacidade de armazenamento não implica que todas as fontes forneçam dez anos de histórico; ingestão e modelos devem explicitar o período realmente disponível.

### RNF-011 — Disponibilidade do Serviço

A plataforma na nuvem deve apresentar disponibilidade (SLA) de no mínimo 99.5% de *uptime*.

### RNF-021 — Continuidade e guarda

definir com o município prazo de retenção por classe documental, cópias de segurança do ambiente local e da nuvem, responsáveis e objetivos de recuperação antes do piloto. Realizar teste de restauração; nuvem disponível não garante disponibilidade da borda municipal. Não apagar registros ao encerrar ciclo.

RNF-001 e RNF-011 continuam como metas de dashboard e nuvem, respectivamente. Seu cenário de medição deve registrar rede, dispositivo, quantidade de usuários, volume e janela de observação antes do aceite; não são prova de desempenho já alcançado.

## 11. Modelo compartilhado de dados e fluxos entre papéis

| Entidade | Dados/relações mínimos e invariantes |
| :--- | :--- |
| Configuração municipal | Tenant, calendário, modalidade, catálogos, regras de cálculo, modelo de relatório e respectivas versões/vigências. |
| Território/imóvel (base operacional restrita) | Hierarquia territorial, identificador estável, endereço quando necessário, situação cadastral, origem e atualização. Não inferir domicílio familiar a partir de imóvel. |
| Ciclo/planejamento | Período, área, responsável, modalidade, atribuições e aprovação. Plano amostral tem seleção e denominadores próprios. |
| Visita/tentativa (base operacional restrita) | UUID, data da atividade/lançamento, autoria, origem digital/papel, imóvel, ciclo, modalidade, acesso, vínculo de retorno e versão. |
| Observação de depósito/tratamento | Categoria e versão, contagens, produto, quantidade, unidade e tipo de tratamento; obrigatoriedade depende da modalidade e do acesso. |
| Amostra | Código, cadeia de recebimento e resultado com autor/data; separar observação em campo de confirmação. |
| Produção agregada | Município, área não identificável quando permitido, agente conforme autorização, período, modalidade, métricas, qualidade e versão; sem identificadores pessoais na visão analítica; vínculos necessários permanecem na base operacional protegida. |
| Consolidação/documento | Competência, filtros, regras, revisão, aprovador, totais, status, versão, arquivo emitido e encaminhamento. |
| Sincronização | Operação UUID, versão, origem/dispositivo, reconhecimento e erro; não eliminar dado pendente por expiração da sessão. |

**Regras de cálculo a homologar:** definição de imóvel trabalhado, inspecionado e tratado; contagem de recuperados entre semanas; inclusão de PE e amostra; tratamento de imóvel vago/recusa; conclusão de quarteirão; denominadores de índices; soma de produtos e arredondamento. Até validação, usar indicadores descritivos explícitos e rótulo provisório, sem reproduzir número como estatística oficial.

### 11.1 Passagem de responsabilidade

ACE registra e entrega → coordenação confere/aprova → operador emite e encaminha → direção acompanha o envio e valida o processo. Laboratório acrescenta resultados de amostras; integrações atualizam dados de origem; epidemiologista produz análises; administração sustenta acesso e configuração. Um evento de sincronização não equivale à aprovação da produção, e emissão não equivale a envio ou assinatura.

### F-01 — Jornada digital e retorno à base
1. Coordenação aprova área, ciclo/modalidade e disponibiliza cadastro e planejamento.
2. ACE autentica e baixa o necessário em conexão disponível; aplicativo informa cobertura offline e pendências.
3. Em campo, consulta território e registra tentativas/inspeções; salvamento local precede qualquer confirmação visual.
4. Em conexão disponível, inclusive retorno à base, envia operações; distingue salvo localmente de recebido e aceito.
5. ACE confere a produção; coordenação recebe, revisa e devolve ou aprova. Dados ainda no aparelho não são declarados recebidos.
6. Sistema consolida versão aprovada; secretaria gera relatório, imprime, colhe assinaturas se exigidas e encaminha pelo processo validado.
7. Correção posterior gera retificação e encaminhamento rastreável. Dispositivo institucional segue política de guarda local; celular pessoal não precisa ser entregue.

### F-02 — Papel e digitação assistida
1. ACE utiliza ficha aprovada quando essa for a opção operacional ou contingência.
2. Operador registra referência da ficha e transcreve com autoria/origem corretas; sistema soma e aponta inconsistências.
3. Coordenação confere com a fonte e resolve duplicatas de registros digitais antes de aprovar.
4. Relatório e encaminhamento seguem F-01. Guarda do papel e assinatura seguem política municipal homologada.

### F-03 — Levantamento e pontos estratégicos
1. Responsável seleciona modalidade e calendário, sem reutilizar automaticamente formulário de rotina.
2. Levantamento usa plano amostral validado e identifica coletas/remessas; PE usa agenda de inspeção e tratamento próprias.
3. Resultado laboratorial e tratamento permanecem eventos distintos; consolidação respeita modalidade e denominadores.
4. Relatório específico passa pela mesma conferência e homologação de destino.

## 12. Prioridade e limites do primeiro produto operacional

| Entrega | Conteúdo | Dependências de aceite |
| :--- | :--- | :--- |
| P0 — agregador após coleta | Transcrição/importação de produção, conferência, consolidação, PDF para impressão/assinatura e controle de encaminhamento; RF-025..030 e mínimo territorial. | Fichas reais, regras de soma, leiaute e responsáveis aprovados. Pode operar com papel sem aguardar aplicativo ou ML. |
| P1 — captura digital ACE | Cadastro territorial local, navegação familiar por setor/imóvel, ciclo, ficha diária, fechados/recuperação, modalidades habilitadas, offline e sincronização; RF-018..024, RF-029 e RF-031. Consulta APS demonstrável com mock RF-032, sem dados reais. | Validação com ACE, privacidade, aparelhos/conectividade e protocolo municipal. Modalidades não homologadas permanecem desabilitadas. |
| P2 — apoio analítico e preditivo | Requisitos anteriores de integração, mapas, diagnóstico, previsão e simulação, preservados com limites desta revisão. | Dados suficientes, avaliação de qualidade, validação epidemiológica e acesso às fontes. Não bloqueia P0. |
| Condicional | Integração automática com destinos, estoque completo, conector real de moradores APS, assinatura eletrônica e outras endemias. | Conector real exige contrato e acesso às fontes; RNF-006 já permite dados operacionais identificados autorizados. Demais extensões exigem levantamento e aceite de escopo. |

Prioridades são proposta de implementação para reduzir retrabalho, não declaração de funcionalidades já prontas. Protótipo visual e controles de interface não comprovam captura, integração, segurança ou aceitação de relatório oficial.

## 13. Evidências, decisões e rastreabilidade

A entrevista é relato de uma prática municipal e contém ruídos de transcrição. Não constitui norma nacional nem comprova regras de outros municípios. Perguntas e propostas do entrevistador não são automaticamente requisitos aceitos pelo ACE. Os números abaixo servem ao desenho e à validação do produto, não a metas individuais obrigatórias.

| Evidência | O que foi relatado / esclarecido | Consequência na especificação |
| :--- | :--- | :--- |
| E-01 | O e-Visita foi utilizado e deixou de estar ativo; papel e aplicativo chegaram a coexistir. | Não depender desse produto; prever contingência e migração sem duplicar produção. Motivo da desativação não foi confirmado. |
| E-02 | Cerca de 12 áreas, aproximadamente 800–1.100 imóveis por área no município entrevistado. | Cadastro por território e agente, importação inicial e alterações; volumes locais, sem limites fixos nacionais. |
| E-03 | Trabalho diário durante o ciclo; referência de seis ciclos anuais de cerca de dois meses. | Separar ciclo, jornada, semana de consolidação e levantamento amostral; calendário configurável e aprovado. |
| E-04 | Levantamento de índices na primeira semana do ciclo, quarteirões sorteados e inspeção alternada de cerca de metade dos imóveis selecionados. | Registrar plano e execução amostral separados; validar método e denominadores com responsável técnico, sem substituir levantamento por IA. |
| E-05 | Rotina identifica quarteirão, lado, rua, número e tipo de imóvel; não depende de nome dos moradores. | Formulário territorial rápido; cadastro de famílias não é requisito para visita. |
| E-06 | Depósitos têm categorias e contagens; há registro de produto e quantidade de tratamento. | Catálogos versionados; separar inspecionado, tratado, volume do recipiente e quantidade/unidade do produto. |
| E-07 | Coleta de amostras ocorre no levantamento local; a ficha antiga mantém campos não usados nessa rotina. | Campos por modalidade e município; não obrigar coleta em toda visita nem remover suporte para locais que a utilizam. |
| E-08 | Pontos estratégicos têm ficha e tratamento próprios; relato de inspeção quinzenal e tratamento perifocal bimestral, com 14 pontos locais. | Modalidade específica, agenda e registro separados; periodicidades não fixadas em código. |
| E-09 | Casas fechadas podem ser revisitadas e registradas como recuperadas; fechada e vazia não são sinônimos. | Histórico de tentativas e retorno relacionado, sem dupla contagem indevida. |
| E-10 | Referência predominante de 25–35 imóveis por dia; trecho posterior cita 25–85 e pode conter erro. | Medir usabilidade em rotina representativa; não usar contagem como meta automática nem comparação punitiva. |
| E-11 | Coordenador soma a produção da semana; digitador lança a consolidação no sistema de destino. | Agregar automaticamente, permitir conferência e gerar espelho do formulário oficial após homologação. |
| E-12 | Existem vários programas; um sistema citado trata pedidos, entrada e saída de insumos. | Dengue é o escopo inicial; distinguir consumo em visita de estoque e solicitação de produtos. |
| E-13 | Há lembrança de pelo menos quatro anos de consulta histórica; exportação não foi confirmada. | Levantar acesso, formato e disponibilidade reais antes de prometer carga histórica. |
| E-14 | Entrevistado percebe utilidade em localizar casos/famílias para bloqueio, mas diz que cadastro familiar pertence à Atenção Básica. | Prever consulta de moradores na ficha do imóvel com integração APS simulada (RF-032). Integração real permanece aberta e condicionada a acesso autorizado; não pressupor CadÚnico como fonte. |
| E-16 | Solicitante confirma uso atual de sistema para consultar casas do setor e pede experiência semelhante, com consulta de moradores oriunda da Atenção Básica inicialmente simulada. | Detalhar lista setorial e ficha do imóvel (RF-031), mock APS (RF-032) e validação comparativa com ACE (RNF-023). Nome e telas do sistema atual ainda precisam ser levantados. |
| E-15 | Solicitante aponta agregação, relatório para imprimir e eventual assinatura, com retorno do dispositivo/conectividade e decisão pela gestão. | Priorizar produto após coleta, impressão independente do dispositivo e validação com direção de Vigilância Ambiental. |

### 13.1 Contrastes com os requisitos anteriores

| Requisitos | Contraste / lacuna | Decisão desta versão |
| :--- | :--- | :--- |
| RF-012 versus E-03/E-04 | Rota só por risco pode interromper cobertura ou distorcer amostragem. | Planejamento aprovado governa a execução; IA propõe exceções justificadas. |
| RF-013 versus E-05/E-08/E-09 | Inspeção residencial genérica não representa terrenos, comércio, PE e retornos. | Adicionar modalidades, tipos de imóvel, acesso e vínculo entre tentativas. |
| RF-010/RF-017 versus E-11/E-15 | Relatório analítico não substitui demonstrativo de produção exigido pela secretaria. | Criar relatório operacional próprio, com versão, conferência, impressão e assinatura quando exigida. |
| RNF-004 versus E-15 | “100% offline” pode sugerir envio sem rede ou dados novos disponíveis offline. | Captura e consulta local offline; envio no retorno à conexão/base, sem exigir devolução física de celular pessoal. |
| RNF-006 versus RF-002/RF-014/E-14 | Geolocalização e associação familiar podem identificar pacientes/imóveis mesmo sem nome. | Revisado na versão 1.4: dados identificados podem existir no ambiente operacional autorizado, inclusive hospedado. Separar acesso operacional, visões analíticas e política de saída por destinatário; não aplicar anonimização indiscriminada às entradas municipais. |
| RNF-009 versus E-11 | Prometer eliminar digitação pressupõe integração não comprovada. | Reduzir soma manual imediatamente; eliminar lançamento no destino somente se houver integração validada. |
| RF-001/RF-015 | Automação de coleta e upload de arquivo bruto podem pressupor API disponível ou violar RNF-006. | Conectores condicionais, importação operacional autorizada e transformação antes de saídas externas/analíticas conforme a finalidade. |
| RNF-003 versus E-13 | Capacidade de dez anos foi confundida com disponibilidade histórica. | Manter capacidade; registrar janela efetivamente obtida e elegibilidade do modelo. |
| RF-005 versus fala do entrevistador | Entrevistador menciona um ou dois meses; requisito define duas a quatro semanas. | Manter duas a quatro semanas; horizonte maior é hipótese de pesquisa a validar. |
| Escopo ACS/ACE | Funções de campo e cadastros familiares foram aproximados indevidamente. | ACE é foco operacional inicial; ACS/APS mantém permissões e fluxo distintos. |

### 13.2 Rastreabilidade complementar

| Evidências | Requisitos impactados/adicionados | Validação |
| :--- | :--- | :--- |
| E-01, E-11, E-15 | RF-025..029; RNF-018, 019 | V-01..04; aceite 4..7 |
| E-02, E-03, E-05 | RF-002, 012, 018..020; RNF-020 | V-06, 09, 11; aceite 1..2 |
| E-04, E-07 | RF-006, 023; RNF-022 | V-01, 05, 06; aceite 2, 5 |
| E-06, E-08, E-12 | RF-021, 024, 030 | V-02, 05, 06; aceite 2, 5 |
| E-09 | RF-022, 025, 026 | V-05; aceite 2, 5, 7 |
| E-10, E-15 | RNF-004, 005, 013, 015..017 | V-07, 11; aceite 3 |
| E-13 | RF-001, 015; RNF-003, 014 | V-09 |
| E-14, E-16 | RF-002, 004, 014, 016, 031, 032; RNF-006, 008, 019, 023 | V-08, 09, 11, 12; aceite 9..11 |

**Critério de conclusão desta revisão:** necessidades relatadas têm requisito, limite de escopo ou pergunta de validação explícita. A revisão documental não equivale à homologação de procedimento sanitário, formulário oficial ou integração externa.

## 14. Validações e aceite do piloto

| ID | Pergunta / artefato necessário | Quem valida | Impacto enquanto pendente |
| :--- | :--- | :--- | :--- |
| V-01 | Obter ficha diária atual, consolidado semanal do coordenador, fichas de PE/levantamento e exemplos preenchidos sem dados identificáveis. | ACE + coordenação | Não fechar campos, ordem e obrigatoriedade por memória da entrevista. |
| V-02 | Confirmar nome, versão, destino e leiautes dos sistemas citados foneticamente na transcrição, incluindo produção e insumos. Há importação/API autorizada? | Digitador + direção | Não prometer transmissão automática ou substituição do sistema oficial. |
| V-03 | O que acontece após coleta: quem soma, confere, assina, envia, recebe e devolve? Prazo, competência, protocolo e canais? | Diretor(a) de Vigilância Ambiental | Não rotular relatório como oficial antes da homologação do fluxo e do destinatário. |
| V-04 | Quais relatórios são obrigatórios, quem assina, em quantas vias, com que formato e guarda? Papel comprova produção/presença em qual processo? | Direção + coordenação | Não converter relatório de produção em folha de ponto oficial por inferência. |
| V-05 | Validar categorias de depósitos, unidades, nomes de produtos, campos condicionais e regras de contagem/recuperação. | Responsável técnico + ACE | Não prescrever dose nem codificar números ambíguos da transcrição. |
| V-06 | Confirmar calendário de ciclos, seleção amostral, estratos, PE e fluxo laboratorial no piloto e em cada novo município. | Coordenação + laboratório | Números relatados permanecem parâmetros propostos, não regra nacional. |
| V-07 | Aparelhos pessoais/institucionais/compartilhados? Existe Wi-Fi na base, impressora, computador e responsável por suporte? | Gestão + ACE | Não exigir entrega do celular pessoal, plano de dados ou compra pelo agente. |
| V-08 | Quais campos identificados são necessários a cada tarefa, quem pode acessá-los e onde serão hospedados? Quais dados entram/saem de cada API, com qual destinatário, transformação e retenção? | Gestão + responsável por privacidade/segurança | Homologar matriz de fluxos e acessos antes de ativar dados reais; não bloquear hospedagem autorizada por princípio. |
| V-09 | Qual é o sistema atualmente usado para consultar as casas do setor? Obter demonstração com ACE, telas sem dados pessoais, códigos, ordenação, busca, exportação e atualização. Qual o período/formato do histórico? | Cadastro territorial/APS + digitador | Não depender de CadÚnico nem de dez anos de dados; começar com base validada disponível. |
| V-10 | Quem responde por equipamento, acesso, correção, perda, retenção e restauração? | Gestão + operação responsável | Definir suporte e contingência antes de uso produtivo. |
| V-11 | Comparar consulta do setor, localização do imóvel e abertura da ficha com o sistema atual: termos, ordem, número de passos, tempo de tarefa e dificuldades de leitura. | ACE de diferentes níveis de familiaridade digital | Homologar ficha com usuários de campo, além da aprovação gerencial. |
| V-12 | Qual sistema da Atenção Básica é a fonte de moradores? Qual identificador liga imóvel/endereço, quais campos o ACE pode consultar, quem corrige cadastro, com que atualização e possibilidade de acesso offline? | APS + ACE + gestão de acesso/privacidade | Implementar somente mock sintético até validar contrato, vinculação, permissões e guarda protegida dos dados reais. |

### 14.1 Roteiro de aceite ponta a ponta do piloto

1. Cadastrar uma área de teste e usuários ACE, coordenação e digitação, com permissões distintas.
2. Registrar casos de residência, comércio, terreno, fechado, vago, retorno e depósitos múltiplos; executar modalidade de PE/amostra apenas com ficha validada.
3. Desconectar rede, reiniciar aplicativo, reconectar e reenviar operações; demonstrar persistência, autoria e ausência de duplicação.
4. Lançar ficha em papel e detectar colisão com visita digital; corrigir com trilha de auditoria.
5. Consolidar semana de teste e reconciliar manualmente os totais por modalidade, agente e município com conjunto de referência aprovado.
6. Devolver, corrigir, aprovar e emitir PDF multipágina; imprimir em preto e branco, conferir legibilidade e obter aceite do modelo pela direção/destinatário.
7. Registrar encaminhamento e eventual rejeição; retificar e reemitir preservando a versão original.
8. Confirmar que ausência de ML, fonte externa ou alerta novo não impede coleta e relatório de produção.
9. Verificar isolamento entre municípios/agentes, acesso operacional identificado conforme permissão e bloqueio de dados pessoais em saídas externas não autorizadas; validar transformação por fluxo e ausência de dados pessoais nos conjuntos de ML.
10. ACE localiza imóveis por setor/quarteirão/rua/número, consulta ficha e histórico e registra visita sem reconstruir o cadastro; comparar com o fluxo atual observado.
11. Exercitar mock APS com moradores fictícios, imóvel sem vínculo, cadastro desatualizado, erro, indisponibilidade e acesso negado; em todos os casos a visita pode continuar.

12. Validar horários/fuso de RF-033, entrega sem duplicação e acesso restrito/compartilhado, incluindo API e exportação; confirmar que encaminhar uma orientação não libera automaticamente a previsão à equipe.

## 15. Índice de requisitos por módulo

Este índice aponta a definição principal; as referências cruzadas não concedem permissão adicional.

| Módulo | Requisitos funcionais | Requisitos de qualidade e restrições |
| :--- | :--- | :--- |
| ACE | RF-012, RF-031, RF-032, RF-014, RF-013, RF-020, RF-021, RF-022, RF-024 | RNF-004, RNF-005, RNF-015, RNF-016, RNF-017, RNF-023 |
| Coordenação | RF-002, RF-018, RF-019, RF-025, RF-026, RF-030 | RNF-022 |
| Digitador/operador | RF-029, RF-027, RF-028 | RNF-018, RNF-013, RNF-009 |
| Laboratório/levantamento | RF-023 | Regras compartilhadas referenciadas no módulo |
| Direção/gestor | RF-008, RF-017, RF-009, RF-011, RF-033 | RNF-001 |
| Epidemiologista | RF-010, RF-007, RF-005, RF-006, RF-016 | RNF-012, RNF-014 |
| Integrações/APS | RF-001, RF-015, RF-003, RF-004 | RNF-010, RNF-006 |
| Administração/plataforma | Regras compartilhadas referenciadas no módulo | RNF-008, RNF-002, RNF-007, RNF-019, RNF-020, RNF-003, RNF-011, RNF-021 |
