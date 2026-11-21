from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


OUT = Path("docs/apresentacoes/proposta-valor-vigia-plus.pptx")
GREEN = "087F5B"
DARK = "12312B"
MINT = "E9F7F1"
TEXT = "18332D"
MUTED = "58736A"
WHITE = "FFFFFF"
W, H = 12192000, 6858000


def tx(text, x, y, w, h, size=2200, color=TEXT, bold=False, align="l"):
    lines = str(text).split("\n")
    runs = "".join(
        f'<a:r><a:rPr lang="pt-BR" sz="{size}" b="{str(bold).lower()}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:rPr><a:t>{escape(line)}</a:t></a:r>'
        f'<a:br/>' if i < len(lines) - 1 else
        f'<a:r><a:rPr lang="pt-BR" sz="{size}" b="{str(bold).lower()}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:rPr><a:t>{escape(line)}</a:t></a:r>'
        for i, line in enumerate(lines)
    )
    return f'''<p:sp><p:nvSpPr><p:cNvPr id="{x}{y}" name="Text"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p algn="{align}"><a:pPr alg="{align}"/>{runs}<a:endParaRPr lang="pt-BR"/></a:p></p:txBody></p:sp>'''


def rect(x, y, w, h, fill, line=None, radius=False):
    geom = "roundRect" if radius else "rect"
    stroke = f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{line or fill}"/></a:solidFill></a:ln>'
    return f'''<p:sp><p:nvSpPr><p:cNvPr id="{x}{y}{w}" name="Shape"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>{stroke}</p:spPr></p:sp>'''


def slide(title, subtitle, blocks, accent=False, number=1):
    shapes = [rect(0, 0, W, H, WHITE)]
    shapes.append(tx("PROPOSTA DE VALOR · GESTÃO MUNICIPAL · VIGIA+", 809625, 666750, 10300000, 270000, 1150, GREEN, True))
    shapes.append(tx(title, 809625, 1038225, 10800000, 520000, 2700, DARK, True))
    if subtitle:
        shapes.append(tx(subtitle, 809625, 1819275, 10500000, 430000, 1550, MUTED))
    columns = 2
    card_w = 5000000
    card_h = 1250000 if len(blocks) <= 4 else 950000
    start_y = 2780000
    for i, (heading, body) in enumerate(blocks):
        col = i % columns
        row = i // columns
        x = 1047750 + col * 5410000
        y = start_y + row * (card_h + 260000)
        shapes.append(rect(x, y, card_w, card_h, MINT if accent else "F5F8F6", GREEN, True))
        shapes.append(tx(heading, x + 240000, y + 190000, card_w - 480000, 280000, 1550, GREEN, True))
        shapes.append(tx(body, x + 240000, y + 520000, card_w - 480000, card_h - 650000, 1350, TEXT))
    shapes.append(tx("VIGIA+ · proposta de valor", 809625, 6191250, 4500000, 250000, 1100, MUTED))
    shapes.append(tx(f"{number:02d}", 11049000, 6191250, 500000, 250000, 1200, GREEN, True, "r"))
    return presentation_shapes(shapes)


