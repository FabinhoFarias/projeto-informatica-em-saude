# Documento de Requisitos de Software — Plataforma Denguinhos

**Versão:** 1.2 — revisão operacional a partir da entrevista com ACE  
**Data:** 25 de outubro de 2026  
**Estado:** especificação proposta; pontos assinalados como pendentes exigem validação municipal.  
**Fontes:** [transcrição de Moura](transcricoes/transcricaoMoura.txt), requisitos anteriores e esclarecimentos do solicitante sobre consolidação, impressão e assinatura.


## 1. Visão Geral do Sistema
A **Plataforma Denguinhos** é uma solução Software as a Service (SaaS) voltada à gestão preditiva de surtos de arboviroses (dengue, zika e chikungunya). O sistema combina dados de notificação histórica/em tempo real, variáveis climáticas, dados da Atenção Primária em Saúde (APS) e indicadores territoriais para gerar previsões de risco em nível intramunicipal (bairros e distritos sanitários), apoiando decisões dos gestores e o trabalho operacional dos Agentes de Combate às Endemias (ACE). A plataforma também deve agregar a produção das visitas, reduzir somas e redigitação e gerar documentos para conferência, impressão e eventual assinatura. O ACE é usuário operacional prioritário; coordenação e direção de Vigilância Ambiental validam a produção e decidem sua utilização. O fluxo de ACS/APS é relacionado, mas distinto e não deve ser tratado como equivalente ao trabalho do ACE.

---

## 2. Requisitos Funcionais (RF)

### 2.1 Ingestão e Processamento de Dados
- **RF-001 [Ingestão Multifonte]:** O sistema deve integrar bases oficiais (SINAN, DATASUS, InfoDengue) e dados climáticos/ambientais por conectores autorizados quando disponíveis, com importação assistida quando não houver integração. Registrar fonte, competência, data de obtenção, versão e limitações; não pressupor API ou atualização em tempo real em todas as fontes.
- **RF-002 [Geocodificação e Tratamento Territorial]:** O sistema deve mapear indicadores por bairro/distrito e suportar a hierarquia operacional município → área → quarteirão → lado → logradouro → imóvel. Geocodificação de dados identificáveis deve ocorrer na borda; a nuvem recebe somente dados compatíveis com RNF-006. Ausência de coordenadas não impede o registro territorial por código/endereço local.
- **RF-003 [Normalização de Nomes e Padrões]:** O sistema deve normalizar e mapear inconsistências em nomes de bairros e logradouros locais presentes nas fichas manuais do SINAN.
- **RF-004 [Leitura de Dados de Prontuário]:** O sistema deve permitir a ingestão de dados anonimizados de atendimentos de sintomas gripais/febris vindos da Atenção Primária (e-SUS APS/PEC) e UPAs locais.
- **RF-015 [Ingestão Manual via Importação de Planilhas (CSV/XLSX)]:** O sistema deve permitir que gestores ou técnicos sem perfil técnico selecionem localmente relatórios e planilhas exportadas do PEC (Atenção Primária) e SINAN/SIM (Vigilância Epidemiológica), validem e anonimizem/agreguem esses dados antes do envio à nuvem, atendendo também secretarias sem integração direta por API.

### 2.2 Camada Preditiva e Clusterização Espaço-Temporal
- **RF-005 [Modelagem Preditiva por Bairro]:** O sistema deve gerar estimativas da probabilidade e magnitude de surtos epidêmicos com antecedência útil (de 2 a 4 semanas) separadamente por bairro/distrito.
- **RF-006 [Identificação de Hotspots Históricos]:** O sistema deve executar algoritmos de clusterização espacial (ex.: DBSCAN, SaTScan) no histórico de dados do município para identificar bairros "gatilho" (áreas com reincidência histórica de início de epidemias).
- **RF-007 [Ajuste de Atraso de Notificação (*Nowcasting*)]:** O sistema deve aplicar correção estatística ao volume de notificações recentes para compensar a defasagem temporal entre a ocorrência dos sintomas e a consolidação do registro no SINAN.
- **RF-016 [Cruzamento Preditivo Territorial - Saúde Única]:** O módulo de análise espacial deve cruzar a densidade populacional e de atendimentos da Atenção Primária (PEC) com as notificações/focos da Vigilância Epidemiológica (SINAN/LIRAa) para identificar áreas de vulnerabilidade sobrepostas no território.

