# Análise de concorrentes e posicionamento do Denguinhos

**Data da pesquisa:** 7 de novembro de 2026<br>
**Escopo:** soluções brasileiras de vigilância de arboviroses, previsão, geointeligência e trabalho dos agentes de combate às endemias (ACE).<br>
**Método:** páginas públicas dos próprios fornecedores e de órgãos responsáveis. Uma função anunciada não comprova implantação, desempenho, preço ou integração efetiva. A ausência de informação pública também não comprova que a função inexista.

## 1. Onde o Denguinhos está hoje

O [documento de requisitos](documento_de_requisitos.md) define uma plataforma municipal com previsões, mapas, planejamento, registro de visitas, conferência da produção e integração com fontes locais. Ele classifica a maior parte dos requisitos como futura ou parcial; portanto, essa é **a proposta de produto**, não uma lista de funções prontas. O [pipeline de treinamento](../treinamentoDoModelo/README.md) já prepara dados e compara modelos para previsão municipal em H1/H2. Os resultados de 2025 são usados na seleção e ainda não constituem teste independente. `casos > 0` é ocorrência, não um surto definido pela vigilância. A previsão por bairro exige dados intramunicipais e validação local, conforme o [plano do Nordeste](modelagem/modeloPreditivoDengueNordeste.md).

## 2. Mapa competitivo

