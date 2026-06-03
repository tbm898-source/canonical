/**
 * CANONICAL release gate: privacy QA + production build.
 * Run before every Base44 publish.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(scriptName) {
  console.log(`\n▶ npm run ${scriptName}\n`);
  const result = spawnSync(npmCmd, ["run", scriptName], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("qa:privacy");
run("build");
console.log("\n✓ Release gate passed (privacy QA + build).\n");