### 2.3 Dashboard Web (Gestores e Epidemiologistas)
- **RF-008 [Mapa Interativo de Calor/Risco]:** O dashboard deve apresentar um mapa geoespacial interativo do município com camadas de risco visual (ex.: verde, amarelo, laranja, vermelho) por bairro e distrito.
- **RF-009 [Geração de Recomendações de Ação]:** O sistema deve traduzir o risco territorial em recomendações explicadas e datadas para revisão da coordenação. A decisão operacional e os parâmetros de intervenção pertencem ao responsável autorizado; a IA não prescreve dose de produto, não confirma foco laboratorial e não altera automaticamente ciclos ou atribuições.
- **RF-010 [Módulo Epidemiológico Avançado]:** O dashboard deve permitir a exportação de dados em formatos padrão (CSV, JSON, XLSX), visualização de séries temporais, curvas epidêmicas e ajuste de parâmetros de sensibilidade do modelo.
- **RF-011 [Simulação e Alocação de Recursos]:** O sistema deve permitir ao gestor simular o quantitativo de agentes (ACS/ACE) e insumos (larvicidas, testes rápidos) necessários com base na projeção de risco por região.
- **RF-017 [Módulo de Diagnóstico Situacional Automatizado]:** A plataforma deve gerar relatórios visuais consolidados com indicadores e temas prioritários do território, unificando os dados da APS e da Vigilância Epidemiológica para subsidiar planos de intervenção sem necessidade de análise manual.

### 2.4 Aplicativo Móvel (ACS e ACE)
- **RF-012 [Atribuição de Rota Inteligente]:** O aplicativo deve exibir a área e o planejamento aprovados para o ACE, incluindo quarteirões, lados, imóveis, pendências e retornos. Sugestões preditivas são auxiliares e não substituem a cobertura do ciclo, o planejamento amostral ou a decisão da coordenação. Reatribuição deve ser autorizada e rastreável.
- **RF-013 [Registro de Visita e Criadouro]:** O ACE deve registrar visitas a diferentes tipos de imóvel, resultados de acesso, depósitos inspecionados, tratamentos, orientações e, quando aplicável, amostras, conforme RF-018 a RF-029. Contagens são numéricas; suspeita visual e confirmação laboratorial são estados diferentes. O salvamento local deve funcionar sem conexão e sem exigir dados de moradores.
- **RF-014 [Alertas de Campo]:** O sistema deve disponibilizar alertas territoriais autorizados e ações de campo para a área atribuída ao ACE, informando fonte, data e atualização. Novos alertas dependem de conexão; alertas já baixados permanecem consultáveis offline. Não expor nome, CPF, composição familiar ou endereço de paciente na nuvem; ações em imóvel identificado exigem o fluxo local restrito previsto em RNF-006.

---

## 3. Requisitos Não Funcionais (RNF)

### 3.1 Desempenho e Escalabilidade
- **RNF-001 [Tempo de Resposta do Dashboard]:** O dashboard web deve carregar os mapas interativos e painéis analíticos em no máximo 3 segundos sob condições normais de navegação.
- **RNF-002 [Arquitetura Multitenant / SaaS]:** A arquitetura deve suportar múltiplos municípios de forma isolada e escalável na nuvem, permitindo a adição de novas cidades sem reestruturação do código-fonte.
- **RNF-003 [Escalabilidade de Dados]:** O banco de dados geoespacial deve processar e armazenar até 10 anos de histórico de notificações e milhões de registros, mantendo as metas de consulta em carga de referência documentada. Capacidade de armazenamento não implica que todas as fontes forneçam dez anos de histórico; ingestão e modelos devem explicitar o período realmente disponível.

