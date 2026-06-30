// build: 정적 사이트 무결성 검증 — 필수 파일 존재 + index.html이 에셋을 참조하는지 (무의존)
import { readFileSync, existsSync } from "node:fs";

const required = ["index.html", "style.css", "script.js", "lib/pointer.js"];
let failed = 0;

for (const f of required) {
  if (existsSync(f)) {
    console.log("  ✓ 존재: " + f);
  } else {
    failed++;
    console.error("  ✗ 누락: " + f);
  }
}

if (existsSync("index.html")) {
  const html = readFileSync("index.html", "utf8");
  const refs = [
    ["style.css", /<link[^>]+href=["']style\.css["']/],
    ["script.js", /<script[^>]+src=["']script\.js["']/],
    ["lib/pointer.js", /<script[^>]+src=["']lib\/pointer\.js["']/],
  ];
  for (const [label, re] of refs) {
    if (re.test(html)) {
      console.log("  ✓ index.html → " + label + " 참조");
    } else {
      failed++;
      console.error("  ✗ index.html 참조 누락: " + label);
    }
  }
}

if (failed) {
  console.error(`\n[build] 실패: ${failed}개 항목`);
  process.exit(1);
}
console.log("\n[build] OK — 정적 자산 검증 통과");
