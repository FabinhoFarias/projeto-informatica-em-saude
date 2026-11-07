#!/usr/bin/env python3
"""Baixa dengue de 2000 a 2026 com 20 threads e checkpoints por ano."""
import argparse
import csv
from collections import deque
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ENDPOINT = "https://apidadosabertos.saude.gov.br/arboviroses/dengue"
PAGE_SIZE = 1000
DICTIONARY = Path(__file__).parent / "sinan/campos-dicionario.json"
DEFAULT_DIRECTORY = Path(__file__).resolve().parents[1] / "data/sinan"
# O PDF escreve clinic_chik; a API publica clinc_chik. Não duplicar o valor bruto.
ALIASES = {"clinic_chik": "clinc_chik"}


def page_url(page, config):
    query = {"limit": PAGE_SIZE, "offset": page}
    if config["ano"]:
        query["nu_ano"] = config["ano"]
    if config["municipio"]:
        query["id_municip"] = config["municipio"]
    return ENDPOINT + "?" + urlencode(query)


def fetch(url, attempts=6):
    for attempt in range(attempts):
        try:
            with urlopen(Request(url, headers={"Accept": "application/json"}), timeout=120) as response:
                payload = json.load(response)
            rows = payload.get("dengue") if isinstance(payload, dict) else None
            if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
                raise ValueError("Resposta inesperada: esperado objeto com lista 'dengue'.")
            return rows
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            if isinstance(error, HTTPError) and error.code not in (408, 429, 500, 502, 503, 504):
                raise
            if attempt == attempts - 1:
                raise
            delay = min(60, 2 ** attempt)
            if isinstance(error, HTTPError):
                retry = error.headers.get("Retry-After", "")
                if retry.isdigit():
                    delay = max(delay, int(retry))
            print(f"Falha temporária; tentativa {attempt + 2}/{attempts} em {delay}s: {error}", file=sys.stderr)
            time.sleep(delay)


def fetch_batch(url):
    started = time.monotonic()
    rows = fetch(url)
    return rows, time.monotonic() - started


