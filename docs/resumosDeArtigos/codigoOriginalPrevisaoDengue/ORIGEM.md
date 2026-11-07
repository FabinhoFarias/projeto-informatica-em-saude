# Origem do código

## Identificação

- Artigo: *Predicting Dengue Outbreaks with Explainable Machine Learning*
- Autores: Robson Aleixo, Fabio Kon, Rudi Rocha, Marcela Santos Camargo e Raphael Y. de Camargo
- DOI: <https://doi.org/10.1109/CCGrid54584.2022.00114>
- Repositório: <https://gitlab.com/interscity/health/dengue-prediction>
- Branch consultada: `master`
- Commit copiado: `5c437a84333d3e872098d2d11f101540513b2f01`
- Data do commit: 20 de janeiro de 2023
- Data da cópia: 5 de novembro de 2026

## Escopo da cópia

Foram copiados os oito arquivos Python, o notebook SHAP, o `README` e o arquivo de dependências do repositório original. Os dados intermediários, figuras e arquivos territoriais não foram duplicados porque ocupam centenas de megabytes e continuam disponíveis na origem.

| Arquivo | Função observada |
|---|---|
| `main.py` | Orquestra previsões, avaliações, gráficos e SHAP. |
| `mlMethods.py` | Implementa CatBoost e outros regressores experimentais. |
| `mlSupportMethods.py` | Prepara treino/teste e executa previsão recursiva. |
| `neighbors_methods.py` | Calcula atributos dos bairros vizinhos. |
| `measuringResults.py` | Validação, busca de hiperparâmetros e SHAP. |
| `regression_metrics.py` | Métricas de regressão por período e território. |
| `apply_grid_search_sarima.py` | Busca de hiperparâmetros SARIMA. |
| `data_transformation/indaiatuba_data_transformation.py` | Esboço incompleto de adaptação para Indaiatuba. |
| `Shap_value_force_plot.ipynb` | Visualização de explicações SHAP. |
| `requirements-original.txt` | Ambiente original com 428 dependências fixadas. |

## Integridade

Os hashes abaixo permitem conferir que os artefatos permanecem iguais aos arquivos consultados no commit informado.

```text
bb504aa031523d713db3365ab93ea8f573dbfa208e65326c10f92d24771735a4  apply_grid_search_sarima.py
35bb670393c03664d02c2bb7a852853ba4528f6cd195a3ecac21c7ae0cd0994a  main.py
daa136f249a30f9ae6583f0464048e49c76f5c1050d9a84082a6e4c524b64fe1  measuringResults.py
4a66453acb2f61c7a9b0d917d0a1592de72be0a951af9caefa3c1869dbc9d7fa  mlMethods.py
b10aa6c5d6630cf71dedc08b740fec25a06bcb32ddc1686b4f7fc7ec00eaa97a  mlSupportMethods.py
790d8231aa59516bb3ba28c1aae6dce98e607c2c3db436bb58c3be3833ea64c1  neighbors_methods.py
e32757b5adc26a368c52ac18273b522900ff9d8c31b29f6c43a51b9df7a957fb  regression_metrics.py
e45fe620f3ae6e0e27f954f9aabb3330b3cfefe393a8b6e2ddaf6b570a84ec8c  data_transformation/indaiatuba_data_transformation.py
454668c4e8d9862f5bf788d0dd324e742a06db16a9f48721e1d03cf518831312  Shap_value_force_plot.ipynb
b7feecab000b522246f4f8fc1cf6c17903d1a3685f9414b3f902fc2d975d1d5a  requirements-original.txt
6fa2db38166e861987a8c02b16c32b031b91a677842b49ce2182c1ee8e34f9a6  README-original.md
```

## Aviso de licença e execução

Não foi encontrada licença de software explícita no repositório original. A disponibilidade pública do código não concede automaticamente autorização para incorporar ou redistribuir trechos substanciais no produto. Esta cópia é uma referência de auditoria; antes de reutilizar código, deve-se obter licença ou autorização dos autores.

Os arquivos copiados ficam no ambiente local, mas são ignorados pelo Git deste projeto. O commit guarda somente este registro de origem. Para consultar o código em outro computador, acesse o repositório e o commit indicados acima.

O snapshot também não deve ser executado como pipeline de produção. `main.py` contém marcadores de conflito do Git e não compila no estado publicado. O restante do projeto depende de Python 3.6, bibliotecas antigas e arquivos de dados específicos do Rio de Janeiro. A análise detalhada está em [analiseComparativaArtigoPrevisaoDengue.md](../analiseComparativaArtigoPrevisaoDengue.md).
