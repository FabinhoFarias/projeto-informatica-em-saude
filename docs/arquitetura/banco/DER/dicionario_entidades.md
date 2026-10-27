# Dicionário preliminar de entidades — multiclientes

**Revisão:** 27/10/2026. Tenant = `cliente_id`; prefeitura é a organização cliente, secretaria/departamento/setor são unidades organizacionais. `municipio_id` serve à localização e aos códigos geográficos. As entidades identificadas por `[ref]` nos diagramas são as mesmas definições abaixo.

Todas as tabelas operacionais têm `cliente_id NOT NULL`, mesmo quando herdado do agregado. As exceções globais são `usuario`, `municipio`, `permissao` e `modulo`; `cliente` é a própria raiz do isolamento. `prefeitura` usa a PK do cliente como FK. Papéis e cadastros de pessoas pertencem ao cliente, não são compartilhados globalmente.

FKs de dados operacionais usam o par `(cliente_id, id_referenciado)`; unidade, vínculo de usuário e referências de origem também devem pertencer ao mesmo cliente. Dados de uma unidade não são automaticamente visíveis às outras. Consulte as regras de isolamento e compartilhamento no [guia do banco](README.md).

Os atributos indicam um esboço lógico; catálogos, relações históricas e decisões de acesso exigem refinamento físico antes de migrations. Os requisitos continuam no documento principal.


## Clientes e estrutura organizacional


### `cliente`

```text
id : uuid PK
tipo : PREFEITURA (demais tipos dependem de habilitação)
nome / status / fuso_horario / criado_em
```


### `prefeitura`

```text
cliente_id : uuid PK, FK cliente
municipio_id : uuid FK município (geografia)
nome_oficial / identificador_institucional opcional
UNIQUE(cliente_id); identidade contratual não deriva do código IBGE
```


### `unidade_organizacional`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_pai_id : uuid FK opcional no mesmo cliente
tipo : SECRETARIA / DEPARTAMENTO / SETOR / OUTRA
codigo / nome / status / inicio / fim
UNIQUE(cliente_id, codigo); impedir ciclos de subordinação
```


### `lotacao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
vinculo_usuario_id : uuid FK
unidade_id : uuid FK
inicio / fim / status
vínculo não concede papéis ou acesso automaticamente
```


### `modulo`

```text
id : uuid PK
codigo : text UK global
nome / versao_contrato; catálogo de capacidades técnicas
```


### `cliente_modulo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
modulo_id : uuid FK
status / inicio / fim
UNIQUE(cliente_id, modulo_id, inicio)
```


### `unidade_modulo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
cliente_modulo_id : uuid FK
unidade_id : uuid FK
status / inicio / fim
habilitação na unidade requer módulo habilitado no cliente
```


### `configuracao_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_id : uuid FK opcional; nulo = configuração do cliente
modulo_id : uuid FK
chave / versao / parametros validados / vigencia
autor_id / aprovador_id : FK vínculo do cliente
resolução de configuração por escopo explícita, sem vazamento de unidade
```


### `compartilhamento_autorizado`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_origem_id : uuid FK
unidade_destino_id : uuid FK no mesmo cliente
tipo_recurso / escopo_registros / campos_permitidos / finalidade
aprovador_id : uuid FK vínculo autorizado
inicio / fim / estado / motivo_revogacao
não autoriza outro tenant; acesso técnico não implica acesso clínico
```


## Entidades dos domínios operacionais


### `municipio`

```text
id : uuid PK
codigo_ibge : text UK
nome : text
```


### `usuario`

```text
id : uuid PK
identidade_externa : text UK
nome : text
ativo : boolean
```


### `vinculo_usuario`

```text
id : uuid PK
cliente_id : uuid FK
usuario_id : uuid FK
inicio / fim : timestamptz
UNIQUE(cliente_id, usuario_id, inicio); histórico de participação
status / vinculo_institucional
```


