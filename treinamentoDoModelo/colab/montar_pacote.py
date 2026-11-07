#!/usr/bin/env python3
"""Gera um pacote pequeno de treino e partes do Parquet SINAN para o Drive.

Uso: python treinamentoDoModelo/colab/montar_pacote.py
Não lê o Parquet em memória nem modifica o arquivo original.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import zipfile
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[2]
CODIGO = Path('treinamentoDoModelo')
FONTE = Path('data/sinan/dengue-analitico.parquet')
PREPARADOS = (
    CODIGO / 'artefatos/ouro/atributos.parquet',
    CODIGO / 'artefatos/ouro/schema_atributos.json',
    CODIGO / 'artefatos/ouro/municipios_reservados.json',
)
SCRIPTS = (
    CODIGO / 'executar.py', CODIGO / 'config.yaml', CODIGO / 'requirements.txt',
    CODIGO / 'requirements-colab.txt',
    CODIGO / 'dengue/__init__.py', CODIGO / 'dengue/base.py',
    CODIGO / 'dengue/atributos.py', CODIGO / 'dengue/fontes.py',
    CODIGO / 'dengue/painel.py', CODIGO / 'dengue/treino.py',
    CODIGO / 'dengue/modelos_adicionais.py',
)


def sha256(caminho):
    h = hashlib.sha256()
    with Path(caminho).open('rb') as stream:
        for bloco in iter(lambda: stream.read(2**20), b''):
            h.update(bloco)
    return h.hexdigest()


def montar(destino, tamanho_parte_mib=128):
    destino = Path(destino).resolve()
    fonte = RAIZ / FONTE
    arquivos = SCRIPTS + PREPARADOS
    faltando = [str(p) for p in (FONTE,) + arquivos if not (RAIZ / p).is_file()]
    if faltando:
        raise FileNotFoundError('Arquivos necessários ausentes: ' + ', '.join(faltando))
    destino.mkdir(parents=True, exist_ok=True)
    zip_destino = destino / 'codigo_e_atributos.zip'
    temporario = zip_destino.with_suffix('.zip.part')
    with zipfile.ZipFile(temporario, 'w', compression=zipfile.ZIP_STORED,
                         allowZip64=True) as pacote:
        for relativo in arquivos:
            pacote.write(RAIZ / relativo, arcname=str(relativo))
    os.replace(temporario, zip_destino)

    partes = []
    total = hashlib.sha256()
    limite = tamanho_parte_mib * 2**20
    with fonte.open('rb') as entrada:
        for indice in range((fonte.stat().st_size + limite - 1) // limite):
            nome = f'dengue-analitico.parquet.part{indice + 1:03d}'
            parte = destino / nome
            parcial = parte.with_suffix(parte.suffix + '.part')
            digest = hashlib.sha256()
            restante = limite
            with parcial.open('wb') as saida:
                while restante:
                    bloco = entrada.read(min(2**20, restante))
                    if not bloco:
                        break
                    saida.write(bloco)
                    digest.update(bloco)
                    total.update(bloco)
                    restante -= len(bloco)
            os.replace(parcial, parte)
            partes.append({'arquivo': nome, 'bytes': parte.stat().st_size,
                           'sha256': digest.hexdigest()})
            print(f'Parte {indice + 1}: {nome} ({parte.stat().st_size / 2**20:.1f} MiB)', flush=True)
    manifesto = {
        'versao': 1,
        'codigo': {'arquivo': zip_destino.name, 'bytes': zip_destino.stat().st_size,
                   'sha256': sha256(zip_destino)},
        'dataset': {'destino': str(FONTE), 'bytes': fonte.stat().st_size,
                    'sha256': total.hexdigest(), 'partes': partes},
        'atributos_preparados': [str(p) for p in PREPARADOS],
        'observacao': 'Parquet original completo, dividido byte a byte; atributos prontos permitem apenas treinar no Colab.',
    }
    arquivo_manifesto = destino / 'manifesto.json'
    parcial = arquivo_manifesto.with_suffix('.json.part')
    parcial.write_text(json.dumps(manifesto, indent=2, ensure_ascii=False), encoding='utf-8')
    os.replace(parcial, arquivo_manifesto)
    print(f'Pronto: {destino}\nSHA-256 do Parquet original: {total.hexdigest()}', flush=True)
    return manifesto


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, default=RAIZ / 'treinamentoDoModelo/pacoteColab')
    parser.add_argument('--parte-mib', type=int, default=128)
    args = parser.parse_args()
    if args.parte_mib < 16:
        parser.error('--parte-mib deve ser >= 16')
    montar(args.saida, args.parte_mib)
