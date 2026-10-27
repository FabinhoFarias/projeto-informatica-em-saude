import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const modulePath = process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : '@viz-js/viz';
const { instance } = await import(modulePath);
const viz = await instance();
const source = readFileSync(resolve(root, 'modelo_completo.puml'), 'utf8');
const quote = JSON.stringify;
const entities = [...source.matchAll(/^entity "([^"]+)" as (\w+) \{\n(.*?)^\}/gms)]
  .map((m) => ({ label: m[1], id: m[2], attributes: [...m[3].matchAll(/^  "([^"]+)" as (\w+) : (\w+)( <<key>>)?$/gm)]
    .map((a) => ({ name: a[1], id: a[2], type: a[3], key: Boolean(a[4]) })) }));
const relationships = [...source.matchAll(/^relationship "([^"]+)" as (\w+) \{\n\}/gm)]
  .map((m) => ({ label: m[1], id: m[2] }));
const edges = [...source.matchAll(/^(REL_\d+) -\((\d+,(?:\d+|N))\)- (\w+)$/gm)]
  .map((m) => ({ relation: m[1], cardinality: m[2].replace('N', 'n'), entity: m[3] }));
const ids = new Set(entities.map((e) => e.id));
if (ids.size !== entities.length || !entities.length) throw new Error('Entidades ausentes ou duplicadas.');
if (edges.length !== relationships.length * 2 || edges.some((e) => !ids.has(e.entity))) throw new Error('Relacionamento inválido.');
const html = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const dot = ['graph Banco {',
  'graph [rankdir=LR, bgcolor="white", nodesep=0.20, ranksep=0.65, pad=0.30, splines=polyline, nslimit=2, nslimit1=2];',
  'node [fontname="Arial", fontsize=11, color="#555555", penwidth=1.1];',
  'edge [fontname="Arial", fontsize=10, color="#777777", labeldistance=1.7];'];
for (const e of entities) {
  dot.push(`${e.id} [shape=box, label=${quote(e.label)}, margin="0.12,0.10"];`);
  for (const a of e.attributes) {
    const name = a.key ? `<U>${html(a.name)}</U>` : html(a.name);
    const type = a.type === 'A_DEFINIR' ? 'tipo pendente' : a.type;
    dot.push(`${a.id} [shape=ellipse, fontsize=9, label=<${name}<BR/><FONT POINT-SIZE="8">${html(type)}</FONT>>];`);
    dot.push(`${e.id} -- ${a.id} [color="#BBBBBB", weight=0.3];`);
  }
}
for (const r of relationships) {
  const pair = edges.filter((e) => e.relation === r.id);
  if (pair.length !== 2) throw new Error(`Cardinalidade incompleta: ${r.id}`);
  dot.push(`${r.id} [shape=diamond, label=${quote(r.label)}, margin="0.03,0.02"];`);
  dot.push(`${pair[0].entity} -- ${r.id} [taillabel=${quote(`(${pair[0].cardinality})`)}];`);
  dot.push(`${r.id} -- ${pair[1].entity} [headlabel=${quote(`(${pair[1].cardinality})`)}];`);
}
dot.push('}');
const svg = viz.renderString(dot.join('\n'), { format: 'svg', engine: 'dot' });
if (!svg.includes('<svg')) throw new Error('SVG inválido.');
writeFileSync(resolve(root, 'modelo_completo.svg'), svg);
console.log(`${entities.length} entidades, ${entities.reduce((n, e) => n + e.attributes.length, 0)} atributos e ${relationships.length} relacionamentos exportados.`);

