
## 1. Visão Geral do Sistema
A **Plataforma Denguinhos** é uma solução Software as a Service (SaaS) voltada à gestão preditiva de surtos de arboviroses (dengue, zika e chikungunya). O sistema combina dados de notificação histórica/em tempo real, variáveis climáticas, dados da Atenção Primária em Saúde (APS) e indicadores territoriais para gerar previsões de risco em nível intramunicipal (bairros e distritos sanitários), automatizando recomendações para gestores e direcionando rotas de atuação para os Agentes Comunitários de Saúde (ACS) e Agentes de Combate às Endemias (ACE).

---

## 2. Requisitos Funcionais (RF)

### 2.1 Ingestão e Processamento de Dados
- **RF-001 [Ingestão Multifonte]:** O sistema deve ingerir e integrar automaticamente bases de dados oficiais (SINAN, DATASUS, InfoDengue) e dados climáticos/ambientais (temperatura, precipitação e umidade).
- **RF-002 [Geocodificação e Tratamento Territorial]:** O sistema deve mapear e geocodificar as notificações e os locais de atendimento até o nível de bairros, distritos sanitários e quadras.
- **RF-003 [Normalização de Nomes e Padrões]:** O sistema deve normalizar e mapear inconsistências em nomes de bairros e logradouros locais presentes nas fichas manuais do SINAN.
- **RF-004 [Leitura de Dados de Prontuário]:** O sistema deve permitir a ingestão de dados anonimizados de atendimentos de sintomas gripais/febris vindos da Atenção Primária (e-SUS APS/PEC) e UPAs locais.
- **RF-015 [Ingestão Manual via Importação de Planilhas (CSV/XLSX)]:** O sistema deve permitir que gestores ou técnicos sem perfil técnico façam o *upload* manual de relatórios e planilhas exportadas do PEC (Atenção Primária) e SINAN/SIM (Vigilância Epidemiológica) para secretarias municipais que não possuem integração direta por API.

### 2.2 Camada Preditiva e Clusterização Espaço-Temporal
- **RF-005 [Modelagem Preditiva por Bairro]:** O sistema deve gerar estimativas da probabilidade e magnitude de surtos epidêmicos com antecedência útil (de 2 a 4 semanas) separadamente por bairro/distrito.
- **RF-006 [Identificação de Hotspots Históricos]:** O sistema deve executar algoritmos de clusterização espacial (ex.: DBSCAN, SaTScan) no histórico de dados do município para identificar bairros "gatilho" (áreas com reincidência histórica de início de epidemias).
- **RF-007 [Ajuste de Atraso de Notificação (*Nowcasting*)]:** O sistema deve aplicar correção estatística ao volume de notificações recentes para compensar a defasagem temporal entre a ocorrência dos sintomas e a consolidação do registro no SINAN.
- **RF-016 [Cruzamento Preditivo Territorial - Saúde Única]:** O módulo de análise espacial deve cruzar a densidade populacional e de atendimentos da Atenção Primária (PEC) com as notificações/focos da Vigilância Epidemiológica (SINAN/LIRAa) para identificar áreas de vulnerabilidade sobrepostas no território.

### 2.3 Dashboard Web (Gestores e Epidemiologistas)
- **RF-008 [Mapa Interativo de Calor/Risco]:** O dashboard deve apresentar um mapa geoespacial interativo do município com camadas de risco visual (ex.: verde, amarelo, laranja, vermelho) por bairro e distrito.
- **RF-009 [Geração de Recomendações de Ação]:** O sistema deve traduzir o nível de risco de cada bairro em recomendações operacionais concretas (ex.: intensificação de bloqueio de vetor, alocação suplementar de insumos, campanhas de conscientização focalizadas).
- **RF-010 [Módulo Epidemiológico Avançado]:** O dashboard deve permitir a exportação de dados em formatos padrão (CSV, JSON, XLSX), visualização de séries temporais, curvas epidêmicas e ajuste de parâmetros de sensibilidade do modelo.
- **RF-011 [Simulação e Alocação de Recursos]:** O sistema deve permitir ao gestor simular o quantitativo de agentes (ACS/ACE) e insumos (larvicidas, testes rápidos) necessários com base na projeção de risco por região.
- **RF-017 [Módulo de Diagnóstico Situacional Automatizado]:** A plataforma deve gerar relatórios visuais consolidados com indicadores e temas prioritários do território, unificando os dados da APS e da Vigilância Epidemiológica para subsidiar planos de intervenção sem necessidade de análise manual.

