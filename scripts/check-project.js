const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const sourceRoots = ["backend", "pages", "scripts"];
const javascriptFiles = [];
const htmlFiles = [];
const issues = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".js")) javascriptFiles.push(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(fullPath);
  }
}

for (const directory of sourceRoots) {
  const fullPath = path.join(root, directory);
  if (fs.existsSync(fullPath)) collect(fullPath);
}

for (const file of javascriptFiles) {
  const source = fs.readFileSync(file, "utf8");
  const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: source,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    issues.push(`${path.relative(root, file)}: sintaxe inválida\n${(result.stderr || result.stdout).trim()}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)];
  for (const [, source] of scriptSources) {
    if (/^(https?:)?\/\//i.test(source) || source.startsWith("data:")) continue;
    const localPath = decodeURIComponent(source.split(/[?#]/, 1)[0]);
    const resolved = path.resolve(path.dirname(file), localPath);
    if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved)) {
      issues.push(`${path.relative(root, file)}: script local não encontrado: ${source}`);
    }
  }
}

if (issues.length) {
  console.error(`Verificação estática encontrou ${issues.length} problema(s):\n\n${issues.join("\n\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Verificação estática concluída: ${javascriptFiles.length} scripts JavaScript analisados e referências locais de scripts conferidas em ${htmlFiles.length} páginas.`);
}
