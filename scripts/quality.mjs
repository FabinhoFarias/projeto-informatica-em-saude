import { spawnSync } from "node:child_process";
import { openSync, closeSync, unlinkSync, statfsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const lock = join(root, ".quality.lock");
const source = ["app", "components", "lib", "scripts"];
const formatFiles = [
  "app/**/*.{ts,tsx,css}",
  "components/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "scripts/*.{mjs,js,ts}",
  "*.{json,md,mjs,ts}",
];
const commands = {
  typecheck: ["node_modules/typescript/bin/tsc", "--noEmit"],
  lint: [
    "node_modules/eslint/bin/eslint.js",
    ...source,
    "eslint.config.mjs",
    "next.config.ts",
  ],
  format: ["node_modules/prettier/bin/prettier.cjs", "--write", ...formatFiles],
  "format:check": [
    "node_modules/prettier/bin/prettier.cjs",
    "--check",
    ...formatFiles,
  ],
  test: [
    "--experimental-strip-types",
    "--test",
    "--test-concurrency=1",
    "scripts/hotspots.test.mjs",
    "scripts/marco-dois-rules.test.mjs",
    "scripts/update-progress.test.js",
  ],
};
const requested = process.argv[2] ?? "all";
const steps =
  requested === "all"
    ? ["typecheck", "lint", "format:check", "test"]
    : [requested];
if (steps.some((step) => !commands[step]))
  throw new Error("Verificação desconhecida.");
let fd;
try {
  fd = openSync(lock, "wx");
} catch (error) {
  if (error.code === "EEXIST") {
    console.error(
      "Já existe uma verificação em execução (.quality.lock). Após uma interrupção abrupta, confirme que ela terminou antes de remover esse arquivo.",
    );
    process.exit(1);
  }
  throw error;
}
try {
  for (const step of steps) {
    const disk = statfsSync(root);
    if (disk.bavail * disk.bsize < 10 * 1024 ** 3) {
      throw new Error(
        "Verificação cancelada: são necessários 10 GiB livres no volume do projeto.",
      );
    }
    console.log(
      `\nQualidade: ${step} — heap de 768 MiB; prazo máximo de 120 segundos.`,
    );
    const result = spawnSync(
      process.execPath,
      ["--max-old-space-size=768", ...commands[step]],
      {
        cwd: root,
        stdio: "inherit",
        timeout: 120_000,
        killSignal: "SIGKILL",
        env: {
          ...process.env,
          NODE_OPTIONS: "--max-old-space-size=768",
          UV_THREADPOOL_SIZE: "1",
        },
      },
    );
    if (result.error || result.status !== 0) {
      console.error(
        `Verificação interrompida em ${step}: ${result.error?.message ?? result.signal ?? `código ${result.status}`}.`,
      );
      process.exitCode = 1;
      break;
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeSync(fd);
  unlinkSync(lock);
}