### 3.2 Usabilidade e Acessibilidade
- **RNF-004 [Funcionamento Offline do App Móvel]:** O módulo de campo deve permitir consultar o planejamento previamente baixado, registrar visitas e manter pendências inteiramente offline. A sincronização ocorre quando houver conexão e sessão válida, incluindo no retorno à base. Login inicial, novas atribuições, alertas novos e envio à secretaria dependem de conectividade. Mostrar claramente o que foi salvo localmente, enviado e aceito pelo servidor.
- **RNF-005 [Design Responsivo e Ergonômico]:** A interface mobile deve ser otimizada para operação com uma única mão, alto contraste (para uso sob luz solar direta) e telas de tamanho variado em dispositivos Android de entrada.
- **RNF-013 [Operação Sem Necessidade de TI Local (*No-Code Interface*)]:** A interface web de gestão e alimentação de dados por planilhas deve ser autoexplicativa e pronta para uso por gestores municipais, dispensando a necessidade de programadores ou técnicos de TI locais.

### 3.3 Segurança, Privacidade e Conformidade (LGPD)
- **RNF-006 [Anonimização na Borda (*Edge Processing*)]:** Nenhum dado pessoal identificável (PII) de pacientes (ex.: nome, CPF) deve ser transmitido ou armazenado na nuvem. A anonimização e agregação epidemiológica por bairro devem ocorrer na borda do sistema local, com avaliação de risco de reidentificação. Endereços, códigos reversíveis de imóvel, geolocalização precisa e vínculos de visitas também podem permitir identificação: sua guarda e resolução permanecem no ambiente municipal restrito enquanto esse requisito vigorar. A nuvem recebe produção agregada e dados efetivamente não identificáveis, sem chave que permita reconstruir moradores. Uma versão centralizada com visitas identificáveis exige revisão explícita deste requisito antes da implementação; não está autorizada por esta especificação. Contas de agentes e responsáveis são dados de usuários, com finalidade e acesso próprios, não cadastro de pacientes.
- **RNF-007 [Criptografia de Dados]:** Todos os dados devem ser criptografados em trânsito (protocolo TLS 1.3) e em repouso (algoritmo AES-256).
- **RNF-008 [Controle de Acesso de Usuários]:** O sistema deve adotar controle de acesso baseado em papéis (RBAC - *Role-Based Access Control*) com autenticação multifator (MFA) para perfis administrativos e de gestão.

### 3.4 Interoperabilidade e Resiliência de Dados
- **RNF-009 [Arquitetura Sem Migração de Bases]:** A solução deve interoperar com as bases de dados municipais e federais existentes por meio de conectores/APIs sem exigir substituição dos sistemas legados. A captura digital e a agregação são mudanças assistidas de processo; manter saídas utilizáveis no fluxo atual e contingência em papel. Integração direta só será prometida após verificar documentação, acesso e homologação do destino.
- **RNF-010 [Padronização Técnica de Dados]:** A estrutura de integração de saúde deve prever mapeamento utilizando códigos padrão da **CID-10/11** para diagnósticos e notificações.
- **RNF-014 [Tolerância a Inconsistências de Cadastros (Tratamento de Subnotificação/Lacunas)]:** O motor de análise e cruzamento de dados deve ser capaz de tratar automaticamente lacunas de cobertura do PEC/Atenção Primária, gerando diagnósticos e alertas sem falhar devido a faltas pontuais de cadastro de residentes.

### 3.5 Manutenibilidade e Confiabilidade
- **RNF-011 [Disponibilidade do Serviço]:** A plataforma na nuvem deve apresentar disponibilidade (SLA) de no mínimo 99.5% de *uptime*.
- **RNF-012 [Mitigação de Viés Algorítmico e Falsos Alarmes]:** O sistema deve disponibilizar relatórios periódicos de calibração do modelo preditivo para que epidemiologistas ajustem as margens de erro e previnam a "fadiga de alertas" nos órgãos de decisão.

---

## 4. Matriz de Rastreabilidade Simplificada

