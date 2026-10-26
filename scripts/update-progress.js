/* eslint-disable @typescript-eslint/no-require-imports -- Entrada CommonJS executada diretamente pelo Node.js. */
const fs = require('node:fs');
const path = require('node:path');
/* eslint-enable @typescript-eslint/no-require-imports */

const DOCUMENT_PATH = path.join(__dirname, '../docs/documento_de_requisitos.md');
const START = '<!-- requirements-progress:start -->';
const END = '<!-- requirements-progress:end -->';
const STATUSES = [
  { label: 'Implementado', icon: '✅' },
  { label: 'Parcial', icon: '🏗' },
  { label: 'Futuro', icon: '⏳' },
  { label: 'A verificar', icon: '🔎' },
];

function withoutCodeFences(content) {
  let fence;
  return content.split(/\r?\n/).map((line) => {
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!fence && match) {
      fence = match[1];
      return '';
    }
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = undefined;
      return '';
    }
    return line;
  }).join('\n');
}

function calculateProgress(content) {
  const source = withoutCodeFences(content);
  const headings = [...source.matchAll(/^### ((?:RF|RNF)-\d{3}) — (.+)$/gm)];
  if (!headings.length) throw new Error('Nenhuma definição de requisito encontrada.');
  const seen = new Set();
  const counts = Object.fromEntries(STATUSES.map(({ label }) => [label, 0]));
  for (const heading of headings) {
    const id = heading[1];
    if (seen.has(id)) throw new Error(`Definição duplicada: ${id}.`);
    seen.add(id);
    const rest = source.slice(heading.index + heading[0].length);
    const nextHeading = rest.search(/^#{1,3} /m);
    const body = nextHeading < 0 ? rest : rest.slice(0, nextHeading);
    const statusLines = body.match(/^\*\*Status:\*\*.*$/gm) || [];
    if (statusLines.length !== 1) throw new Error(`${id}: esperado exatamente um Status.`);
    const status = STATUSES.find(({ label, icon }) => statusLines[0] === `**Status:** ${icon} **${label}**`);
    if (!status) throw new Error(`${id}: Status inválido.`);
    if (!/^\*\*Evidência e lacunas:\*\* \S.+$/m.test(body)) throw new Error(`${id}: informe evidência e lacunas.`);
    counts[status.label] += 1;
  }
  return { total: seen.size, implemented: counts.Implementado, percentage: Math.round(counts.Implementado / seen.size * 100), counts };
}

function updateDocument(content) {
  const progress = calculateProgress(content);
  if (content.split(START).length !== 2 || content.split(END).length !== 2 || content.indexOf(START) > content.indexOf(END)) {
    throw new Error('Use exatamente um bloco requirements-progress:start/end.');
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const block = [
    START,
    `![Progresso dos requisitos implementados: ${progress.percentage}%](https://geps.dev/progress/${progress.percentage})`,
    '',
    `**Progresso de implementação:** ${progress.percentage}% (${progress.implemented} de ${progress.total} requisitos com status Implementado).`,
    '',
    '| Status | Quantidade |',
    '| :--- | ---: |',
    ...STATUSES.map(({ label, icon }) => `| ${icon} ${label} | ${progress.counts[label]} |`),
    `| **Total** | **${progress.total}** |`,
    END,
  ].join(newline);
  const updated = content.slice(0, content.indexOf(START)) + block + content.slice(content.indexOf(END) + END.length);
  return { content: updated, progress };
}

function main() {
  try {
    const original = fs.readFileSync(DOCUMENT_PATH, 'utf8');
    const result = updateDocument(original);
    if (result.content !== original) fs.writeFileSync(DOCUMENT_PATH, result.content);
    console.log(`Progresso: ${result.progress.percentage}% (${result.progress.implemented} de ${result.progress.total} requisitos implementados).`);
    console.log(STATUSES.map(({ label }) => `${label}: ${result.progress.counts[label]}`).join(' | '));
  } catch (error) {
    console.error(`Erro ao atualizar progresso: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { calculateProgress, updateDocument };
