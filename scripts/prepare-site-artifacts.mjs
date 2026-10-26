import { rmSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.resolve(root, "dist");
const documents = path.resolve(dist, "teaching/cts/assets");
if (documents !== path.join(dist, "teaching", "cts", "assets") || !documents.startsWith(dist + path.sep)) {
  throw new Error("Unexpected generated document directory");
}
// Only remove build copies. Source documents remain in Git and are linked by immutable revision.
rmSync(documents, { recursive: true, force: true });
function size(folder) {
  return readdirSync(folder, { withFileTypes: true }).reduce((sum, entry) => {
    const file = path.join(folder, entry.name);
    return sum + (entry.isDirectory() ? size(file) : statSync(file).size);
  }, 0);
}
const bytes = size(dist);
if (bytes >= 50 * 1024 * 1024) throw new Error("Site still exceeds the Base44 archive limit");
console.log(`Site payload: ${(bytes / 1024 / 1024).toFixed(1)} MB; original teaching documents served from GitHub.`);