| Categoria | ID | Requisito | Papel de Usuário Principal |
| :--- | :--- | :--- | :--- |
| **Ingestão** | RF-001 / RF-015 | Ingestão Multifonte e Importação de Planilhas | Administrador / Gestor Municipal |
| **Geolocalização**| RF-002 / RF-006 / RF-016 | Geocodificação, Clusterização e Cruzamento Saúde Única | Epidemiologista / Pesquisador |
| **Gestão** | RF-008 / RF-009 / RF-017 | Dashboard, Recomendações e Diagnóstico Situacional | Gestor de Saúde Municipal |
| **Campo** | RF-012 / RF-013 | Rotas Otimizadas e Registro Offline | Agentes de Endemias (ACE / ACS) |
| **Segurança** | RNF-006 / RNF-007 | Anonimização e Criptografia | Encarregado de Dados (DPO) |
| **Usabilidade** | RNF-013 / RNF-014 | Operação No-Code e Tolerância a Falhas de Cadastro | Gestor / Técnico da Secretaria |

## 5. Evidências e decisões da revisão operacional

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
| E-14 | Entrevistado percebe utilidade em localizar casos/famílias para bloqueio, mas diz que cadastro familiar pertence à Atenção Básica. | Preservar a necessidade operacional e o limite de privacidade; não integrar CadÚnico ou dados nominativos como requisito aprovado. |
| E-15 | Solicitante aponta agregação, relatório para imprimir e eventual assinatura, com retorno do dispositivo/conectividade e decisão pela gestão. | Priorizar produto após coleta, impressão independente do dispositivo e validação com direção de Vigilância Ambiental. |

### 5.1 Contrastes com os requisitos anteriores

| Requisitos | Contraste / lacuna | Decisão desta versão |
| :--- | :--- | :--- |
| RF-012 versus E-03/E-04 | Rota só por risco pode interromper cobertura ou distorcer amostragem. | Planejamento aprovado governa a execução; IA propõe exceções justificadas. |
| RF-013 versus E-05/E-08/E-09 | Inspeção residencial genérica não representa terrenos, comércio, PE e retornos. | Adicionar modalidades, tipos de imóvel, acesso e vínculo entre tentativas. |
| RF-010/RF-017 versus E-11/E-15 | Relatório analítico não substitui demonstrativo de produção exigido pela secretaria. | Criar relatório operacional próprio, com versão, conferência, impressão e assinatura quando exigida. |
| RNF-004 versus E-15 | “100% offline” pode sugerir envio sem rede ou dados novos disponíveis offline. | Captura e consulta local offline; envio no retorno à conexão/base, sem exigir devolução física de celular pessoal. |
| RNF-006 versus RF-002/RF-014/E-14 | Geolocalização e associação familiar podem identificar pacientes/imóveis mesmo sem nome. | Manter detalhe identificável na borda municipal; cruzamento preditivo por agregados. Identificação centralizada depende de revisão de escopo e privacidade. |
| RNF-009 versus E-11 | Prometer eliminar digitação pressupõe integração não comprovada. | Reduzir soma manual imediatamente; eliminar lançamento no destino somente se houver integração validada. |
| RF-001/RF-015 | Automação de coleta e upload de arquivo bruto podem pressupor API disponível ou violar RNF-006. | Conectores condicionais e tratamento local antes do envio. |
| RNF-003 versus E-13 | Capacidade de dez anos foi confundida com disponibilidade histórica. | Manter capacidade; registrar janela efetivamente obtida e elegibilidade do modelo. |
| RF-005 versus fala do entrevistador | Entrevistador menciona um ou dois meses; requisito define duas a quatro semanas. | Manter duas a quatro semanas; horizonte maior é hipótese de pesquisa a validar. |
| Escopo ACS/ACE | Funções de campo e cadastros familiares foram aproximados indevidamente. | ACE é foco operacional inicial; ACS/APS mantém permissões e fluxo distintos. |

## 6. Papéis, responsabilidades e limites

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

## 7. Novos requisitos funcionais operacionais

Os IDs anteriores permanecem estáveis. Os critérios a seguir são verificáveis; modelos de documentos e classificações pendentes devem ser homologados antes de fechar sua implementação.

