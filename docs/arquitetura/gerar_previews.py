"""Extrai diagramas para prévia sem alterar a fonte única de arquitetura."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
source = root / "1.modeloGlobal.puml"
blocks = re.findall(r"^[ \t]*@startuml\s+(\w+)[^\n]*\n.*?^[ \t]*@enduml\s*$", source.read_text(), re.M | re.S)
text = source.read_text()
full_blocks = re.findall(r"^[ \t]*@startuml\s+\w+[^\n]*\n.*?^[ \t]*@enduml[ \t]*$", text, re.M | re.S)
if not full_blocks or len(full_blocks) != len(blocks):
    raise ValueError("Blocos PlantUML ausentes ou incompletos")
output = root / "preview"
output.mkdir(exist_ok=True)
for name, block in zip(blocks, full_blocks):
    target = output / f"{name}.puml"
    target.write_text("' GERADO: editar ../1.modeloGlobal.puml e executar ../gerar_previews.py\n" + block.strip() + "\n")
    print(f"{target.name}: {target.stat().st_size} bytes")
