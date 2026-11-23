import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [
  spawn(npmCommand, ["run", "api:dev"], { stdio: "inherit" }),
  spawn(npmCommand, ["run", "web:dev"], { stdio: "inherit" }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 250);
}

for (const child of processes) {
  child.on("error", (error) => {
    console.error("Falha ao iniciar o ambiente de desenvolvimento:", error);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(
        `Um processo de desenvolvimento encerrou (${signal ?? `código ${code}`}).`,
      );
      stop(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