### RF-018 — Cadastro territorial e atribuição de área
- Manter códigos estáveis para área, quarteirão, lado e imóvel; código externo, tipo e situação cadastral, origem e data da atualização, quando disponíveis.
- Suportar quarteirão com mais de quatro lados, imóvel sem número, múltiplos imóveis em um endereço, área sem mapa e alterações cadastrais sem apagar visitas anteriores.
- Importar cadastro com prévia, validação, identificação de duplicatas e relatório de rejeições. Ausência de cadastro completo não bloqueia início assistido com identificadores locais.
- Registrar vigência da atribuição ACE/área e substituições; preservar autoria e território da produção passada.
- **Aceite:** reatribuir área não transfere autoria de visitas; tentativa de consultar outra área sem autorização é negada. Dados identificáveis seguem RNF-006.

### RF-019 — Planejamento por ciclo e modalidade
- Configurar ciclo, datas, área, responsável, dias úteis, exceções e metas pactuadas. Distinguir visita de rotina, retorno/recuperação, levantamento amostral, ponto estratégico e ação de bloqueio autorizada.
- Informar pendências por quarteirão e cobertura do ciclo; quarteirão trabalhado não é automaticamente concluído.
- Recomendações de risco devem mostrar justificativa, validade e decisão do supervisor; não reordenar silenciosamente trabalho baixado.
- **Aceite:** registrar produção cotidiana fora da semana amostral; inspeção de amostra não encerra automaticamente o ciclo da área.

### RF-020 — Ficha diária digital do ACE
- Iniciar a jornada com agente e território previamente selecionados; reaproveitar contexto de quarteirão/lado/rua entre registros e permitir correção explícita.
- Registrar identificador da visita, autor, data da atividade, data do lançamento, modalidade, ciclo, imóvel local e resultado de acesso.
- Catálogo inicial de tipos: residência, comércio, terreno baldio e outros com descrição; PE tem fluxo próprio, não é confundido com residência.
- Admitir rascunho e conclusão; exigir somente campos pertinentes ao acesso e à modalidade. Não exigir CPF, nome de morador ou cadastro familiar.
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

### RF-023 — Levantamento de índices e laboratório
- Manter campanha, estratos, plano amostral, quarteirões selecionados, imóveis elegíveis, seleção executada e responsável pelo plano.
- Aceitar plano gerado por ferramenta oficial externa; geração de sorteio própria depende de validação metodológica e não é requisito obrigatório do primeiro ciclo.
- Registrar amostra por código único local, origem territorial, coletor, data, remessa, recebimento e resultado pendente/positivo/negativo/inconclusivo, com método e responsável quando exigidos.
- Índices devem explicitar fórmula, numerador, denominador, período, modalidade e limitações; não calcular indicador oficial sem regra aprovada e dados suficientes.
- **Aceite:** resultado pendente não vira negativo; rotina sem coleta não exige amostra; resultado corrigido mantém a versão anterior.

### RF-024 — Pontos estratégicos (PE)
- Cadastro e ficha específicos, agenda de inspeção e agenda de tratamento distintas; histórico de inspeção, recipientes, amostras e intervenções quando aplicáveis.
- Configurar periodicidades por município e vigência; o relato quinzenal/bimestral é referência local sujeita a confirmação.
- **Aceite:** uma inspeção sem aplicação não gera consumo nem tratamento perifocal; ausência de tratamento fica justificada quando necessário.

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

### RF-029 — Papel e operação assistida
- Permitir uso digital, transcrição de papel ou operação híbrida por equipe/período, com origem de cada lançamento e responsável pela digitação.
- Identificar ficha, agente, data de atividade e competência; confrontar importação/transcrição com registros digitais existentes. Duplicata suspeita exige conferência, não soma automática.
- Papel pode ser contingência e documento de assinatura; eliminar dupla escrituração como obrigação somente após validação municipal.
- **Aceite:** ficha digitada posteriormente preserva data de campo e digitador real; mesma ficha não pode entrar duas vezes sem alerta e resolução rastreável.

### RF-030 — Consumo de insumos e limite do estoque
- Consolidar consumo registrado em tratamentos por produto, unidade, modalidade e período. Registrar correções sem alterar retroativamente registros aprovados.
- Pedidos, entradas, saídas e saldo oficial pertencem ao sistema municipal/estadual citado, até confirmar seu nome e interface; módulo completo de estoque não faz parte do primeiro escopo.
- **Aceite:** somar gramas apenas com gramas, litros apenas com litros; consumo estimado não é apresentado como saldo de estoque ou solicitação já enviada.

