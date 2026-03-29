#!/usr/bin/env node
/**
 * Bundle Size Report
 *
 * Analyzes the dist/ build output and checks against size budgets.
 * Outputs dist/bundle-metrics.json for CI/CD integration.
 *
 * Usage:
 *   npm run build && node scripts/bundle-size-report.js
 */

import { readdirSync, statSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "../dist");
const ASSETS_DIR = join(DIST_DIR, "assets/js");

// Size budgets (in KB)
const BUDGETS = {
  singleChunkMaxKB: 200,
  totalJSMaxKB: 800,
  totalCSSMaxKB: 100,
};

function sizeKB(bytes) {
  return Math.round(bytes / 1024);
}

function formatKB(bytes) {
  return `${sizeKB(bytes)} KB`;
}

function readFileSizes(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext) && !f.endsWith(`.${ext}`))
    .map((f) => {
      const full = join(dir, f);
      const stat = statSync(full);
      const gzipPath = full + ".gz";
      const brotliPath = full + ".br";
      return {
        name: f,
        size: stat.size,
        gzip: existsSync(gzipPath) ? statSync(gzipPath).size : null,
        brotli: existsSync(brotliPath) ? statSync(brotliPath).size : null,
      };
    })
    .sort((a, b) => b.size - a.size);
}

function readJSFiles() {
  // Try assets/js first, fall back to assets/
  const jsDir = existsSync(ASSETS_DIR) ? ASSETS_DIR : join(DIST_DIR, "assets");
  if (!existsSync(jsDir)) return [];
  return readdirSync(jsDir)
    .filter((f) => f.endsWith(".js") && !f.endsWith(".gz") && !f.endsWith(".br"))
    .map((f) => {
      const full = join(jsDir, f);
      const gzipPath = full + ".gz";
      const brotliPath = full + ".br";
      return {
        name: f,
        size: statSync(full).size,
        gzip: existsSync(gzipPath) ? statSync(gzipPath).size : null,
        brotli: existsSync(brotliPath) ? statSync(brotliPath).size : null,
      };
    })
    .sort((a, b) => b.size - a.size);
}

function readCSSFiles() {
  const cssDir = join(DIST_DIR, "assets/css");
  const fallbackDir = join(DIST_DIR, "assets");
  const dir = existsSync(cssDir) ? cssDir : fallbackDir;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css") && !f.endsWith(".gz") && !f.endsWith(".br"))
    .map((f) => {
      const full = join(dir, f);
      const gzipPath = full + ".gz";
      return {
        name: f,
        size: statSync(full).size,
        gzip: existsSync(gzipPath) ? statSync(gzipPath).size : null,
      };
    })
    .sort((a, b) => b.size - a.size);
}

if (!existsSync(DIST_DIR)) {
  console.error("❌ dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const jsFiles = readJSFiles();
const cssFiles = readCSSFiles();

const totalJS = jsFiles.reduce((acc, f) => acc + f.size, 0);
const totalJSGzip = jsFiles.reduce((acc, f) => acc + (f.gzip ?? 0), 0);
const totalJSBrotli = jsFiles.reduce((acc, f) => acc + (f.brotli ?? 0), 0);
const totalCSS = cssFiles.reduce((acc, f) => acc + f.size, 0);
const largestChunk = jsFiles[0]?.size ?? 0;

// Check budgets
const warnings = [];
if (sizeKB(largestChunk) > BUDGETS.singleChunkMaxKB) {
  warnings.push(
    `Largest JS chunk (${formatKB(largestChunk)}) exceeds ${BUDGETS.singleChunkMaxKB} KB budget`
  );
}
if (sizeKB(totalJS) > BUDGETS.totalJSMaxKB) {
  warnings.push(
    `Total JS (${formatKB(totalJS)}) exceeds ${BUDGETS.totalJSMaxKB} KB budget`
  );
}
if (sizeKB(totalCSS) > BUDGETS.totalCSSMaxKB) {
  warnings.push(
    `Total CSS (${formatKB(totalCSS)}) exceeds ${BUDGETS.totalCSSMaxKB} KB budget`
  );
}

// Output report
console.log("\n📦 MalFrame Bundle Size Report");
console.log("─".repeat(60));

if (jsFiles.length > 0) {
  console.log(`\nJavaScript (${jsFiles.length} chunks):`);
  jsFiles.forEach((f) => {
    const gzip = f.gzip ? `  gzip: ${formatKB(f.gzip)}` : "";
    const brotli = f.brotli ? ` | brotli: ${formatKB(f.brotli)}` : "";
    const flag = sizeKB(f.size) > BUDGETS.singleChunkMaxKB ? " ⚠️" : "";
    console.log(`  ${f.name.padEnd(45)} ${formatKB(f.size).padStart(8)}${flag}${gzip}${brotli}`);
  });
}

if (cssFiles.length > 0) {
  console.log(`\nCSS (${cssFiles.length} files):`);
  cssFiles.forEach((f) => {
    const gzip = f.gzip ? `  gzip: ${formatKB(f.gzip)}` : "";
    console.log(`  ${f.name.padEnd(45)} ${formatKB(f.size).padStart(8)}${gzip}`);
  });
}

console.log("\n" + "─".repeat(60));
console.log(
  `Total JS  : ${formatKB(totalJS).padStart(8)}` +
    (totalJSGzip ? `  (gzip: ${formatKB(totalJSGzip)}, brotli: ${formatKB(totalJSBrotli)})` : "")
);
console.log(`Total CSS : ${formatKB(totalCSS).padStart(8)}`);
console.log(`Chunks    : ${jsFiles.length}`);

if (warnings.length > 0) {
  console.warn("\n⚠️  Budget warnings:");
  warnings.forEach((w) => console.warn(`  - ${w}`));
} else {
  console.log("\n✅ All bundle size budgets met");
}

// Save metrics JSON
const metrics = {
  timestamp: new Date().toISOString(),
  totalJS,
  totalJSGzip,
  totalJSBrotli,
  totalCSS,
  jsChunks: jsFiles.length,
  largestChunkBytes: largestChunk,
  warnings: warnings.length,
  withinBudget: warnings.length === 0,
};

writeFileSync(join(DIST_DIR, "bundle-metrics.json"), JSON.stringify(metrics, null, 2));
console.log("\n📄 Saved: dist/bundle-metrics.json\n");

process.exit(warnings.length > 0 ? 1 : 0);
