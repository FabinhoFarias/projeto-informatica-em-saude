"""Consultas exatas do SINAN em Parquet, sem carregar o dataset inteiro em pandas."""
from itertools import combinations_with_replacement
from pathlib import Path
import os
import re
import time

AUSENCIAS = ['', 'nan', 'NaN', 'NAN', 'null', 'NULL', 'None', 'none', 'NaT', '<NA>']
UFS = [
    ('11','RO','Norte'), ('12','AC','Norte'), ('13','AM','Norte'),
    ('14','RR','Norte'), ('15','PA','Norte'), ('16','AP','Norte'), ('17','TO','Norte'),
    ('21','MA','Nordeste'), ('22','PI','Nordeste'), ('23','CE','Nordeste'),
    ('24','RN','Nordeste'), ('25','PB','Nordeste'), ('26','PE','Nordeste'),
    ('27','AL','Nordeste'), ('28','SE','Nordeste'), ('29','BA','Nordeste'),
    ('31','MG','Sudeste'), ('32','ES','Sudeste'), ('33','RJ','Sudeste'), ('35','SP','Sudeste'),
    ('41','PR','Sul'), ('42','SC','Sul'), ('43','RS','Sul'),
    ('50','MS','Centro-Oeste'), ('51','MT','Centro-Oeste'), ('52','GO','Centro-Oeste'), ('53','DF','Centro-Oeste'),
]


def qi(value):
    return '"' + value.replace('"', '""') + '"'


def qs(value):
    return "'" + str(value).replace("'", "''") + "'"