### 2.4 Aplicativo Móvel (ACS e ACE)
- **RF-012 [Atribuição de Rota Inteligente]:** O aplicativo móvel deve exibir ao agente a lista priorizada de bairros, quadras e imóveis a serem visitados no dia, ordenados pela criticidade preditiva.
- **RF-013 [Registro de Visita e Criadouro]:** O agente deve conseguir registrar inspeções residenciais, identificação de focos, aplicação de larvicidas e orientações prestadas diretamente no app.
- **RF-014 [Alertas de Campo]:** O aplicativo deve notificar os agentes sobre surgimento de casos suspeitos notificados recentemente na sua microárea de cobertura.

---

## 3. Requisitos Não Funcionais (RNF)

### 3.1 Desempenho e Escalabilidade
- **RNF-001 [Tempo de Resposta do Dashboard]:** O dashboard web deve carregar os mapas interativos e painéis analíticos em no máximo 3 segundos sob condições normais de navegação.
- **RNF-002 [Arquitetura Multitenant / SaaS]:** A arquitetura deve suportar múltiplos municípios de forma isolada e escalável na nuvem, permitindo a adição de novas cidades sem reestruturação do código-fonte.
- **RNF-003 [Escalabilidade de Dados]:** O banco de dados geoespacial deve processar e armazenar até 10 anos de histórico de notificações e milhões de registros sem degradação do desempenho de busca.

### 3.2 Usabilidade e Acessibilidade
- **RNF-004 [Funcionamento Offline do App Móvel]:** O aplicativo para ACS/ACE deve funcionar 100% offline para registros e consultas de rotas diárias, sincronizando dados automaticamente assim que reestabelecer conexão à internet.
- **RNF-005 [Design Responsivo e Ergonômico]:** A interface mobile deve ser otimizada para operação com uma única mão, alto contraste (para uso sob luz solar direta) e telas de tamanho variado em dispositivos Android de entrada.
- **RNF-013 [Operação Sem Necessidade de TI Local (*No-Code Interface*)]:** A interface web de gestão e alimentação de dados por planilhas deve ser autoexplicativa e pronta para uso por gestores municipais, dispensando a necessidade de programadores ou técnicos de TI locais.

### 3.3 Segurança, Privacidade e Conformidade (LGPD)
- **RNF-006 [Anonimização na Borda (*Edge Processing*)]:** Nenhum dado pessoal identificável (PII) de pacientes (ex.: nome, CPF) deve ser transmitido ou armazenado na nuvem. A anonimização irreversível e agregação por bairro devem ocorrer na borda do sistema local.
- **RNF-007 [Criptografia de Dados]:** Todos os dados devem ser criptografados em trânsito (protocolo TLS 1.3) e em repouso (algoritmo AES-256).
- **RNF-008 [Controle de Acesso de Usuários]:** O sistema deve adotar controle de acesso baseado em papéis (RBAC - *Role-Based Access Control*) com autenticação multifator (MFA) para perfis administrativos e de gestão.

### 3.4 Interoperabilidade e Resiliência de Dados
- **RNF-009 [Arquitetura Sem Migração de Bases]:** A solução deve interoperar com as bases de dados municipais e federais existentes por meio de conectores/APIs sem exigir que o município altere seus sistemas legados ou fluxos de trabalho habituais.
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