def export(db, output, config):
    expected = json.loads(DICTIONARY.read_text())
    actual = [row[0] for row in db.execute("SELECT name FROM fields ORDER BY position")]
    columns = list(dict.fromkeys(expected + actual))
    temporary = output.with_suffix(output.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        for (body,) in db.execute("SELECT body FROM records ORDER BY page, position"):
            writer.writerow(json.loads(body))
    os.replace(temporary, output)
    missing = [field for field in expected if field not in actual]
    state = dict(db.execute("SELECT key,value FROM state"))
    manifest = {
        **config, "registros": db.execute("SELECT count(*) FROM records").fetchone()[0],
        "proxima_pagina": int(state.get("next_page", "0")),
        "concluido": state.get("complete") == "1", "colunas": columns,
        "campos_dicionario_ausentes_na_api": missing,
        "equivalencias_de_nome": {key: value for key, value in ALIASES.items() if value in actual},
        "observacao": "Campos ausentes ficam vazios; valores originais, inclusive 'nan', são preservados. A API não documenta snapshot ou ordenação estável.",
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"CSV: {output} | registros: {manifest['registros']} | concluído: {manifest['concluido']}", flush=True)


def open_checkpoint(output, config):
    output.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(output.with_suffix(".sqlite3"))
    db.executescript("""
        CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS records (page INTEGER, position INTEGER, body TEXT, PRIMARY KEY(page,position));
        CREATE TABLE IF NOT EXISTS fields (name TEXT PRIMARY KEY, position INTEGER);
        CREATE TABLE IF NOT EXISTS pages (page INTEGER PRIMARY KEY, digest TEXT UNIQUE);
    """)
    state = dict(db.execute("SELECT key,value FROM state"))
    if "config" in state and json.loads(state["config"]) != config:
        db.close()
        raise ValueError(f"Filtros diferentes do checkpoint: {output}. Use outro destino.")
    with db:
        db.execute("INSERT OR IGNORE INTO state VALUES ('config',?)", (json.dumps(config),))
    return {
        "db": db, "output": output, "config": config,
        "page": int(state.get("next_page", "0")),
        "complete": state.get("complete") == "1",
        "records": db.execute("SELECT count(*) FROM records").fetchone()[0],
        "dirty": False,
    }


def save_page(job, rows):
    """Somente a thread principal escreve; página e checkpoint são atômicos."""
    db, page = job["db"], job["page"]
    if len(rows) > PAGE_SIZE:
        raise ValueError("A API excedeu o limite solicitado.")
    if any(str(row.get("nu_ano")) != job["config"]["ano"] for row in rows):
        raise ValueError(f"API retornou registros de outro ano para {job['config']['ano']}.")
    bodies = [json.dumps(row, ensure_ascii=False) for row in rows]
    digest = hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest()
    if rows and db.execute("SELECT 1 FROM pages WHERE digest=?", (digest,)).fetchone():
        raise ValueError(f"Página repetida pela API no ano {job['config']['ano']}; coleta desse ano interrompida.")
    with db:
        if rows:
            db.execute("INSERT INTO pages VALUES (?,?)", (page, digest))
        for field in dict.fromkeys(field for row in rows for field in row):
            db.execute("INSERT OR IGNORE INTO fields VALUES (?, (SELECT count(*) FROM fields))", (field,))
        db.executemany("INSERT INTO records VALUES (?,?,?)", ((page, index, body) for index, body in enumerate(bodies)))
        db.execute("INSERT OR REPLACE INTO state VALUES ('next_page',?)", (str(page + 1),))
        if not rows:
            db.execute("INSERT OR REPLACE INTO state VALUES ('complete','1')")
    job["page"] += 1
    job["records"] += len(rows)
    job["complete"] = not rows
    job["dirty"] = True


def download(jobs, workers=40, max_pages=None):
    # Uma requisição pendente por ano. Até 20 anos avançam simultaneamente,
    # sem saltar páginas, acumular respostas ou compartilhar conexão SQLite.
    ready = deque(job for job in jobs if not job["complete"])
    pending = {}
    errors = []
    submitted = 0
    started = time.monotonic()
    received = 0
    pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="sinan")
    try:
        while ready or pending:
            while ready and len(pending) < workers and (max_pages is None or submitted < max_pages):
                job = ready.popleft()
                future = pool.submit(fetch_batch, page_url(job["page"], job["config"]))
                pending[future] = job
                submitted += 1
            if not pending:
                break
            done, _ = wait(pending, return_when=FIRST_COMPLETED)
            for future in done:
                job = pending.pop(future)
                try:
                    rows, request_seconds = future.result()
                    save_page(job, rows)
                except Exception as error:
                    message = f"Ano {job['config']['ano']}, página {job['page']}: {error}"
                    errors.append(message)
                    print(f"Falha: {message}. O checkpoint foi preservado.", file=sys.stderr, flush=True)
                    continue
                received += len(rows)
                total = sum(item["records"] for item in jobs)
                complete = sum(item["complete"] for item in jobs)
                rate = received / max(0.001, time.monotonic() - started)
                print(f"Ano {job['config']['ano']} | página {job['page'] - 1} | recebidos: {len(rows)}/{PAGE_SIZE} "
                      f"em {request_seconds:.1f}s | "
                      f"salvos: {total:,} | anos concluídos: {complete}/{len(jobs)} | {rate:.0f} registros/s", flush=True)
                if job["complete"]:
                    export(job["db"], job["output"], job["config"])
                    job["dirty"] = False
                else:
                    ready.append(job)
    finally:
        # Pedidos em andamento podem terminar, mas não escrevem por conta própria.
        # Respostas não confirmadas serão solicitadas novamente na retomada.
        for future in pending:
            future.cancel()
        pool.shutdown(wait=True)
    if errors:
        raise ValueError(f"{len(errors)} ano(s) falharam. Execute novamente para retomar as páginas pendentes.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ano", type=int, help="Baixa somente este ano.")
    parser.add_argument("--ano-inicial", type=int, default=2000)
    parser.add_argument("--ano-final", type=int, default=2026)
    parser.add_argument("--threads", type=int, default=20)
    parser.add_argument("--municipio", help="Código do município notificador.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_DIRECTORY)
    parser.add_argument("--output", type=Path, help="CSV específico; exige --ano. Permite retomar checkpoint antigo.")
    parser.add_argument("--max-pages", type=int, help="Máximo de requisições nesta execução, somadas entre os anos.")
    parser.add_argument("--export-only", action="store_true", help="Exporta os checkpoints sem consultar a API.")
    parser.add_argument("--skip-count", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.threads < 1 or (args.max_pages is not None and args.max_pages < 1):
        parser.error("--threads e --max-pages devem ser positivos")
    if args.ano_inicial > args.ano_final:
        parser.error("--ano-inicial deve ser menor ou igual a --ano-final")
    if args.output and args.ano is None:
        parser.error("--output exige --ano; para vários anos use --output-dir")
    years = [args.ano] if args.ano is not None else range(args.ano_inicial, args.ano_final + 1)
    jobs = []
    try:
        for year in years:
            output = args.output or args.output_dir / f"dengue-{year}.csv"
            config = {"endpoint": ENDPOINT, "limit": PAGE_SIZE, "ano": str(year), "municipio": args.municipio}
            jobs.append(open_checkpoint(output, config))
        if not args.export_only:
            print(f"Download direto | {len(jobs)} ano(s) | até {args.threads} requisições simultâneas | "
                  f"{PAGE_SIZE} registros por requisição de cada thread | sem contagem prévia", flush=True)
            pending_years = [job["config"]["ano"] for job in jobs if not job["complete"]]
            print(f"Anos na fila de download: {', '.join(pending_years) or 'nenhum (todos concluídos)'}", flush=True)
            download(jobs, args.threads, args.max_pages)
    finally:
        # Exporta inclusive os anos parcialmente baixados em caso de falha/Ctrl+C.
        # Fechamento é garantido mesmo se uma exportação falhar.
        try:
            for job in jobs:
                if args.export_only or job["dirty"]:
                    export(job["db"], job["output"], job["config"])
        finally:
            for job in jobs:
                job["db"].close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrompido. Execute novamente para retomar os checkpoints.", file=sys.stderr)
        sys.exit(130)
    except (ValueError, URLError, TimeoutError, OSError, sqlite3.Error) as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
