/* eslint-disable @typescript-eslint/no-require-imports -- Entrada CommonJS executada diretamente pelo Node.js. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateProgress, updateDocument } = require('./update-progress');
/* eslint-enable @typescript-eslint/no-require-imports */

function requirement(id, status = '⏳ **Futuro**') {
  return `### ${id} — Requisito de teste\n\n**Status:** ${status}\n\n**Evidência e lacunas:** Evidência de teste.\n`;
}
function document(body) {
  return `# Requisitos\n\n✅ Implementado aparece na legenda.\n\n<!-- requirements-progress:start -->\nantigo\n<!-- requirements-progress:end -->\n\n${body}`;
}

test('conta definições únicas, sem referências, legendas, emojis livres ou exemplos', () => {
  const fixture = document(
    '| RF-001 | RF-001 | RNF-001 | ✅ |\n\n' +
    '```md\n' + requirement('RF-999', '✅ **Implementado**') + '```\n\n' +
    requirement('RF-001', '✅ **Implementado**') +
    requirement('RF-002', '🏗 **Parcial**') +
    requirement('RNF-001', '🔎 **A verificar**')
  );
  const result = calculateProgress(fixture);
  assert.equal(result.total, 3);
  assert.equal(result.implemented, 1);
  assert.equal(result.percentage, 33);
  assert.deepEqual(result.counts, { Implementado: 1, Parcial: 1, Futuro: 0, 'A verificar': 1 });
});

test('rejeita definições duplicadas e status ausente, repetido ou incompatível', () => {
  assert.throws(() => calculateProgress(requirement('RF-001').repeat(2)), /duplicada/);
  assert.throws(() => calculateProgress('### RF-001 — Teste\nSem status.'), /exatamente um/);
  assert.throws(() => calculateProgress(requirement('RF-001') + '\n**Status:** ⏳ **Futuro**'), /exatamente um/);
  assert.throws(() => calculateProgress(requirement('RF-001', '✅ **Parcial**')), /inválido/);
});

test('exige evidência por requisito e não aceita documento vazio', () => {
  assert.throws(() => calculateProgress(requirement('RF-001').replace(/\*\*Evidência e lacunas:\*\*.*/, '')), /evidência/);
  assert.throws(() => calculateProgress('Apenas referência RF-001 e ✅.'), /Nenhuma definição/);
});

test('atualiza somente o bloco gerado e é idempotente', () => {
  const body = requirement('RF-001', '✅ **Implementado**');
  const original = document(body) + '\nOutra imagem: https://geps.dev/progress/7\n';
  const result = updateDocument(original);
  assert.equal(result.progress.percentage, 100);
  assert.match(result.content, /https:\/\/geps.dev\/progress\/100/);
  assert.ok(result.content.endsWith(body + '\nOutra imagem: https://geps.dev/progress/7\n'));
  assert.equal(updateDocument(result.content).content, result.content);
});

test('não atribui crédito fracionário a parcial e preserva CRLF', () => {
  const original = document(requirement('RF-001', '🏗 **Parcial**')).replace(/\n/g, '\r\n');
  const result = updateDocument(original);
  assert.equal(result.progress.percentage, 0);
  assert.equal(result.progress.counts.Parcial, 1);
  assert.ok(!/(?<!\r)\n/.test(result.content));
});

test('falha sem modificar documentos com marcadores ausentes, repetidos ou invertidos', () => {
  const body = requirement('RF-001');
  assert.throws(() => updateDocument(body), /bloco/);
  assert.throws(() => updateDocument(document(body) + '\n<!-- requirements-progress:start -->'), /bloco/);
  assert.throws(() => updateDocument(`<!-- requirements-progress:end -->\n<!-- requirements-progress:start -->\n${body}`), /bloco/);
});