const viewerScript = String.raw`
const svg = document.querySelector('#canvas svg');
const full = svg.getAttribute('viewBox').split(/\s+/).map(Number);
let current = [...full];
let drag;
const nodes = [...svg.querySelectorAll('g.node')].filter(n => n.querySelector('title')?.textContent.startsWith('E_'));
const input = document.querySelector('#search');
const results = document.querySelector('#results');
function setView(box) { current = box; svg.setAttribute('viewBox', box.join(' ')); }
function point(x,y) { return new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse()); }
function zoom(factor, anchor) {
  anchor ??= new DOMPoint(current[0]+current[2]/2,current[1]+current[3]/2);
  if (current[2]*factor < 120 || current[2]*factor > full[2]*4) return;
  setView([anchor.x+(current[0]-anchor.x)*factor, anchor.y+(current[1]-anchor.y)*factor,current[2]*factor,current[3]*factor]);
}
function focus(node) {
  nodes.forEach(n => n.classList.remove('selected'));
  node.classList.add('selected');
  const b=node.getBBox();
  const m=svg.getCTM().inverse().multiply(node.getCTM());
  const a=new DOMPoint(b.x,b.y).matrixTransform(m);
  const z=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);
  const width=Math.max(1000,Math.abs(z.x-a.x)*3);
  const ratio=document.querySelector('#canvas').clientHeight/document.querySelector('#canvas').clientWidth;
  setView([(a.x+z.x)/2-width/2,(a.y+z.y)/2-width*ratio/2,width,width*ratio]);
  document.querySelector('#selected').textContent=node.querySelector('title').textContent.slice(2);
}
function refresh() {
  const query=input.value.toLowerCase().trim();
  results.replaceChildren();
  const matches=nodes.filter(n=>n.querySelector('title').textContent.slice(2).toLowerCase().includes(query));
  document.querySelector('#count').textContent=matches.length+' de '+nodes.length+' entidades';
  for(const node of matches) {
    const button=document.createElement('button');
    button.type='button';button.textContent=node.querySelector('title').textContent.slice(2);
    button.addEventListener('click',()=>focus(node));results.append(button);
  }
}
input.addEventListener('input',refresh);
document.querySelector('#in').addEventListener('click',()=>zoom(0.65));
document.querySelector('#out').addEventListener('click',()=>zoom(1.5));
document.querySelector('#fit').addEventListener('click',()=>setView([...full]));
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:0.87,point(e.clientX,e.clientY));},{passive:false});
svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={anchor:point(e.clientX,e.clientY),x:e.clientX,y:e.clientY,moved:false};svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e.clientX,e.clientY);if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;setView([current[0]+drag.anchor.x-p.x,current[1]+drag.anchor.y-p.y,current[2],current[3]]);});
svg.addEventListener('pointerup',e=>{const moved=drag?.moved;drag=undefined;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(!moved){const target=e.target.closest('g.node');if(target&&nodes.includes(target))focus(target);}});
svg.addEventListener('pointercancel',()=>{drag=undefined;});
refresh();
`;
const viewer = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Denguinhos — banco consolidado</title>
<style>
*{box-sizing:border-box}body{margin:0;font:14px Arial,sans-serif;color:#172033;background:#fff;height:100dvh;display:grid;grid-template-columns:280px 1fr;grid-template-rows:auto 1fr}
header{grid-column:1/-1;padding:14px 18px;border-bottom:1px solid #dbe1e8;display:flex;gap:18px;align-items:center;flex-wrap:wrap}h1{font-size:18px;margin:0}header p{margin:0;font-size:12px;color:#475569}.controls{display:flex;gap:6px;margin-left:auto}button{cursor:pointer;font:inherit;background:#fff;border:1px solid #cbd5e1;padding:8px 12px;color:inherit}button:hover,button:focus-visible{background:#eff6ff;outline:2px solid #2563eb;outline-offset:-2px}
aside{border-right:1px solid #dbe1e8;display:flex;flex-direction:column;padding:12px;min-height:0;gap:10px}input{font:inherit;padding:10px;border:1px solid #94a3b8;width:100%}label{font-weight:bold}#results{overflow:auto;display:flex;flex-direction:column;gap:4px}#results button{text-align:left;font-size:12px;overflow-wrap:anywhere}#count,#selected{font-size:12px;color:#475569;overflow-wrap:anywhere}#canvas{overflow:hidden;min-width:0;min-height:0}#canvas svg{width:100%;height:100%;display:block;touch-action:none;cursor:grab}g.selected polygon{fill:#dbeafe;stroke:#1d4ed8;stroke-width:3}#canvas svg:active{cursor:grabbing}a{color:#1d4ed8}
@media(max-width:700px){body{grid-template-columns:190px 1fr}h1{font-size:16px}header{padding:10px}aside{padding:8px}.controls{margin-left:0}}
</style></head><body><header><h1>Denguinhos — banco consolidado</h1><p>${entities.length} entidades · ${entities.reduce((n, e) => n + e.attributes.length, 0)} atributos · ${relationships.length} relacionamentos<br>Retângulo: entidade · losango: relação · elipse: atributo · tipo pendente: A_DEFINIR</p><div class="controls"><button id="in" aria-label="Aumentar zoom">+</button><button id="out" aria-label="Diminuir zoom">−</button><button id="fit">Ver tudo</button></div></header><aside><label for="search">Buscar entidade</label><input id="search" placeholder="Ex.: visita, cliente, amostra" autocomplete="off"><div id="count"></div><div id="selected" role="status">Selecione uma entidade para ampliar. Arraste para mover o desenho.</div><div id="results"></div></aside><main id="canvas" aria-label="Diagrama completo do banco">${svg.slice(svg.indexOf('<svg'))}</main><script>${viewerScript}</script></body></html>`;
writeFileSync(resolve(root, 'modelo_completo.html'), viewer);
console.log('Visualizador autocontido com busca, zoom e pan exportado.');
