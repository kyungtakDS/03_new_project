// lint: 프로젝트 내 모든 .js/.mjs 파일을 `node --check`로 문법 검사 (무의존)
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".git", ".claude"]);

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out = out.concat(walk(full));
    } else if ([".js", ".mjs", ".cjs"].includes(extname(name))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT);
let failed = 0;

for (const f of files) {
  const rel = relative(ROOT, f);
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
    console.log("  ✓ " + rel);
  } catch (e) {
    failed++;
    console.error("  ✗ " + rel);
    console.error(String(e.stderr || e.message).trim());
  }
}

if (failed) {
  console.error(`\n[lint] 실패: ${failed}개 파일에 문법 오류`);
  process.exit(1);
}
console.log(`\n[lint] OK — ${files.length}개 파일 통과`);