## 8. Dados, contagens e estados essenciais

| Entidade | Dados/relações mínimos e invariantes |
| :--- | :--- |
| Configuração municipal | Tenant, calendário, modalidade, catálogos, regras de cálculo, modelo de relatório e respectivas versões/vigências. |
| Território/imóvel (ambiente local restrito) | Hierarquia territorial, identificador estável, endereço quando necessário, situação cadastral, origem e atualização. Não inferir domicílio familiar a partir de imóvel. |
| Ciclo/planejamento | Período, área, responsável, modalidade, atribuições e aprovação. Plano amostral tem seleção e denominadores próprios. |
| Visita/tentativa (local restrito quando identificável) | UUID, data da atividade/lançamento, autoria, origem digital/papel, imóvel, ciclo, modalidade, acesso, vínculo de retorno e versão. |
| Observação de depósito/tratamento | Categoria e versão, contagens, produto, quantidade, unidade e tipo de tratamento; obrigatoriedade depende da modalidade e do acesso. |
| Amostra | Código, cadeia de recebimento e resultado com autor/data; separar observação em campo de confirmação. |
| Produção agregada | Município, área não identificável quando permitido, agente conforme autorização, período, modalidade, métricas, qualidade e versão; nenhum vínculo reversível de paciente/imóvel na nuvem. |
| Consolidação/documento | Competência, filtros, regras, revisão, aprovador, totais, status, versão, arquivo emitido e encaminhamento. |
| Sincronização | Operação UUID, versão, origem/dispositivo, reconhecimento e erro; não eliminar dado pendente por expiração da sessão. |

**Regras de cálculo a homologar:** definição de imóvel trabalhado, inspecionado e tratado; contagem de recuperados entre semanas; inclusão de PE e amostra; tratamento de imóvel vago/recusa; conclusão de quarteirão; denominadores de índices; soma de produtos e arredondamento. Até validação, usar indicadores descritivos explícitos e rótulo provisório, sem reproduzir número como estatística oficial.

## 9. Fluxos operacionais de referência

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

## 10. Requisitos não funcionais adicionais e critérios de implantação

- **RNF-015 — Usabilidade operacional validada com ACE:** testar as tarefas de visita comum, imóvel fechado, recuperação, vários depósitos e jornada offline com profissionais de campo e aparelhos reais. Alvo proposto: pelo menos 90% de conclusão sem ajuda nas tarefas essenciais, zero perda de registros salvos e nenhuma digitação obrigatória repetida de contexto territorial. Medir tempo de registro em comparação com a ficha; a melhoria pretendida é administrativa, sem prometer reduzir tempo técnico de inspeção. Meta final e amostra do teste serão pactuadas antes do piloto.
- **RNF-016 — Sincronização sem perda ou duplicação:** UUID idempotente por operação, confirmação por item, reenvio após falha, persistência após reinício e preservação de conflitos. Testar queda antes/depois do envio, resposta perdida, reconexão, sessão expirada e aparelho sem espaço. Não usar sobrescrita silenciosa; registro pendente deve permanecer visível.
- **RNF-017 — Dispositivos pessoais e compartilhados:** confirmar titularidade e disponibilidade antes da implantação. Suportar isolamento de contas e encerramento de sessão sem revelar dados de outro agente; acesso local protegido, retenção mínima, procedimento para perda/troca do aparelho e recuperação dos dados já sincronizados. Trabalho não sincronizado em aparelho perdido não tem recuperação garantida: orientar sincronização e contingência. Não exigir equipamento pessoal ou conectividade móvel contínua para adesão.
- **RNF-018 — Reprodutibilidade documental:** relatório emitido referencia um snapshot e regras versionadas; gerar novamente a mesma versão deve manter os mesmos dados e totais. Mudança de catálogo/leiaute não altera documento anterior. Impressão com paginação, rótulos repetidos e totais reconciliados deve ser verificada com a secretaria.
- **RNF-019 — Auditoria e segregação:** rastrear criação, transcrição, correção, entrega, conferência, aprovação, emissão e encaminhamento, com usuário, data e motivo pertinente. Autorizar no servidor/serviço local e limitar por município, área e função; logs não contêm nomes de pacientes nem cópias de fichas identificáveis.
- **RNF-020 — Configuração sem bifurcar o produto:** calendários, tipos, unidades, modalidades, perfis e relatórios são configuráveis com vigência, aprovação e prévia do impacto. Não fixar números ou práticas do município entrevistado como regras nacionais. Histórico deve conservar regras originais.
- **RNF-021 — Continuidade e guarda:** definir com o município prazo de retenção por classe documental, cópias de segurança do ambiente local e da nuvem, responsáveis e objetivos de recuperação antes do piloto. Realizar teste de restauração; nuvem disponível não garante disponibilidade da borda municipal. Não apagar registros ao encerrar ciclo.
- **RNF-022 — Transparência da qualidade:** diferenciar zero, desconhecido, não se aplica, não sincronizado e pendente de conferência. Exibir atualização por fonte; indisponibilidade de ML não bloqueia coleta nem relatório operacional de dados conferidos.