| Solução | Proposta pública verificada | Força para o comprador | Limite da comparação e implicação para o Denguinhos |
|---|---|---|---|
| [IMG / ArcGIS](https://www.img.com.br/pt-br/industrias/governo-municipal-e-estadual/solucoes/arcgis-monitoramento-e-controle-de-dengue-e-aedes-aegypti-com-geointeligencia) | Mapas de focos, hotspots, painéis, planejamento e registro de ações de campo; menciona mapeamento preditivo. | Plataforma geoespacial e oferta de capacitação e suporte. | A página não traz métricas comparáveis de previsão. Competir apenas em mapas seria difícil; integrar previsões e decisões ao GIS já adotado pode ser melhor. |
| [Denvx](https://denvx.com.br/) | Aplicativo de visitas, georreferenciamento, uso offline, produtividade e relatórios para o SisPNCD. | Resolve rotinas cotidianas dos ACE e supervisores. | Tempo economizado e aprovação divulgados são alegações do fornecedor, sem auditoria nesta pesquisa. O Denguinhos precisa provar ganho na rotina, inclusive conferência e exportação, antes de alegar vantagem operacional. |
| [Sentinella Map](https://sentinellamap.com.br/) | Drones e análise de imagens para focos potenciais, mapa, denúncias, prazos de atendimento e app de vistoria offline. | Liga detecção física a tarefa de campo e acompanhamento. | Detecção de foco em imagem não equivale a previsão de casos humanos. A proposta do Denguinhos pode incorporar evidência de campo sem depender de frota de drones. |
| [Vigilia Cerrado](https://vigiliacerrado.com.br/projetos/vigilia-cerrado/index.php) | Anuncia previsão de arboviroses por bairro com até quatro semanas, integração clínica/climática e explicação por SHAP. | Concorrente próximo da tese de previsão local explicável. | Acurácia e antecedência publicadas são declarações do fornecedor; não foram encontradas aqui definições de alvo, prevalência, calibração e teste cego comparáveis. Não vender “previsão por bairro” como diferencial exclusivo. |
| [Ecovec / M.I.Aedes](https://ecovec.com/m-i-aedes-monitoramento-integrado-do-aedes/) | Captura semanal de mosquitos, índice de infestação e análise laboratorial da circulação viral. | Dado entomológico próprio, que a base pública de casos não substitui. | A oferta depende de coleta e laboratório; pode ser fonte parceira para o Denguinhos, mediante acordo e teste de ganho preditivo. Casos evitados e retorno financeiro publicados são alegações do fornecedor. |
| [InfoDengue](https://info.dengue.mat.br/informacoes/) | Alerta precoce de transmissão em todos os municípios, correção de atraso de notificação, relatórios e código aberto. | Cobertura nacional, lastro científico e acesso público. | É referência e baseline obrigatório, não uma lacuna de mercado em alertas municipais. O Denguinhos precisa agregar rotina de decisão e dados locais, além de demonstrar ganho sobre esse serviço. |
| [e-Visit@ / SES-MS](https://www.saude.ms.gov.br/programas-e-projetos/e-visit/) | Registro eletrônico de visitas ACE, imóveis, focos, fotos e tratamento. | Referência pública de operação de campo já usada por municípios. | Em regiões com solução pública implantada, substituir o app pode ser desnecessário. Priorizar integração e complementaridade onde houver acesso autorizado. |
| [Observatório de Arboviroses / Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/svsa/cnie/observatorio-de-arboviroses) | Painéis atualizados diariamente, relatórios semanais e apoio à detecção de tendências e cenários de risco. | Fonte oficial de acompanhamento e comunicação. | Painel nacional não resolve sozinho a execução e avaliação das ações de uma prefeitura, mas torna difícil cobrar apenas por visualização de casos. |

**Leitura de mercado:** essas soluções cobrem, em conjunto, quase todas as palavras de uma apresentação genérica: “IA”, “mapa”, “alerta”, “offline” e “gestão”. Nenhuma dessas palavras isolada sustenta diferenciação. A lacuna comercial a testar é a conexão mensurável entre **previsão municipal confiável → decisão aprovada → tarefa executada → resultado acompanhado**, adaptada ao fluxo real de cada prefeitura. Isso é uma hipótese estratégica, não uma exclusividade demonstrada.

## 3. Estratégia de diferenciação

### 3.1 Vender uma decisão auditável, não um painel novo

Cada alerta deve informar território, semana de emissão, horizonte, definição do evento, probabilidade calibrada, intervalo ou faixa de incerteza, qualidade dos dados, motivo resumido e ação sugerida conforme protocolo aprovado pela prefeitura. A coordenação decide e registra aceite, rejeição, responsável, prazo e desfecho. O histórico preserva a previsão original para comparar o que se sabia **na data da decisão**. Isso conecta a ciência de dados à prestação de contas sem prometer causalidade ou substituir a autoridade sanitária.

### 3.2 Começar com município e habilitar bairro mediante evidência

O modelo regional usa dados públicos no nível município × semana. Para uma prefeitura contratante, comparar o modelo regional com calibração local; somente oferecer bairro/distrito após obter endereço ou território de residência confiável, cobertura suficiente, regras de acesso e validação prospectiva. Não inferir risco de quarteirão a partir de média municipal nem expor casos identificáveis em mapas públicos.

### 3.3 Medir valor contra alternativas gratuitas e simples

No piloto, comparar Denguinhos com persistência, sazonalidade, médias móveis e InfoDengue quando o alvo/horizonte permitir comparação justa. Medir sensibilidade de **surto definido previamente com epidemiologistas**, antecedência útil, falsos alertas por município e mês, calibração, desempenho por porte de cidade e tempo para transformar alerta em ação. Medir também tempo de registro e conferência das visitas, retrabalho e pendências resolvidas. Não chamar `casos > 0` de surto.

### 3.4 Ser compatível com a operação existente

Mapear fichas, setores, quarteirões, ciclos e aprovações antes de desenhar telas. Oferecer importação/exportação documentada e trilha de autoria; testar integração com os sistemas que a prefeitura já usa. O [e-Visit@](https://www.saude.ms.gov.br/programas-e-projetos/e-visit/) e o [ArcGIS](https://www.img.com.br/pt-br/industrias/governo-municipal-e-estadual/solucoes/arcgis-monitoramento-e-controle-de-dengue-e-aedes-aegypti-com-geointeligencia) podem ser alternativas, referências ou canais de integração conforme o município. Não prometer escrita direta em banco fechado nem interoperabilidade sem especificação e autorização do operador.

### 3.5 Tornar a avaliação epidemiológica uma característica do produto

Versionar definições de caso, fonte, atraso de notificação, dados ausentes, corte temporal, mapa territorial, modelo e limiar de alerta. Separar treino, calibração, seleção e teste independente; reavaliar após mudanças no SINAN ou na prática local. Publicar uma ficha compreensível para o gestor e uma ficha técnica para o epidemiologista. Exibir quando a baixa qualidade dos dados suspende um alerta. Explicação de atributos não prova causalidade.

### 3.6 Modelo comercial modular

Uma entrada plausível é **piloto de inteligência municipal** com dados públicos e relatório de validação; depois, módulos de operação ACE e integração local conforme a dor comprovada. Implantação, treinamento e suporte precisam ter preço e critérios de aceite separados da assinatura, conforme a [proposta de negócio](possiveis_modelos_de_negocios.md). Não assumir que um município pagará por previsão se o serviço gratuito e os baselines entregarem utilidade semelhante.

## 4. Prioridades de execução

| Ordem | Entrega verificável | Critério de decisão |
|---|---|---|
| 1 | Definição municipal de surto, limiar e protocolo de ação assinados pela vigilância. | Alvo e consequência de falsos alertas aprovados antes do treino. |
| 2 | Backtest temporal independente e comparação com baselines e InfoDengue, com alvo equivalente. | Ganho útil por município, não somente métrica agregada. |
| 3 | Piloto prospectivo com previsões congeladas antes da semana prevista. | Antecedência, sensibilidade, falsos alertas e calibração medidos em operação. |
| 4 | Fluxo mínimo de alerta → decisão → tarefa → resultado, com trilha de auditoria. | Equipe consegue agir e demonstrar o que fez sem redigitação excessiva. |
| 5 | Integração autorizada com sistema de visitas e dados locais; modelo intramunicipal apenas se a qualidade permitir. | Cobertura territorial, privacidade, utilidade e custo de implantação aprovados. |

**Mensagem de posicionamento a testar com prefeituras:** “O Denguinhos ajuda a vigilância a decidir onde e quando agir, registra a decisão e mede se o alerta foi útil para aquela cidade.” Essa mensagem só deve virar promessa comercial de desempenho depois do piloto.

## 5. Perguntas para demonstrações comerciais e diligência

1. Qual é exatamente o evento previsto: qualquer caso, incidência alta, aumento anormal ou infestação vetorial?
2. Qual horizonte, unidade territorial e data de disponibilidade real de cada entrada?
3. Existe teste prospectivo ou retrospectivo sem vazamento temporal, com sensibilidade, precisão e falsos alertas por cidade?
4. O produto funciona offline, preserva autoria e exporta dados no formato exigido pela prefeitura?
5. Como lida com atraso de notificação, revisão do SINAN e bairros com poucos casos?
6. Quais custos de implantação, licenças, coleta de dados, suporte e saída contratual?
7. O gestor consegue rastrear do alerta à ação concluída e verificar o impacto sem atribuir causalidade indevida?

## 6. Limites desta pesquisa

As fontes acima são páginas públicas consultadas em 7/11/2026. Não houve demonstração com fornecedores, revisão contratual, auditoria de métricas nem entrevista com clientes. Páginas comerciais podem mudar. Validar especialmente preços, cobertura, integrações e resultados em diligência antes de usar esta análise em proposta comercial.