### `papel`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
codigo : text; UNIQUE(cliente_id, codigo)
```


### `concessao_papel`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
vinculo_usuario_id : uuid FK
papel_id : uuid FK
territorio_id : uuid FK opcional
inicio / fim : timestamptz
unidade_id : uuid FK opcional; nulo = escopo cliente autorizado, não acesso irrestrito
finalidade; lotacao ativa ou compartilhamento explícito
```


### `permissao`

```text
id : uuid PK
codigo : text UK
```


### `papel_permissao`

```text
papel_id : uuid PK, FK
cliente_id : uuid FK obrigatório
permissao_id : uuid PK, FK
```


### `territorio`

```text
id : uuid PK
cliente_id : uuid FK
tipo : bairro/distrito/area/quarteirao/lado/localidade; catálogo por cliente
codigo_local : text
municipio_id : uuid FK geográfica; não é chave do tenant
```


### `territorio_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
territorio_id : uuid FK
versao : int
nome / geometria / vigencia
```


### `vinculo_territorial`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
origem_versao_id : uuid FK
destino_versao_id : uuid FK
tipo_relacao / inicio / fim
```


### `imovel`

```text
id : uuid PK
cliente_id : uuid FK
codigo_local : text
origem_cadastro : text
```


### `imovel_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
imovel_id : uuid FK
versao : int
logradouro / numero / complemento
tipo / situacao / zona / vigencia
municipio_id : uuid FK geográfica; unidade de origem quando necessário
```


### `imovel_territorio`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
imovel_versao_id : uuid FK
territorio_versao_id : uuid FK
tipo_vinculo : text
```


### `modalidade_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
codigo / versao / regras_campos
vigencia / periodicidade
```


### `ciclo`

```text
id : uuid PK
cliente_id : uuid FK
periodo_inicio / periodo_fim
regra_calendario_versao
```


### `planejamento`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
ciclo_id : uuid FK opcional
modalidade_versao_id : uuid FK
territorio_id : uuid FK
aprovador_id : uuid FK opcional
status / periodo
```


### `atribuicao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
planejamento_id : uuid FK
responsavel_id : uuid FK
inicio / fim
```


### `item_planejamento`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
planejamento_id : uuid FK
imovel_id : uuid FK
sequencia_percurso : int opcional
selecionado_amostra : boolean opcional
estrato / origem_selecao
```


### `jornada`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
responsavel_id : uuid FK
data_atividade : date
status_entrega : text
```


### `visita`

```text
id : uuid PK gerado offline
cliente_id : uuid FK obrigatório
imovel_id : uuid FK
retorno_de_visita_id : uuid FK opcional
```


### `visita_revisao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_id : uuid FK
revisao : int
imovel_versao_id : uuid FK
jornada_id : uuid FK
item_planejamento_id : uuid FK opcional
modalidade_versao_id : uuid FK
autor_id / digitador_id : uuid FK
data_atividade / lancada_em
acesso / origem / status_conteudo
posicao / origem_posicao / precisao
observacoes / motivo_correcao
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `pendencia_campo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_origem_id : uuid FK
visita_resolucao_id : uuid FK opcional
motivo / estado / prazo
```


### `operacao_sync`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
operation_uuid : uuid
visita_id : uuid FK
vinculo_usuario_id : uuid FK
device_id / base_version
status / recebida_em / resultado
```


### `categoria_deposito_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
codigo : A1/A2/B/C/D1/D2/E
versao / descricao / vigencia
```


### `observacao_deposito`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_revisao_id : uuid FK
categoria_versao_id : uuid FK
modo : individual/quantitativo
referencia_local : text opcional
qtd_encontrados / inspecionados
qtd_positivos / metodo_positividade
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `acao_controle`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_revisao_id : uuid FK
tipo_acao : text
realizada_em : timestamptz
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `alvo_controle`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
acao_id : uuid FK
observacao_id : uuid FK opcional
qtd_alvos / tipo_alvo
```


