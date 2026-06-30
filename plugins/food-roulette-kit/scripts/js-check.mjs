// food-roulette-kit 플러그인 · 훅 2/3 — PostToolUse(Edit|Write|MultiEdit)
// 파일을 편집/생성한 직후, 바뀐 파일이 .js/.mjs/.cjs면 `node --check`로 구문만 빠르게 검사한다.
// 구문 오류가 있으면 exit 2로 stderr를 Claude에게 돌려보내 곧바로 고치게 한다.
// (PostToolUse 훅에서 exit 2 = 이미 실행된 도구 결과에 대한 피드백을 Claude에게 전달)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// 훅 페이로드(JSON)에서 편집 대상 파일 경로를 추출한다.
// .trim()은 선행 BOM(U+FEFF)·공백을 함께 제거하므로 어떤 셸 입력에도 안전하다.
let filePath = "";
try {
  filePath = JSON.parse(readFileSync(0, "utf8").trim())?.tool_input?.file_path ?? "";
} catch {
  filePath = "";
}

// JS 계열 파일이 아니거나 (드물게) 파일이 없으면 조용히 통과.
if (!/\.(mjs|cjs|js)$/.test(filePath) || !existsSync(filePath)) process.exit(0);

try {
  execFileSync(process.execPath, ["--check", filePath], {
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  process.stderr.write(String(e.stdout ?? ""));
  process.stderr.write(String(e.stderr ?? ""));
  process.stderr.write(`\n❌ 구문 오류: ${filePath} — node --check 실패. 위 위치를 고쳐주세요.\n`);
  process.exit(2);
}

process.exit(0);
