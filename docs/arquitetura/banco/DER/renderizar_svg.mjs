import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const modulePath = process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : '@viz-js/viz';
const { instance } = await import(modulePath);
const root=dirname(fileURLToPath(import.meta.url));
const viz=await instance();
const quote=(s)=>JSON.stringify(s);
function wrap(s,size=17){let out=[],line='';for(const word of s.split(' ')){if(line && (line+' '+word).length>size){out.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)out.push(line);return out.join('\n');}
for(const file of readdirSync(root).filter(f=>f.endsWith('.puml'))){
 const src=readFileSync(resolve(root,file),'utf8');
 const entities=[...src.matchAll(/^entity "([^"]+)" as (\w+) \{\n\}/gm)].map(m=>({label:m[1],id:m[2]}));
 const relationships=[...src.matchAll(/^relationship "([^"]+)" as (\w+) \{\n\}/gm)].map(m=>({label:m[1],id:m[2]}));
 const edges=[...src.matchAll(/^(R\d+) -\((\d+,(?:\d+|N))\)- (\w+)$/gm)].map(m=>({r:m[1],card:m[2].replace('N','n'),entity:m[3]}));
 if(edges.length!==relationships.length*2)throw new Error(file+': relação sem duas participações');
 let dot=['graph DER {','graph [rankdir=LR, bgcolor="white", nodesep=0.40, ranksep=0.72, pad=0.3, splines=polyline];','node [fontname="Arial", fontsize=12, color="#555555", penwidth=1.2];','edge [fontname="Arial", fontsize=11, color="#666666", labeldistance=1.5, labelangle=25];'];
 for(const e of entities)dot.push(`${e.id} [shape=box, label=${quote(wrap(e.label,21))}, margin="0.14,0.10"];`);
 for(const r of relationships){
  dot.push(`${r.id} [shape=diamond, label=${quote(wrap(r.label,16))}, margin="0.04,0.03"];`);
  const pair=edges.filter(e=>e.r===r.id);
  dot.push(`${pair[0].entity} -- ${r.id} [taillabel=${quote('('+pair[0].card+')')}];`);
  dot.push(`${r.id} -- ${pair[1].entity} [headlabel=${quote('('+pair[1].card+')')}];`);
 }
 dot.push('}');
 const svg=viz.renderString(dot.join('\n'),{format:'svg',engine:'dot'});
 if(!svg.includes('<svg')||svg.includes('<parsererror'))throw new Error('SVG inválido: '+file);
 writeFileSync(resolve(root,basename(file,'.puml')+'.svg'),svg);
 console.log(file, entities.length+' entidades',relationships.length+' losangos');
}