### `produto_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
codigo / nome / versao
unidade_consumo / vigencia
```


### `carga_produto`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
produto_versao_id : uuid FK
preparada_em / volume_calda / unidade
referencia_lote : text opcional
```


### `aplicacao_produto`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
acao_id : uuid FK
produto_versao_id : uuid FK
carga_id : uuid FK opcional
quantidade_consumida / unidade
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `amostra`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_revisao_id : uuid FK
observacao_id : uuid FK opcional
codigo_fonte / coletor_id : FK
coletada_em / estado
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `recipiente_coleta`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
codigo_local : text opcional
tipo / origem
```


### `amostra_recipiente`

```text
amostra_id : uuid PK, FK
cliente_id : uuid FK obrigatório
recipiente_id : uuid PK, FK
```


### `movimento_amostra`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
amostra_id : uuid FK
estado / ocorrido_em
responsavel_id : uuid FK
motivo : text opcional
```


### `resultado_analise`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
amostra_id : uuid FK
versao / metodo / conclusao
analisado_em / responsavel_id : FK
substitui_resultado_id : uuid FK opcional
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `contagem_especime`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
resultado_id : uuid FK
especie / fase / quantidade
```


### `consolidacao`

```text
id : uuid PK
cliente_id : uuid FK
unidade_responsavel_id : uuid FK obrigatório
tipo : diaria/semanal/mensal/ciclo
periodo / data_corte / filtros
versao / regra_calculo_versao
status / aprovador_id : FK opcional
```


### `item_consolidacao`

```text
consolidacao_id : uuid PK, FK
cliente_id : uuid FK obrigatório
visita_id : uuid PK, FK
visita_revisao_id : uuid FK
```


### `indicador_consolidado`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
consolidacao_id : uuid FK
metrica / dimensoes / unidade
valor / qualidade
```


### `evento_conferencia`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
consolidacao_id : uuid FK
autor_id : uuid FK
tipo / motivo / ocorrido_em
```


### `documento_emitido`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
consolidacao_id : uuid FK
modelo_versao / versao
object_key / checksum / emitido_em
assinatura_estado
```


### `envio_documento`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
documento_id : uuid FK
destino / protocolo
status / enviado_em / resposta
```


### `decisao_gerencial`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
autor_id : uuid FK
consolidacao_id : uuid FK opcional
previsao_id : uuid FK opcional
orientacao / registrada_em
```


### `ocorrencia`

```text
id : uuid PK
cliente_id : uuid FK
unidade_responsavel_id : uuid FK obrigatório
visita_revisao_id : uuid FK opcional
tipo / descricao / sigilo
local / geometria opcional
autor_id : uuid FK
status / registrada_em
```


### `tarefa`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
decisao_id : uuid FK opcional
ocorrencia_id : uuid FK opcional
visita_origem_id : uuid FK opcional
atribuicao_id : uuid FK
modalidade / prazo / recursos
prioridade / estado
```


### `evento_tarefa`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
tarefa_id : uuid FK
autor_id : uuid FK
tipo / ocorrido_em / motivo
visita_executada_id : uuid FK opcional
```


### `encaminhamento_ocorrencia`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
ocorrencia_id : uuid FK
unidade_destino_id : uuid FK opcional; destino interno
contrato_dados_versao / protocolo
status / enviado_em
orgao_externo_destino / contrato; não criar secretaria em outro cliente para simular um destinatário externo
```


### `evento_tratativa`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
encaminhamento_id : uuid FK
autor_id : uuid FK
estado / motivo / ocorrido_em
```


