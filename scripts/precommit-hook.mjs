// Claude Code PreToolUse 훅: Bash로 `git commit`을 실행하려 할 때만
// lint → build → test를 돌리고, 하나라도 실패하면 exit 2로 커밋을 차단한다.
// (PreToolUse 훅에서 exit 2 = 도구 호출 차단 + stderr를 Claude에게 전달)
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

// 이 스크립트는 scripts/ 안에 있으므로 프로젝트 루트는 한 단계 위.
// cwd가 무엇이든 루트로 이동해 lint/build/test 상대경로가 안정적으로 동작하게 한다.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

// 훅 페이로드(JSON)를 stdin에서 읽어 실행하려는 명령을 추출한다.
let command = "";
try {
  const payload = JSON.parse(readFileSync(0, "utf8"));
  command = payload?.tool_input?.command ?? "";
} catch {
  command = "";
}

// 진짜 `git commit`만 게이트. --no-verify / -n 으로 들어오면 우회를 존중한다.
const isGitCommit = /\bgit\b[^&|;]*\bcommit\b/.test(command);
const bypass = /--no-verify\b|(?:^|\s)-\w*n/.test(command);
if (!isGitCommit || bypass) {
  process.exit(0); // 커밋이 아니면 아무것도 하지 않고 통과
}

const steps = [
  ["lint", ["scripts/lint.mjs"]],
  ["build", ["scripts/build.mjs"]],
  ["test", ["--test"]],
];

for (const [name, args] of steps) {
  try {
    execFileSync(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    process.stderr.write(String(e.stdout ?? ""));
    process.stderr.write(String(e.stderr ?? ""));
    process.stderr.write(
      `\n❌ pre-commit: ${name} 실패 — 커밋을 중단합니다. 위 출력을 고친 뒤 다시 커밋하세요.\n`
    );
    process.exit(2); // 커밋 차단
  }
}

process.stderr.write("✅ pre-commit: lint · build · test 모두 통과\n");
process.exit(0);