class AnaliseSinan:
    def __init__(self, pasta, memoria='3GB', threads=None):
        import duckdb
        self.pasta = Path(pasta)
        self.pasta.mkdir(parents=True, exist_ok=True)
        self.parquet = self.pasta / 'dengue-analitico.parquet'
        self.con = duckdb.connect()
        self.con.execute(f'SET threads = {int(threads or min(8, os.cpu_count() or 2))}')
        self.con.execute(f'SET memory_limit = {qs(memoria)}')
        self.con.execute('SET preserve_insertion_order = false')
        self.con.execute(f"SET temp_directory = {qs(self.pasta / 'temporarios')}")
        self.pronta = False

    def fechar(self):
        self.con.close()
        self.pronta = False

    def _verificar(self):
        if not self.pronta:
            raise RuntimeError('Execute preparar_csv() ou abrir_parquet() antes das consultas.')

    def preparar_csv(self, arquivo):
        """Sempre reconverte o CSV escolhido; não verifica cache nem pula downloads."""
        inicio = time.perf_counter()
        arquivo = Path(arquivo)
        nulls = '[' + ','.join(qs(value) for value in AUSENCIAS) + ']'
        self.pronta = False
        self.con.execute(f"""CREATE OR REPLACE TEMP VIEW origem AS
            SELECT * FROM read_csv({qs(arquivo)}, header=true, delim=',',
                all_varchar=true, sample_size=2048, parallel=true,
                nullstr={nulls}, strict_mode=true, ignore_errors=false)""")
        columns = [row[0] for row in self.con.execute('DESCRIBE origem').fetchall()]
        if any(name.startswith('_SINAN_') for name in columns):
            raise ValueError('A origem contém nomes reservados _SINAN_.')
        if 'SG_UF' not in columns and 'ID_MN_RESI' not in columns:
            raise ValueError('A origem precisa de SG_UF ou ID_MN_RESI (residência).')
        if 'ANO_ARQUIVO' not in columns:
            raise ValueError('Use o CSV consolidado com ANO_ARQUIVO.')
        temporary = self.parquet.with_suffix('.parquet.part')
        temporary.unlink(missing_ok=True)
        print('Preparando a base inteira: CSV → Parquet. Esta etapa lê o CSV uma vez.', flush=True)
        try:
            self.con.execute(f"""COPY (SELECT * FROM origem) TO {qs(temporary)}
                (FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 1, ROW_GROUP_SIZE 122880)""")
            temporary.replace(self.parquet)
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
        self.abrir_parquet(self.parquet)
        print(f'Preparação concluída: {self.total:,} registros em {time.perf_counter()-inicio:.1f}s.', flush=True)
        return self

    def abrir_parquet(self, arquivo):
        """Abre explicitamente um artefato já preparado; não reconverte CSV."""
        self.pronta = False
        self.parquet = Path(arquivo)
        self.con.execute(f'CREATE OR REPLACE TEMP VIEW origem_parquet AS SELECT * FROM read_parquet({qs(self.parquet)})')
        columns = [row[0] for row in self.con.execute('DESCRIBE origem_parquet').fetchall()]
        if 'ANO_ARQUIVO' not in columns or not {'SG_UF','ID_MN_RESI'}.intersection(columns):
            raise ValueError('O Parquet precisa de ANO_ARQUIVO e localização de residência.')
        if any(c.startswith('_SINAN_') for c in columns):
            raise ValueError('O Parquet contém nomes de colunas reservados.')
        self.colunas = columns
        geo = self._geografia_sql(columns)
        dates = []
        for raw, derived in [('DT_NOTIFIC','_SINAN_DT_NOTIFIC'), ('DT_SIN_PRI','_SINAN_DT_SIN_PRI')]:
            expression = f"try_strptime(trim({qi(raw)}), '%Y-%m-%d')::DATE" if raw in columns else 'NULL::DATE'
            dates.append(f'{expression} AS {qi(derived)}')
        # Colunas internas são expressões virtuais: só são calculadas quando
        # a consulta as solicita. Correlações não normalizam geografia/datas.
        self.con.execute('CREATE OR REPLACE TEMP VIEW base AS SELECT *, ' + ','.join(geo+dates) + ' FROM origem_parquet')
        self.total = self.con.execute('SELECT count(*) FROM origem_parquet').fetchone()[0]
        print('Criando resumo geográfico exato, lendo apenas localização e ano...', flush=True)
        keys = ['ANO_ARQUIVO'] + [c for c in ('SG_UF','ID_MN_RESI') if c in columns]
        self.con.execute('CREATE OR REPLACE TEMP TABLE geo_agregada AS SELECT ' + ','.join(qi(c) for c in keys)
            + ',count(*) AS quantidade FROM origem_parquet GROUP BY ALL')
        # Agrupa primeiro e só depois normaliza os códigos distintos.
        # Evita regex/mapear UF 32 milhões de vezes durante a preparação.
        self.con.execute('CREATE OR REPLACE TEMP TABLE resumo_geo AS SELECT ANO_ARQUIVO AS ano, '
            '_SINAN_MUN_RES AS municipio,_SINAN_UF_RES AS uf,_SINAN_REGIAO AS regiao,'
            'sum(quantidade)::BIGINT AS notificacoes FROM (SELECT *, ' + ','.join(geo)
            + ' FROM geo_agregada) GROUP BY ALL')
        self.con.execute('DROP TABLE geo_agregada')
        assert self.con.execute('SELECT coalesce(sum(notificacoes),0) FROM resumo_geo').fetchone()[0] == self.total
        self.pronta = True
        return self

    def _geografia_sql(self, columns):
        uf = "regexp_replace(upper(trim(\"SG_UF\")), '\\.0+$', '')" if 'SG_UF' in columns else 'NULL::VARCHAR'
        mun = "regexp_replace(trim(\"ID_MN_RESI\"), '\\.0+$', '')" if 'ID_MN_RESI' in columns else 'NULL::VARCHAR'
        codes = ','.join(qs(row[0]) for row in UFS)
        municipality = f"CASE WHEN regexp_full_match({mun}, '[0-9]{{6,7}}') AND left({mun},2) IN ({codes}) THEN left({mun},6) END"
        uf_cases = ' '.join(f'WHEN {qs(alias)} THEN {qs(code)}' for code,sigla,_ in UFS for alias in (code,sigla))
        uf_code = f'coalesce(CASE {uf} {uf_cases} END, left({municipality},2))'
        region_cases = ' '.join(f'WHEN {qs(code)} THEN {qs(region)}' for code,_,region in UFS)
        region = f"CASE {uf_code} {region_cases} ELSE 'Não identificada' END"
        return [f'{municipality} AS _SINAN_MUN_RES', f'{uf_code} AS _SINAN_UF_RES', f'{region} AS _SINAN_REGIAO']

    def por_ano(self):
        self._verificar()
        return self.con.execute('SELECT ano,sum(notificacoes)::BIGINT AS notificacoes FROM resumo_geo GROUP BY ano ORDER BY ano').df()

    def municipio(self, codigo):
        self._verificar()
        codigo = str(codigo).strip()
        if not re.fullmatch(r'[0-9]{6,7}', codigo):
            raise ValueError('Informe um código municipal de seis ou sete dígitos.')
        # Retorna também os anos com zero notificações desse município na base.
        return self.con.execute('''SELECT ano,
            sum(CASE WHEN municipio=? THEN notificacoes ELSE 0 END)::BIGINT AS notificacoes
            FROM resumo_geo GROUP BY ano ORDER BY ano''', [codigo[:6]]).df()

    def regioes(self):
        self._verificar()
        return self.con.execute('''SELECT regiao, sum(notificacoes)::BIGINT AS notificacoes,
            100.0*sum(notificacoes)/nullif(?,0) AS percentual_do_total
            FROM resumo_geo GROUP BY regiao ORDER BY notificacoes DESC,regiao''', [self.total]).df()

    def ausencias(self):
        self._verificar()
        # As estatísticas do Parquet dão ausências exatas sem varrer 6,4 bilhões de células.
        rows = self.con.execute('''SELECT path_in_schema, sum(stats_null_count)::BIGINT,
            bool_and(stats_null_count IS NOT NULL)
            FROM parquet_metadata(?) GROUP BY column_id,path_in_schema ORDER BY column_id''', [str(self.parquet)]).fetchall()
        result = []
        for name, missing, complete in rows:
            if name not in self.colunas:
                continue
            if not complete:
                missing = self.con.execute(f'SELECT count(*)-count({qi(name)}) FROM base').fetchone()[0]
            result.append((name, missing, 100*missing/self.total if self.total else 0))
        import pandas as pd
        return pd.DataFrame(result, columns=['coluna','ausentes','percentual_ausente']).sort_values('percentual_ausente', ascending=False)

    def frequencias(self, campo):
        self._verificar()
        if campo not in self.colunas:
            raise ValueError(f'Coluna não encontrada: {campo}')
        return self.con.execute(f'SELECT {qi(campo)} AS valor,count(*) AS notificacoes FROM base GROUP BY 1 ORDER BY 2 DESC').df()

    def tabela_associacao(self, campo_a, campo_b):
        self._verificar()
        if campo_a not in self.colunas or campo_b not in self.colunas:
            raise ValueError('Selecione colunas existentes.')
        result = self.con.execute(f'''SELECT {qi(campo_a)} AS categoria_a,
            {qi(campo_b)} AS categoria_b,count(*) AS quantidade FROM base
            WHERE {qi(campo_a)} IS NOT NULL AND {qi(campo_b)} IS NOT NULL
            GROUP BY 1,2''').df()
        return result.pivot_table(index='categoria_a', columns='categoria_b',
            values='quantidade', aggfunc='sum', fill_value=0).astype('int64')

    def serie_temporal(self, municipio=None, data='DT_NOTIFIC', periodo='month'):
        self._verificar()
        if data not in ('DT_NOTIFIC','DT_SIN_PRI') or periodo not in ('day','week','month','year'):
            raise ValueError('Escolha DT_NOTIFIC/DT_SIN_PRI e day/week/month/year.')
        column = qi('_SINAN_' + data)
        filter_sql = ''
        params = []
        if municipio is not None:
            codigo = str(municipio).strip()
            if not re.fullmatch(r'[0-9]{6,7}', codigo):
                raise ValueError('Código municipal inválido.')
            filter_sql = ' AND _SINAN_MUN_RES=?'
            params = [codigo[:6]]
        return self.con.execute(f'''SELECT date_trunc('{periodo}',{column})::DATE AS periodo,
            count(*) AS notificacoes FROM base WHERE {column} IS NOT NULL {filter_sql}
            GROUP BY 1 ORDER BY 1''', params).df()

    def qualidade_datas(self):
        self._verificar()
        expressions = ["count(*) FILTER (WHERE _SINAN_DT_NOTIFIC < _SINAN_DT_SIN_PRI) AS notificacao_antes_dos_sintomas"]
        for field in ('DT_NOTIFIC','DT_SIN_PRI'):
            if field in self.colunas:
                expressions.append(f'count(*) FILTER (WHERE {qi(field)} IS NOT NULL AND {qi("_SINAN_"+field)} IS NULL) AS {qi(field+"_INVALIDA")}')
        return self.con.execute('SELECT ' + ','.join(expressions) + ' FROM base').df()

    def correlacoes(self, campos, minimo_validos=500):
        self._verificar()
        campos = list(dict.fromkeys(campos))
        if not campos or any(c not in self.colunas for c in campos):
            raise ValueError('Selecione apenas colunas existentes.')
        if minimo_validos < 2:
            raise ValueError('minimo_validos deve ser pelo menos 2.')
        expressions = [f"CASE WHEN trim({qi(c)}) IN ('1','1.0') THEN 1.0 WHEN trim({qi(c)}) IN ('2','2.0') THEN 0.0 END AS x_{i}" for i,c in enumerate(campos)]
        pairs = list(combinations_with_replacement(range(len(campos)), 2))
        aggregates = []
        for k,(i,j) in enumerate(pairs):
            aggregates += [f'corr(x_{i},x_{j}) AS r_{k}', f'count(x_{i}+x_{j}) AS n_{k}']
        values = self.con.execute('WITH binarios AS (SELECT ' + ','.join(expressions) + ' FROM base) SELECT ' + ','.join(aggregates) + ' FROM binarios').fetchone()
        import pandas as pd
        corr = pd.DataFrame(float('nan'), index=campos, columns=campos)
        valid = pd.DataFrame(0, index=campos, columns=campos)
        for k,(i,j) in enumerate(pairs):
            coefficient, count = values[2*k:2*k+2]
            corr.iloc[i,j] = corr.iloc[j,i] = coefficient if count >= minimo_validos and coefficient is not None else float('nan')
            valid.iloc[i,j] = valid.iloc[j,i] = count
        return corr, valid

    def duplicatas_exatas(self):
        self._verificar()
        # Comparação exata dos campos publicados; sem hash probabilístico.
        cols = ','.join(qi(c) for c in self.colunas if c != 'ANO_ARQUIVO')
        return self.con.execute(f'''SELECT coalesce(sum(n-1),0)::BIGINT AS copias_excedentes,
            coalesce(sum(n),0)::BIGINT AS linhas_envolvidas, count(*) AS grupos_duplicados
            FROM (SELECT {cols},count(*) AS n FROM base GROUP BY ALL HAVING count(*)>1)''').df()
