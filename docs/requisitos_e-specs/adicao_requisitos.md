# Adição Organizada de Requisitos e Principais Características

Este documento registra, de forma organizada, a adição dos requisitos e características abaixo ao
**documento de requisitos principal** (`docs/documento_de_requisitos.md`), mantendo a numeração
consistente com os requisitos já existentes e preservando o padrão da documentação.

---

## 1. Ingestão e Integração de Dados

### 1.1 Ingestão e Cruzamento de Dados Locais (Atualização com base em validação de usuário)

* **RF13 - Importação de Planilhas Locais (CSV/XLSX):** O sistema deve permitir upload direto de
  relatórios exportados do PEC (e-SUS APS) e SINAN para secretarias sem integração via API.

* **RF14 - Painel Unificado de Saúde Única:** O sistema deve cruzar automaticamente os dados de
  atendimento da Atenção Primária com as notificações da Vigilância Epidemiológica por bairro/
  microárea.

* **RF15 - Diagnóstico Situacional do Território:** O sistema deve gerar relatórios automáticos de
  priorização de áreas críticas, com gráficos de tendências, para auxiliar a tomada de decisão da
  gestão.

## 2. Usabilidade e Operação

### 2.1 Usabilidade e Operação

* **RNF08 - Operação Sem Necessidade de TI Local:** A interface deve ser autoexplicativa e pronta
  para uso por gestores de saúde, sem exigir conhecimento de programação ou análise avançada de
  dados.
