#!/usr/bin/env python3
"""F5/Play: prepara o Nordeste e inicia o treinamento com config.yaml.

Sequência recomendada no terminal (a busca não recria fontes nem atributos):

    # 1) Instale as bibliotecas dos candidatos configurados.
    treinamentoDoModelo/.venv/bin/python -m pip install -r treinamentoDoModelo/requirements.txt

    # 2) Compara candidatos em 2025, treinando até 2024.
    treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/executar.py treinar

    # 3) Consulte validacao_h1.json, validacao_h2.json e resumo.json no
    # diretório informado pelo treino. 2025 não é um teste independente.

    # 4) Gera previsões e arquiva os modelos que superaram baselines.
    treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/executar.py inferir
    treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/executar.py arquivar

Para refazer dados/fontes antes de um experimento novo, use somente quando necessário:

    treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/executar.py preparar
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def usar_ambiente_local():
    pasta = Path(__file__).resolve().parent / '.venv'
    python = pasta / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if python.is_file() and Path(sys.prefix).resolve() != pasta.resolve():
        print(f'Usando o ambiente do treinamento: {python}', flush=True)
        os.execv(str(python), [str(python), str(Path(__file__).resolve()), *sys.argv[1:]])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('acao', nargs='?', default='tudo',
                        choices=['tudo', 'fontes', 'painel', 'atributos', 'preparar', 'buscar', 'treinar', 'avaliar', 'inferir', 'arquivar'])
    parser.add_argument('--config', type=Path, default=Path(__file__).with_name('config.yaml'))
    parser.add_argument('--modelos', type=Path, help='Pasta do treino para avaliar/inferir; padrão é ultimo_treino.json.')
    args = parser.parse_args()
    if not (3, 9) <= sys.version_info[:2] <= (3, 13):
        usar_ambiente_local()
        parser.error('Use Python 3.10–3.12 de preferência (suporte 3.9–3.13). Python 3.15 não tem todas as wheels necessárias.')
    try:
        from dengue.base import carregar_config, salvar_json, arquivo, LOG
    except ImportError as erro:
        usar_ambiente_local()
        parser.exit(2, f'Dependência ausente/incompatível: {erro}\nInstale: python -m pip install -r treinamentoDoModelo/requirements.txt\n')
    cfg = carregar_config(args.config)
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s',
                        handlers=[logging.StreamHandler(), logging.FileHandler(arquivo(cfg, 'relatorios', 'pipeline.log'), encoding='utf-8')])
    inicio = datetime.now(timezone.utc).isoformat()
    etapas = {'tudo': ['fontes', 'painel', 'atributos', 'treinar'],
              'preparar': ['fontes', 'painel', 'atributos']}.get(args.acao, [args.acao])
    # Não altera o SINAN original. Downloads e saídas ficam só na pasta configurada.
    for etapa in etapas:
        LOG.info('ETAPA: %s', etapa)
        try:
            if etapa == 'fontes':
                from dengue.fontes import preparar_fontes
                preparar_fontes(cfg)
            elif etapa == 'painel':
                from dengue.painel import construir_painel
                construir_painel(cfg)
            elif etapa == 'atributos':
                from dengue.atributos import construir_atributos
                construir_atributos(cfg)
            elif etapa == 'treinar':
                from dengue.treino import treinar
                treinar(cfg)
            elif etapa == 'buscar':
                from dengue.treino import buscar_hiperparametros
                buscar_hiperparametros(cfg)
            elif etapa == 'avaliar':
                from dengue.treino import avaliar_testes
                avaliar_testes(cfg, args.modelos)
            elif etapa == 'inferir':
                from dengue.treino import inferir
                inferir(cfg, args.modelos)
            elif etapa == 'arquivar':
                from dengue.treino import arquivar_candidatos
                arquivar_candidatos(cfg, args.modelos)
        except Exception:
            LOG.exception('Falha na etapa %s. Corrija a causa e rode esta etapa novamente.', etapa)
            salvar_json(arquivo(cfg, 'relatorios', 'execucao.json'),
                        {'inicio': inicio, 'acao': args.acao, 'falhou': etapa, 'config': cfg})
            raise
    salvar_json(arquivo(cfg, 'relatorios', 'execucao.json'),
                {'inicio': inicio, 'fim': datetime.now(timezone.utc).isoformat(), 'acao': args.acao, 'config': cfg})


if __name__ == '__main__':
    main()