RNF-001 e RNF-011 continuam como metas de dashboard e nuvem, respectivamente. Seu cenário de medição deve registrar rede, dispositivo, quantidade de usuários, volume e janela de observação antes do aceite; não são prova de desempenho já alcançado.

## 11. Prioridade e limites do primeiro produto operacional

| Entrega | Conteúdo | Dependências de aceite |
| :--- | :--- | :--- |
| P0 — agregador após coleta | Transcrição/importação de produção, conferência, consolidação, PDF para impressão/assinatura e controle de encaminhamento; RF-025..030 e mínimo territorial. | Fichas reais, regras de soma, leiaute e responsáveis aprovados. Pode operar com papel sem aguardar aplicativo ou ML. |
| P1 — captura digital ACE | Cadastro territorial local, ciclo, ficha diária, fechados/recuperação, modalidades habilitadas, offline e sincronização; RF-018..024 e RF-029. | Validação com ACE, privacidade, aparelhos/conectividade e protocolo municipal. Modalidades não homologadas permanecem desabilitadas. |
| P2 — apoio analítico e preditivo | Requisitos anteriores de integração, mapas, diagnóstico, previsão e simulação, preservados com limites desta revisão. | Dados suficientes, avaliação de qualidade, validação epidemiológica e acesso às fontes. Não bloqueia P0. |
| Condicional | Integração automática com destinos, estoque completo, cadastro familiar nominativo, assinatura eletrônica e outras endemias. | Novo levantamento e aceite de escopo; identificação centralizada exige revisão de RNF-006. |

Prioridades são proposta de implementação para reduzir retrabalho, não declaração de funcionalidades já prontas. Protótipo visual e controles de interface não comprovam captura, integração, segurança ou aceitação de relatório oficial.

## 12. Pendências obrigatórias de validação