def presentation_shapes(shapes):
    return f'''<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>{"".join(shapes)}<p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''


slides = [
    ("VIGIA+", "Gestão operacional da vigilância de endemias", [("Proposta de valor econômica", "Mais controle do território, menos retrabalho e decisão baseada em registros rastreáveis."), ("Para quem", "Prefeito, Secretaria de Saúde, gestores, ACEs, digitadores e laboratoristas.")], True),
    ("O desafio da prefeitura", "A operação perde tempo quando os dados ficam dispersos.", [("Processo atual", "Fichas em papel, planilhas, somas manuais e comunicação fragmentada."), ("Custo invisível", "Retrabalho, atrasos, deslocamentos pouco direcionados e baixa visibilidade da cobertura."), ("Pergunta de gestão", "Quais setores foram cobertos, quais imóveis ficaram pendentes e quem precisa agir agora?")]),
    ("A solução", "O VIGIA+ conecta território, equipe, imóvel e ação.", [("Território", "Bairro, setor, quarteirão, microárea e imóvel com atribuição de responsabilidade."), ("Operação", "Ciclo, visita, recusa, imóvel fechado, retorno, tratamento e ocorrência."), ("Gestão", "Painéis de cobertura, histórico por ACE, relatórios e indicadores por período.")], True),
    ("O que muda no trabalho de campo", "O ACE encontra a próxima tarefa e registra a visita no contexto correto.", [("Antes", "Lista dispersa, ficha manual e conferência posterior."), ("Depois", "Imóveis por quarteirão ou rua, situação por ciclo e ficha vinculada ao imóvel."), ("Ganho mensurável", "Cobertura, pendências, retornos, tempo por ficha e registros corrigidos.")]),
    ("O que muda para o gestor", "A gestão acompanha execução antes do fim do ciclo.", [("Cobertura", "Comparação de imóveis atribuídos, visitados, pendentes, recusas e retornos."), ("Território", "Visão por ACE, bairro, setor e quarteirão."), ("Ação", "Redistribuição de equipes e priorização com justificativa registrada.")], True),
    ("Integração do processo", "Uma ocorrência não termina na visita: ela pode virar ação, amostra, tratamento ou relatório.", [("Laboratório", "Coleta vinculada ao imóvel, ACE, recebimento, análise e resultado."), ("Estoque", "Produtos, saldo mínimo, consumo e alertas de reposição."), ("Relatórios", "Resumo diário, semana, mês, ciclo e semana epidemiológica.")]),
    ("Ganhos para o município", "Resultados que podem ser medidos no piloto.", [("Eficiência", "Menos horas de consolidação e preparação de relatórios."), ("Qualidade", "Menos duplicidades, campos incompletos e erros de soma."), ("Resposta", "Menor tempo entre ocorrência, validação, prioridade e tratativa."), ("Transparência", "Histórico, origem, versão e estado de cada registro.")], True),
    ("Como medir o retorno", "A economia será calculada com a linha de base real da prefeitura.", [("Linha de base", "Medir 8–12 semanas de horas, retrabalho, deslocamentos, cobertura e relatórios."), ("Piloto", "Implantar em uma equipe, setor ou ciclo e comparar os mesmos indicadores."), ("Cálculo", "Economia operacional = tempo poupado + retrabalho evitado + deslocamento evitado − custo da solução.")]),
    ("Implantação segura", "Começar pequeno, validar e ampliar.", [("1 · Configurar", "Territórios, equipes, funções, catálogos, ciclos e relatórios municipais."), ("2 · Treinar", "ACE, gestor, digitador e laboratorista conforme a função."), ("3 · Avaliar", "Comparar indicadores, registrar limitações e validar com a Secretaria de Saúde.")], True),
    ("Próximo passo", "Escolher o primeiro ciclo-piloto da prefeitura.", [("Decisão proposta", "Selecionar uma equipe e um setor para medir a operação atual e operar o VIGIA+."), ("Compromisso", "Não prometer uma economia fixa antes da medição; entregar evidência local."), ("Mensagem final", "O VIGIA+ não é apenas um mapa: é controle diário da execução da vigilância.")]),
]

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}
ET.register_namespace("a", NS["a"])
ET.register_namespace("p", NS["p"])
ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")


def set_shape_text(shape, value):
    text_nodes = shape.findall(".//a:t", NS)
    if not text_nodes:
        return
    text_nodes[0].text = value
    for node in text_nodes[1:]:
        node.text = ""


def make_from_template():
    template = Path("docs/apresentacoes/VIGIA_Marco_2_inspecao_MVP.pptx")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(template) as source:
        files = {name: source.read(name) for name in source.namelist()}
    template_slide = files["ppt/slides/slide2.xml"]
    for number, item in enumerate(slides, 1):
        title, subtitle, blocks, *_ = item
        left = blocks[: max(1, (len(blocks) + 1) // 2)]
        right = blocks[max(1, (len(blocks) + 1) // 2) :]
        if not right:
            right = [("Próximo passo", "Validar este resultado no piloto municipal.")]
        root = ET.fromstring(template_slide)
        shapes = root.findall(".//p:sp", NS)
        values = {
            0: "PROPOSTA DE VALOR · GESTÃO MUNICIPAL · VIGIA+",
            1: title,
            2: "VIGIA+ · Proposta de valor",
            3: f"{number:02d}",
            4: subtitle,
            7: "\n".join(f"{heading}: {body}" for heading, body in left),
            8: "",
            11: right[0][0],
            12: "\n".join(body for _, body in right),
        }
        for index, value in values.items():
            if index < len(shapes):
                set_shape_text(shapes[index], value)
        xml = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode()
        xml = xml.replace("2458E0", GREEN).replace("8FB3FF", "78C9A8").replace("CFE0FC", "D8F1E6")
        files[f"ppt/slides/slide{number}.xml"] = xml.encode()
    files["ppt/theme/theme1.xml"] = files["ppt/theme/theme1.xml"].replace(b"4472C4", GREEN.encode()).replace(b"8FB3FF", b"78C9A8").replace(b"CFE0FC", b"D8F1E6")
    with ZipFile(OUT, "w", ZIP_DEFLATED) as target:
        for name, data in files.items():
            target.writestr(name, data)


def content_types(n):
    overrides = ['<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>', '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>', '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>', '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>']
    overrides += [f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' for i in range(1, n + 1)]
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>{"".join(overrides)}</Types>'''


def make_pptx():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pres = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="p14"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>{"".join(f'<p:sldId id="{255+i}" r:id="rId{i+2}"/>' for i in range(len(slides)))}</p:sldIdLst><p:sldSz cx="{W}" cy="{H}" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'''
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' + ''.join(f'<Relationship Id="rId{i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i+1}.xml"/>' for i in range(len(slides))) + '</Relationships>'
    master = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:clrMap bg1="lt1" tx1="dk1" accent1="accent1" accent2="accent2"/></p:sldMaster>'''
    layout = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'''
    theme = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="VIGIA+"><a:themeElements><a:clrScheme name="VIGIA+"><a:dk1><a:srgbClr val="{TEXT}"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:accent1><a:srgbClr val="{GREEN}"/></a:accent1><a:accent2><a:srgbClr val="{MINT}"/></a:accent2></a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="VIGIA+"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>'''
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types(len(slides)))
        z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>')
        z.writestr('ppt/presentation.xml', pres)
        z.writestr('ppt/_rels/presentation.xml.rels', rels)
        z.writestr('ppt/slideMasters/slideMaster1.xml', master)
        z.writestr('ppt/slideLayouts/slideLayout1.xml', layout)
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>')
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>')
        z.writestr('ppt/theme/theme1.xml', theme)
        for i, item in enumerate(slides, 1):
            title, subtitle, blocks, *accent_value = item
            accent = accent_value[0] if accent_value else False
            z.writestr(f'ppt/slides/slide{i}.xml', slide(title, subtitle, blocks, accent, i))
            z.writestr(f'ppt/slides/_rels/slide{i}.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')


if __name__ == "__main__":
    make_from_template()
    print(OUT)
