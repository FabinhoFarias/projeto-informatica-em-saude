#!/usr/bin/env python3
"""Análise exata da base inteira; implementação comum ao notebook Colab."""
import argparse
from pathlib import Path
from sinan_analise_completa import AnaliseSinan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('arquivo', type=Path, help='CSV completo ou Parquet analítico, com --abrir-parquet.')
    parser.add_argument('--pasta-analise', type=Path)
    parser.add_argument('--abrir-parquet', action='store_true', help='Abre explicitamente um Parquet já preparado.')
    parser.add_argument('--memoria', default='3GB')
    parser.add_argument('--threads', type=int)
    parser.add_argument('--municipio', help='Código municipal de residência de seis ou sete dígitos.')
    parser.add_argument('--correlacoes', help='Indicadores 1=sim/2=não, separados por vírgula; operação sobre todos os registros.')
    parser.add_argument('--duplicatas-exatas', action='store_true', help='Habilita a comparação pesada de todos os campos.')
    args = parser.parse_args()
    pasta = args.pasta_analise or args.arquivo.parent/'analise'
    analise = AnaliseSinan(pasta, memoria=args.memoria, threads=args.threads)
    try:
        if args.abrir_parquet:
            analise.abrir_parquet(args.arquivo)
        else:
            analise.preparar_csv(args.arquivo)
        print(f'BASE COMPLETA: {analise.total:,} registros')
        print('\nPOR ANO\n', analise.por_ano().to_string(index=False))
        print('\nREGIÕES\n', analise.regioes().to_string(index=False))
        print('\nAUSÊNCIAS\n', analise.ausencias().to_string(index=False))
        print('\nQUALIDADE DAS DATAS\n', analise.qualidade_datas().to_string(index=False))
        if args.municipio:
            print('\nMUNICÍPIO\n', analise.municipio(args.municipio).to_string(index=False))
        if args.correlacoes:
            campos = [c.strip() for c in args.correlacoes.split(',') if c.strip()]
            corr, validos = analise.correlacoes(campos)
            print('\nCORRELAÇÕES\n', corr)
            print('\nOBSERVAÇÕES VÁLIDAS\n', validos)
        if args.duplicatas_exatas:
            print('\nDUPLICATAS EXATAS\n', analise.duplicatas_exatas().to_string(index=False))
    finally:
        analise.fechar()


if __name__ == '__main__':
    main()
