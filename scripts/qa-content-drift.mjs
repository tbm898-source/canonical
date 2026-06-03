import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const canonicalDir = path.join(root, "content");
const legacyMirrorDir = path.join(root, "src", "content");

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) return walk(fullPath);
      return fullPath;
    })
    .sort();
}

function relativeFiles(dir) {
  return walk(dir).map((file) => path.relative(dir, file).replace(/\\/g, "/"));
}

const canonicalFiles = relativeFiles(canonicalDir);
const mirrorFiles = relativeFiles(legacyMirrorDir);
const canonicalSet = new Set(canonicalFiles);
const mirrorSet = new Set(mirrorFiles);
const missingFromMirror = canonicalFiles.filter((file) => !mirrorSet.has(file));
const extraInMirror = mirrorFiles.filter((file) => !canonicalSet.has(file));
const mismatched = canonicalFiles.filter((file) => {
  if (!mirrorSet.has(file)) return false;
  return readFileSync(path.join(canonicalDir, file), "utf8") !== readFileSync(path.join(legacyMirrorDir, file), "utf8");
});

const sourceImports = walk(path.join(root, "src")).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
const staleImports = sourceImports.filter((file) => {
  const content = readFileSync(file, "utf8");
  return /\.\.\/content|\.\.\/\.\.\/content/.test(content);
});

if (missingFromMirror.length || extraInMirror.length || mismatched.length || staleImports.length) {
  console.error("Content drift QA failed.");
  if (missingFromMirror.length) console.error("Missing from src/content:", missingFromMirror);
  if (extraInMirror.length) console.error("Extra in src/content:", extraInMirror);
  if (mismatched.length) console.error("Mismatched files:", mismatched);
  if (staleImports.length) console.error("Stale src/content imports:", staleImports.map((file) => path.relative(root, file)));
  process.exit(1);
}

console.log("Content drift QA passed: /content and src/content mirror match, and app imports use @content.");
