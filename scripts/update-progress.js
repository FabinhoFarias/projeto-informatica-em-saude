/* eslint-disable @typescript-eslint/no-require-imports -- Entrada CommonJS executada diretamente pelo Node.js. */
const fs = require("node:fs");
const path = require("node:path");
/* eslint-enable @typescript-eslint/no-require-imports */

const DOCUMENTS = [
  {
    path: path.join(__dirname, "../docs/documento_de_requisitos.md"),
    scope: "sistema integrado",
  },
  {
    path: path.join(__dirname, "../docs/documento_de_requisitos_mock.md"),
    scope: "protótipo mockado",
  },
];
const START = "<!-- requirements-progress:start -->";
const END = "<!-- requirements-progress:end -->";
const STATUSES = [
  { label: "Implementado", icon: "✅" },
  { label: "Parcial", icon: "🏗" },
  { label: "Futuro", icon: "⏳" },
  { label: "A verificar", icon: "🔎" },
];

function withoutCodeFences(content) {
  let fence;
  return content
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
      if (!fence && match) {
        fence = match[1];
        return "";
      }
      if (fence) {
        if (
          match &&
          match[1][0] === fence[0] &&
          match[1].length >= fence.length &&
          !match[2].trim()
        )
          fence = undefined;
        return "";
      }
      return line;
    })
    .join("\n");
}

function calculateProgress(content) {
  const source = withoutCodeFences(content);
  const headings = [...source.matchAll(/^### ((?:RF|RNF)-\d{3}) — (.+)$/gm)];
  if (!headings.length)
    throw new Error("Nenhuma definição de requisito encontrada.");
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
    if (statusLines.length !== 1)
      throw new Error(`${id}: esperado exatamente um Status.`);
    const status = STATUSES.find(
      ({ label, icon }) =>
        statusLines[0] === `**Status:** ${icon} **${label}**`,
    );
    if (!status) throw new Error(`${id}: Status inválido.`);
    if (!/^\*\*Evidência e lacunas:\*\* \S.+$/m.test(body))
      throw new Error(`${id}: informe evidência e lacunas.`);
    counts[status.label] += 1;
  }
  return {
    total: seen.size,
    implemented: counts.Implementado,
    percentage: Math.round((counts.Implementado / seen.size) * 100),
    counts,
  };
}

function updateDocument(content, scope = "implementação") {
  const progress = calculateProgress(content);
  if (
    content.split(START).length !== 2 ||
    content.split(END).length !== 2 ||
    content.indexOf(START) > content.indexOf(END)
  ) {
    throw new Error("Use exatamente um bloco requirements-progress:start/end.");
  }
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const block = [
    START,
    "",
    `![Progresso do ${scope}: ${progress.percentage}%](https://geps.dev/progress/${progress.percentage})`,
    "",
    `**Progresso do ${scope}:** ${progress.percentage}% (${progress.implemented} de ${progress.total} requisitos com status Implementado).`,
    "",
    "| Status          | Quantidade |",
    "| :-------------- | ---------: |",
    `| ✅ Implementado | ${String(progress.counts.Implementado).padStart(10)} |`,
    `| 🏗 Parcial      | ${String(progress.counts.Parcial).padStart(10)} |`,
    `| ⏳ Futuro       | ${String(progress.counts.Futuro).padStart(10)} |`,
    `| 🔎 A verificar  | ${String(progress.counts["A verificar"]).padStart(10)} |`,
    `| **Total**       | ${`**${progress.total}**`.padStart(10)} |`,
    "",
    END,
  ].join(newline);
  const updated =
    content.slice(0, content.indexOf(START)) +
    block +
    content.slice(content.indexOf(END) + END.length);
  return { content: updated, progress };
}

function progressBar(percentage, width = 24) {
  const filled = Math.round((percentage / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function formatProgress(scope, progress) {
  const title = scope.toLocaleUpperCase("pt-BR");
  const count = (label) => String(progress.counts[label]).padStart(2, " ");
  return [
    `┌─ ${title}`,
    `│ ${progressBar(progress.percentage)}  ${String(progress.percentage).padStart(3, " ")}%`,
    `│ ${progress.implemented} de ${progress.total} requisitos concluídos`,
    "│",
    `│ ✅ Implementado  ${count("Implementado")}   🏗  Parcial       ${count("Parcial")}`,
    `│ ⏳ Futuro       ${count("Futuro")}   🔎 A verificar   ${count("A verificar")}`,
    "└────────────────────────────────────────────────────────",
  ].join("\n");
}

function main() {
  try {
    const summaries = [];
    for (const document of DOCUMENTS) {
      const original = fs.readFileSync(document.path, "utf8");
      const result = updateDocument(original, document.scope);
      if (result.content !== original)
        fs.writeFileSync(document.path, result.content);
      summaries.push(formatProgress(document.scope, result.progress));
    }
    console.log("\nPROGRESSO DOS REQUISITOS — VIGIA+\n");
    console.log(summaries.join("\n\n"));
    console.log();
  } catch (error) {
    console.error(`Erro ao atualizar progresso: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { calculateProgress, updateDocument, formatProgress };
