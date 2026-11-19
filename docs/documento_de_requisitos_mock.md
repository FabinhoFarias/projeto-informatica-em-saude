# Documento de Requisitos do Protótipo Mockado — VIGIA+

**Versão:** 1.0 — cobertura acadêmica em nível de interface

**Data:** 16 de novembro de 2026

**Estado:** roteiro de implementação do MVP demonstrativo com dados exclusivamente fictícios.

## Regra de classificação

Este documento replica os mesmos IDs do [sistema integrado](documento_de_requisitos.md), mas mede outro resultado: a capacidade de **demonstrar visualmente o fluxo** aos professores sem afirmar que existe integração real.

- ✅ **Implementado:** fluxo navegável e verificável na interface com mocks determinísticos.
- 🏗 **Parcial:** existe parte da interface, mas faltam estados, ações ou telas para explicar o requisito.
- ⏳ **Futuro:** ainda não há representação suficiente na interface.
- 🔎 **A verificar:** depende de teste humano ou medição, mesmo no protótipo.

Um item marcado como implementado aqui pode continuar futuro no documento integrado. O mock não comprova banco, API, autenticação, segurança, sincronização, integração pública ou homologação municipal.

<!-- requirements-progress:start -->

![Progresso do protótipo mockado: 62%](https://geps.dev/progress/62)

**Progresso do protótipo mockado:** 62% (40 de 65 requisitos com status Implementado).

| Status          | Quantidade |
| :-------------- | ---------: |
| ✅ Implementado |         40 |
| 🏗 Parcial      |          7 |
| ⏳ Futuro       |         16 |
| 🔎 A verificar  |          2 |
| **Total**       |     **65** |

<!-- requirements-progress:end -->

## 1. ACE — território e operação de campo

### RF-012 — Atribuição de Rota Inteligente

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A visão do ACE apresenta rota e imóveis atribuídos fictícios. Para melhorar a demonstração, falta ligar a aprovação do gestor à rota exibida.

### RF-031 — Meu setor, lista de imóveis e ficha do imóvel

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/visitas` organiza imóveis por quarteirão ou rua, permite busca, mostra situação por ciclo e abre `/visitas/[idImovel]` com contexto do imóvel.

### RF-032 — Consulta de moradores da Atenção Básica com integração inicialmente simulada

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta a seção de moradores fictícios na ficha, incluindo fonte, atualização, vínculo confirmado, ambíguo, indisponível e acesso negado.

### RF-014 — Alertas de Campo

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O painel do ACE exibe alerta territorial fictício e sua origem demonstrativa; não representa entrega de notificação real.

### RF-013 — Registro de Visita e Criadouro

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ficha registra acesso, depósitos, amostra, tratamentos e observações em `sessionStorage`, com dados previamente preenchidos para imóveis visitados.

### RF-020 — Ficha diária digital do ACE

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O formulário reutiliza imóvel, ciclo e endereço e permite salvar a demonstração na sessão do navegador.

### RF-021 — Depósitos, inspeção e tratamento

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A interface contempla A1, A2, B, C, D1, D2, E, imóvel LI, coleta e campos de tratamentos fictícios.

### RF-022 — Imóveis fechados, vazios e recuperação

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ficha apresenta linha temporal com tentativa, recusa/fechado, retorno programado e ação para simular o retorno realizado sem apagar o evento anterior.

### RF-024 — Pontos estratégicos (PE)

**Status:** ✅ **Implementado**

**Evidência e lacunas:** Imóveis classificados como PE exibem última inspeção, próxima inspeção, situação do tratamento e aviso de periodicidade municipal fictícia.

### RF-034 — Evidências fotográficas e anexos de campo

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ficha permite selecionar imagem autorizada, visualizar, remover e simular o estado de envio sem bloquear o formulário principal.

### RF-035 — Contexto de moradores e sinais/sintomas em atividade autorizada

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta fluxo opcional, separado da visita vetorial, com autorização e aviso de dados fictícios.

### RF-036 — Registro de ocorrências e riscos observados

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ficha permite adicionar ocorrência fictícia com categoria, prioridade, descrição e situação visível na própria sessão.

### RNF-004 — Funcionamento Offline do App Móvel

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta demonstrar estados offline, fila local, reconexão e sincronização simulada.

### RNF-005 — Design Responsivo e Ergonômico

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O shell, a navegação móvel, os cards e formulários possuem layouts responsivos; a validação humana pertence ao RNF-015.

### RNF-015 — Usabilidade operacional validada com ACE

**Status:** 🔎 **A verificar**

**Evidência e lacunas:** A interface está disponível para teste, mas falta registrar protocolo, participantes, tarefas, resultados e correções.

### RNF-016 — Sincronização sem perda ou duplicação

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ficha demonstra os estados pendente, enviando, sincronizado, rejeitado e conflito; salvar uma visita retorna o registro ao estado pendente.

### RNF-017 — Dispositivos pessoais e compartilhados

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta demonstrar troca de usuário, limpeza de dados locais e bloqueio de registros de outra pessoa. A política deverá ser definida pelo gestor, que configurará o horário inicial/final, dias autorizados, fuso, vigência e exceções de acesso dos ACEs para reduzir exposição de dados em dispositivos pessoais ou compartilhados.

### RNF-023 — Familiaridade, implantação gradual e adesão do ACE

**Status:** 🔎 **A verificar**

**Evidência e lacunas:** O desenho busca familiaridade com fichas e setores, mas depende de teste com ACE e registro de achados.

## 2. Coordenação, território e produção

### RF-002 — Geocodificação e Tratamento Territorial

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/territorio-conferencia` apresenta endereços, bairros, setores, quarteirões, divergências e ações para validar ou reabrir o cadastro. Os dados permanecem mockados.

### RF-018 — Cadastro territorial e atribuição de área

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/territorio-conferencia` permite atribuir setores/bairros a ACEs, visualizar imóveis previstos e cobertura mockada, além de revisar divergências territoriais. A persistência e a atribuição real de imóveis ainda dependem de backend.

### RF-019 — Planejamento por ciclo e modalidade

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/planejamento` permite criar, editar e publicar um ciclo, definir período, selecionar várias modalidades no mesmo ciclo e criar ações específicas direcionadas a bairros. A atribuição e publicação permanecem mockadas.

### RF-025 — Produção diária, semanal e por ciclo

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A produção diária e os consolidados fictícios são exibidos com filtros de semana, mês, ciclo e semana epidemiológica. Os dados ainda não são persistidos.

### RF-042 — Cobertura de visitas por bairro e setor

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A visão do gestor em `/painel` apresenta cobertura municipal, bairros concluídos, setores acompanhados, imóveis visitados e pendências. A tabela alterna entre bairros e setores, permite busca territorial e mostra imóveis visitados sobre previstos, percentual e pendências de recuperação. Os indicadores são fictícios e permanecem sem integração com o modelo preditivo ou banco real.

### RF-043 — Acompanhamento de cobertura por ACE

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A seção “Acompanhamento dos ACEs” no painel do gestor lista os usuários de campo em cards, com foto, área atribuída, cobertura e sincronização. A rota `/usuarios/ace/[id]` apresenta histórico, faixa de desempenho, meta, ritmo, pendências e atividades habilitadas. A composição permanece fictícia e sem persistência.

### RF-026 — Conferência, fechamento e correção

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** Relatórios permitem conferência visual; falta tela de devolução, motivo, correção e aprovação simulada.

### RF-030 — Consumo de insumos e limite do estoque

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/estoque` mostra produtos, unidade, saldo, mínimo, consumo acumulado e alerta de reposição, com ajuste de saldo para demonstração.

### RF-037 — Cadastro e acompanhamento de depósitos públicos e problemas de saneamento

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/saneamento` lista ocorrências ambientais com endereço, bairro, responsável, prazo, histórico e estados aberto, em tratativa e resolvido. O cadastro e as atualizações são mockados.

### RF-040 — Tarefas, preparação de retornos e acompanhamento da ação

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** Existem decisões e pendências fictícias, mas falta uma caixa de tarefas com responsável, prazo e conclusão.

### RNF-022 — Transparência da qualidade

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A ingestão mostra avisos, registros ignorados e correções; outros módulos ainda podem ampliar origem e atualização.

## 3. Digitação, documentos e encaminhamento

### RF-029 — Papel e operação assistida

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A rota `/digitacao-relatorios` permite ao perfil Digitador/Operador transcrever uma ficha manual, marcar obrigatoriamente a origem `PAPEL`, identificar ficha, ACE, imóvel e responsável pela digitação e confirmar a conferência do documento físico. A persistência ainda é simulada na sessão.

### RF-027 — Relatório de produção para impressão e assinatura

**Status:** ✅ **Implementado**

**Evidência e lacunas:** Há registro diário e resumo de campo/laboratório preenchidos com mocks, visualizados no painel e preparados para impressão A4.

### RF-028 — Encaminhamento e sistemas legados

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta tela de geração, protocolo, destinatário, envio simulado e recibo.

### RF-039 — Consolidados mensais, por ciclo e semana epidemiológica

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A área de relatórios oferece filtros demonstrativos por semana, mês, ciclo bimestral e semana epidemiológica, recalculando visitas, inspeções, pendências, depósitos, amostras, tratamentos e quarteirões diretamente dos registros mockados.

### RNF-018 — Reprodutibilidade documental

**Status:** ✅ **Implementado**

**Evidência e lacunas:** Cada geração consolidada exibe identificador único, versão do template, data/hora no fuso municipal e parâmetros usados no filtro. A persistência imutável desses metadados depende do sistema integrado.

### RNF-013 — Operação Sem Necessidade de TI Local (_No-Code Interface_)

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A interface permite importar e validar arquivos sem editar código; a afirmação vale apenas para a demonstração local.

### RNF-009 — Arquitetura Sem Migração de Bases

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta uma tela conceitual que mostre conectores, origem mantida, atualização e falha sem sugerir migração concluída.

## 4. Levantamento e laboratório

### RF-023 — Levantamento de índices e laboratório

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A rota `/laboratorio`, exclusiva do ACE laboratorista e do administrador, recebe as coletas registradas em campo, preserva o vínculo com visita e imóvel, registra a cadeia coleta–recebimento–análise e permite concluir resultados por espécie, fase, quantidade, método e conclusão. A persistência continua simulada no estado da sessão.

## 5. Gestão, vigilância e inteligência

### RF-008 — Mapa Interativo de Calor/Risco

**Status:** ✅ **Implementado**

**Evidência e lacunas:** `/mapas` oferece camadas fictícias de imóveis e hotspots com interação e adaptação móvel.

### RF-017 — Módulo de Diagnóstico Situacional Automatizado

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A rota de diagnóstico apresenta indicadores, séries e relatório demonstrativo com aviso de simulação.

### RF-009 — Geração de Recomendações de Ação

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A priorização explica motivos e sugere ações com regras fictícias transparentes.

### RF-011 — Simulação e Alocação de Recursos

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A interface permite redistribuir recursos fictícios e visualizar efeitos demonstrativos.

### RF-033 — Programação de recebimento, registro e comunicação das predições

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** Há alertas e projeções fictícias; falta configurar agenda, público, versão e histórico de comunicação.

### RF-010 — Módulo Epidemiológico Avançado

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O diagnóstico apresenta séries, sensibilidade e exportação CSV fictícias suficientes para exposição acadêmica.

### RF-007 — Ajuste de Atraso de Notificação (_Nowcasting_)

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta visualização comparando observado, corrigido por atraso, incerteza e data da atualização.

### RF-005 — Modelagem Preditiva por Bairro

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O painel exibe projeções territoriais fictícias e seus limites; não afirma execução do modelo real.

### RF-006 — Identificação de Hotspots Históricos

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A interface agrega eventos fictícios em grade, alterna foco/posição e aceita CSV demonstrativo.

### RF-016 — Cruzamento Preditivo Territorial - Saúde Única

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O diagnóstico cruza sinais fictícios de vigilância e APS em nível visual, sem integração real.

### RNF-012 — Mitigação de Viés Algorítmico e Falsos Alarmes

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** Existe ajuste visual de sensibilidade; faltam comparações por grupos, falsos alertas e limitações explícitas.

### RNF-014 — Tolerância a Inconsistências de Cadastros

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** A ingestão sinaliza linhas e normaliza localidades; faltam estados de duplicidade, conflito e decisão humana.

## 6. Integrações e dados

### RF-001 — Ingestão Multifonte

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** A interface permite selecionar fontes e importar um arquivo; falta demonstrar consolidação e proveniência simultânea.

### RF-015 — Ingestão Manual via Importação de Planilhas (CSV/XLSX)

**Status:** ✅ **Implementado**

**Evidência e lacunas:** CSV/XLSX são lidos no navegador, validados e apresentados em prévia com avisos.

### RF-003 — Normalização de Nomes e Padrões

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O processador demonstra aproximação e normalização de localidades fictícias.

### RF-004 — Leitura de Dados de Prontuário

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta interface simulada para contrato, permissão, estados de conexão e dados minimizados.

### RF-038 — Encaminhamento intersetorial, protocolo e retorno da tratativa

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta fluxo demonstrativo entre vigilância e setor destinatário com protocolo e retorno.

### RNF-010 — Padronização Técnica de Dados

**Status:** 🏗 **Parcial**

**Evidência e lacunas:** Há validação básica de planilhas; falta catálogo visual de esquema, versão e mapeamento de campos.

### RNF-006 — Proteção por finalidade e fronteira de compartilhamento

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta demonstrar finalidade, minimização, acesso negado e exportação reduzida por perfil.

## 7. Administração e plataforma

### RF-041 — Gestão de clientes/prefeituras, unidades organizacionais e módulos

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A rota administrativa permite selecionar prefeitura, ativar unidades organizacionais e habilitar módulos fictícios de forma independente.

### RNF-008 — Controle de Acesso de Usuários

**Status:** ✅ **Implementado**

**Evidência e lacunas:** O protótipo permite trocar papel, filtra rotas e aplica gates visuais; não representa autenticação ou autorização de API.

### RNF-002 — Arquitetura Multitenant / SaaS

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Ter mocks de municípios diferentes não demonstra isolamento; falta interface explicativa de troca e fronteira de cliente.

### RNF-007 — Criptografia de Dados

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Não é requisito demonstrável apenas por tela; pode receber quadro conceitual sem ser marcado como implementado.

### RNF-019 — Auditoria e segregação

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta interface de trilha de auditoria, filtros, antes/depois e autoria fictícia.

### RNF-020 — Configuração sem bifurcar o produto

**Status:** ✅ **Implementado**

**Evidência e lacunas:** A mesma interface configura marca, parâmetros, módulos, catálogos e territórios de clientes diferentes sem duplicar componentes ou rotas.

### RNF-003 — Escalabilidade de Dados

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Escalabilidade não pode ser comprovada pelo mock; uma tela conceitual não altera o status.

### RNF-011 — Disponibilidade do Serviço

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Disponibilidade exige implantação e monitoramento, não apenas interface.

### RNF-021 — Continuidade e guarda

**Status:** ⏳ **Futuro**

**Evidência e lacunas:** Falta ao menos uma interface administrativa demonstrando backup, restauração e retenção, sem alegar execução real.

## Prioridade para completar a exposição acadêmica

1. Moradores fictícios e estados da integração APS (`RF-032`).
2. Conferência e correção da produção (`RF-026`).
3. Laboratório e vínculo de amostras (`RF-023`).
4. Tarefas, retornos e protocolo intersetorial (`RF-040`, `RF-038`).
5. Telas conceituais de integração, auditoria, configuração e continuidade, sempre identificadas como simulação.

O objetivo deste backlog é completar a narrativa e a navegabilidade do protótipo. Requisitos técnicos que dependem de infraestrutura continuam não implementados no documento integrado, mesmo quando ganham uma tela explicativa aqui.