### `anexo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
visita_revisao_id : uuid FK opcional
ocorrencia_id : uuid FK opcional
object_key / checksum / tipo_mime
autor_id : uuid FK
origem / finalidade / estado_envio
original_id : uuid FK opcional
```


### `fonte_dados`

```text
id : uuid PK
cliente_id : uuid FK
unidade_responsavel_id : uuid FK obrigatório
nome / sistema / contrato_versao
finalidade / campos_autorizados
```


### `lote_ingestao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
fonte_id : uuid FK
checksum / competencia / schema_versao
status / recebido_em / qualidade
```


### `mapeamento_externo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
fonte_id : uuid FK
imovel_id : uuid FK opcional
territorio_id : uuid FK opcional
codigo_externo / vigencia
```


### `pessoa`

```text
id : uuid PK
cliente_id : uuid FK
nome / identificadores_restritos
```


### `pessoa_fonte`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
pessoa_id : uuid FK
fonte_id : uuid FK
registro_externo / atualizado_em
```


### `vinculo_residencia`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
pessoa_id : uuid FK
imovel_id : uuid FK
fonte_id : uuid FK
inicio / fim / estado_correspondencia
confirmado_por_id : uuid FK opcional
```


### `registro_saude`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
lote_id : uuid FK
pessoa_id : uuid FK opcional
codigo_externo / agravo / tipo_evento
data_evento / territorio_id : FK opcional
versao / dados_autorizados
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `dataset_versao`

```text
id : uuid PK
cliente_id : uuid FK
unidade_responsavel_id : uuid FK obrigatório
esquema_features_versao / checksum
periodo / regras_transformacao
object_key / criado_em
```


### `dataset_lote`

```text
dataset_id : uuid PK, FK
cliente_id : uuid FK obrigatório
lote_id : uuid PK, FK
```


### `modelo_versao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
dataset_treino_id : uuid FK
algoritmo / versao / metricas
object_key / aprovado_por_id : FK opcional
status / aprovado_em
```


### `execucao_modelo`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
modelo_versao_id : uuid FK
dataset_id : uuid FK
tipo : inferencia/calibracao/validacao
status / iniciado_em / concluido_em
```


### `previsao_territorial`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
execucao_id : uuid FK
territorio_versao_id : uuid FK
agravo / semana_alvo / horizonte
probabilidade / casos_estimados
limite_inferior / limite_superior
qualidade / publicada_em
unidade_responsavel_id : uuid FK obrigatório, coerente com agregado de origem
```


### `cenario_simulacao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
autor_id : uuid FK
execucao_base_id : uuid FK
recursos / politica_versao
resultado / criado_em
```


### `politica_visibilidade`

```text
id : uuid PK
cliente_id : uuid FK
unidade_responsavel_id : uuid FK obrigatório
territorio_id : uuid FK opcional
modo : restrito/compartilhado
versao / inicio / fim
responsavel_id : uuid FK
```


### `publico_autorizado`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
politica_id : uuid FK
vinculo_usuario_id : uuid FK
```


### `agenda_predicao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
unidade_responsavel_id : uuid FK obrigatório
responsavel_id : uuid FK
politica_id : uuid FK
territorio_id : uuid FK opcional
fuso / dias_semana / ativa
```


### `horario_agenda`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
agenda_id : uuid FK
hora_local : time
```


### `destinatario_agenda`

```text
agenda_id : uuid PK, FK
cliente_id : uuid FK obrigatório
vinculo_usuario_id : uuid PK, FK
```


### `entrega_predicao`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
horario_agenda_id : uuid FK
destinatario_id : uuid FK
politica_id : uuid FK
previsao_id : uuid FK opcional
prevista_para / disponibilizada_em
lida_em / status / erro
```


### `comunicacao_equipe`

```text
id : uuid PK
cliente_id : uuid FK obrigatório
decisao_id : uuid FK
entrega_id : uuid FK opcional
autor_id : uuid FK
mensagem / enviada_em
```


### `destinatario_comunicacao`

```text
comunicacao_id : uuid PK, FK
cliente_id : uuid FK obrigatório
vinculo_usuario_id : uuid PK, FK
disponibilizada_em / lida_em
```