| ID | Pergunta / artefato necessário | Quem valida | Impacto enquanto pendente |
| :--- | :--- | :--- | :--- |
| V-01 | Obter ficha diária atual, consolidado semanal do coordenador, fichas de PE/levantamento e exemplos preenchidos sem dados identificáveis. | ACE + coordenação | Não fechar campos, ordem e obrigatoriedade por memória da entrevista. |
| V-02 | Confirmar nome, versão, destino e leiautes dos sistemas citados foneticamente na transcrição, incluindo produção e insumos. Há importação/API autorizada? | Digitador + direção | Não prometer transmissão automática ou substituição do sistema oficial. |
| V-03 | O que acontece após coleta: quem soma, confere, assina, envia, recebe e devolve? Prazo, competência, protocolo e canais? | Diretor(a) de Vigilância Ambiental | Não rotular relatório como oficial antes da homologação do fluxo e do destinatário. |
| V-04 | Quais relatórios são obrigatórios, quem assina, em quantas vias, com que formato e guarda? Papel comprova produção/presença em qual processo? | Direção + coordenação | Não converter relatório de produção em folha de ponto oficial por inferência. |
| V-05 | Validar categorias de depósitos, unidades, nomes de produtos, campos condicionais e regras de contagem/recuperação. | Responsável técnico + ACE | Não prescrever dose nem codificar números ambíguos da transcrição. |
| V-06 | Confirmar calendário de ciclos, seleção amostral, estratos, PE e fluxo laboratorial no piloto e em cada novo município. | Coordenação + laboratório | Números relatados permanecem parâmetros propostos, não regra nacional. |
| V-07 | Aparelhos pessoais/institucionais/compartilhados? Existe Wi-Fi na base, impressora, computador e responsável por suporte? | Gestão + ACE | Não exigir entrega do celular pessoal, plano de dados ou compra pelo agente. |
| V-08 | Quais dados detalhados devem permanecer locais e quem mantém a borda? Quais saídas agregadas são não identificáveis? | Gestão + responsável por privacidade/segurança | Bloquear envio de dados identificáveis à nuvem; resolver antes de P1. |
| V-09 | Cadastro de imóveis existe, pode ser exportado e atualizado? Histórico de produção está disponível por quanto tempo e formato? | Cadastro territorial/APS + digitador | Não depender de CadÚnico nem de dez anos de dados; começar com base validada disponível. |
| V-10 | Quem responde por equipamento, acesso, correção, perda, retenção e restauração? | Gestão + operação responsável | Definir suporte e contingência antes de uso produtivo. |
| V-11 | Tempo de tarefa, tolerância a telas, dificuldades de leitura e adequação à rotina real. | ACE de diferentes níveis de familiaridade digital | Homologar ficha com usuários de campo, além da aprovação gerencial. |

### 12.1 Roteiro de aceite ponta a ponta do piloto

1. Cadastrar uma área de teste e usuários ACE, coordenação e digitação, com permissões distintas.
2. Registrar casos de residência, comércio, terreno, fechado, vago, retorno e depósitos múltiplos; executar modalidade de PE/amostra apenas com ficha validada.
3. Desconectar rede, reiniciar aplicativo, reconectar e reenviar operações; demonstrar persistência, autoria e ausência de duplicação.
4. Lançar ficha em papel e detectar colisão com visita digital; corrigir com trilha de auditoria.
5. Consolidar semana de teste e reconciliar manualmente os totais por modalidade, agente e município com conjunto de referência aprovado.
6. Devolver, corrigir, aprovar e emitir PDF multipágina; imprimir em preto e branco, conferir legibilidade e obter aceite do modelo pela direção/destinatário.
7. Registrar encaminhamento e eventual rejeição; retificar e reemitir preservando a versão original.
8. Confirmar que ausência de ML, fonte externa ou alerta novo não impede coleta e relatório de produção.
9. Verificar isolamento entre municípios/agentes e que dados identificáveis não atravessam a fronteira local/nuvem.

## 13. Rastreabilidade complementar

| Evidências | Requisitos impactados/adicionados | Validação |
| :--- | :--- | :--- |
| E-01, E-11, E-15 | RF-025..029; RNF-018, 019 | V-01..04; aceite 4..7 |
| E-02, E-03, E-05 | RF-002, 012, 018..020; RNF-020 | V-06, 09, 11; aceite 1..2 |
| E-04, E-07 | RF-006, 023; RNF-022 | V-01, 05, 06; aceite 2, 5 |
| E-06, E-08, E-12 | RF-021, 024, 030 | V-02, 05, 06; aceite 2, 5 |
| E-09 | RF-022, 025, 026 | V-05; aceite 2, 5, 7 |
| E-10, E-15 | RNF-004, 005, 013, 015..017 | V-07, 11; aceite 3 |
| E-13 | RF-001, 015; RNF-003, 014 | V-09 |
| E-14 | RF-002, 004, 014, 016; RNF-006, 008, 019 | V-08; aceite 9 |

**Critério de conclusão desta revisão:** necessidades relatadas têm requisito, limite de escopo ou pergunta de validação explícita. A revisão documental não equivale à homologação de procedimento sanitário, formulário oficial ou integração externa.
