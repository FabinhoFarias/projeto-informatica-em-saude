# Treinamento no Google Colab

O pacote mantém **dois conjuntos separados**: o Parquet SINAN completo, dividido em partes de 128 MiB para upload, e `codigo_e_atributos.zip`, com o código mais os atributos preparados localmente. O ZIP não inclui `.venv`, modelos antigos nem downloads temporários. Tudo roda no armazenamento temporário `/content` do Colab, sem montar Google Drive.

No Mac, a partir da raiz do repositório:

```bash
treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/colab/montar_pacote.py
```

Abra [treinamento_dengue_colab.ipynb](../../notebooks/treinamento_dengue_colab.ipynb) no Colab. Na aba **Arquivos** do Colab, envie para `/content`:

1. `manifesto.json` e `codigo_e_atributos.zip` da pasta `treinamentoDoModelo/pacoteColab/`;
2. **uma** destas opções: o arquivo original `data/sinan/dengue-analitico.parquet` inteiro, ou todas as partes `dengue-analitico.parquet.part001` a `.part005` da pasta do pacote.

Se o navegador criar `/content/pacoteColab/` com os arquivos dentro, o notebook detecta essa pasta automaticamente. O Parquet original no Mac não é modificado. Se usar as partes, o notebook as recompõe byte a byte e valida SHA-256; se enviar o Parquet inteiro, valida o arquivo e cria um link simbólico, sem duplicá-lo no disco.

Execute as células na ordem. Elas validam os checksums, deixam o Parquet acessível em `/content/denguinhos/data/sinan/`, corrigem no esquema somente o caminho absoluto que apontava para o Mac, instalam dependências e executam diretamente `treinar`, reutilizando `artefatos/ouro/atributos.parquet`. Não há novos downloads de IBGE, clima ou SINAN nessa etapa.

O notebook usa o Python já disponível no Colab (3.12 ou 3.13) e instala `requirements-colab.txt` incluído no ZIP. Não envie o `.venv` do Mac. Se você já enviou um pacote antigo, execute `montar_pacote.py` novamente e substitua `manifesto.json` e `codigo_e_atributos.zip` no Colab. Python 3.1 literal não é compatível com as bibliotecas atuais; versões futuras do Colab precisam ser verificadas antes de ampliar a faixa suportada.

Antes de treinar, o notebook mostra a quantidade de linhas, os anos, horizontes e candidatos. Durante o treino aparecem o número da etapa, a porcentagem concluída, a fase de cada modelo, o avanço do CatBoost a cada 50 árvores, as métricas ao fechar o candidato e um ETA aproximado. Um aviso a cada 30 segundos indica que modelos sem impressão de iterações ainda estão rodando. O relatório completo também fica em `artefatos/relatorios/pipeline.log` dentro do ZIP final.

O treino atual compara dez candidatos em 2025 para H1/H2, usando CPU; simplesmente selecionar GPU no Colab não ativa aceleração nas bibliotecas. Um runtime com mais RAM pode ajudar a evitar pressão de memória. O Parquet original serve também para o hash de proveniência; o treinamento usa os atributos preparados.

Ao terminar, a última célula cria e oferece para download `/content/resultados_treinamento.zip`, com modelos e relatórios, inclusive artefatos parciais se o treino falhar. **Baixe antes de o runtime desconectar**: arquivos em `/content` se perdem ao encerrar o ambiente. A versão atual não retoma automaticamente um horizonte interrompido: rodar `treinar` de novo cria um experimento novo. Não use 2025 como teste independente, pois ele seleciona o modelo.

### Resultados trazidos do Colab

Guarde cada `resultados_treinamento.zip` em `treinamentoDoModelo/artefatos/importacoes_colab/<id_do_treino>/`. Essa árvore é ignorada pelo Git; não coloque modelos `.joblib`, logs ou arquivos ZIP de resultados no commit. Se descompactar para consulta, use uma subpasta `extraido/` dentro do mesmo diretório. O ZIP contém `modelos/ultimo_treino.json` com o caminho do runtime do Colab: ele **não** deve substituir o `ultimo_treino.json` local. Para comparar resultados, leia `extraido/modelos/<id_do_treino>/resumo.json`, `validacao_h1.json`, `validacao_h2.json` e `model_card.json`.
