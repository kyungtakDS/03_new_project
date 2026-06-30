// food-roulette-kit 플러그인 · 훅 1/3 — PreToolUse(Bash)
// Bash로 `git commit`을 실행하려 할 때만 프로젝트의 lint → build → test를 돌리고,
// 하나라도 실패하면 exit 2로 커밋을 차단한다.
// (PreToolUse 훅에서 exit 2 = 도구 호출 차단 + stderr를 Claude에게 전달)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// 훅 페이로드(JSON)를 stdin에서 읽어 실행하려는 명령을 추출한다.
// .trim()은 선행 BOM(U+FEFF)·공백을 함께 제거하므로 어떤 셸 입력에도 안전하다.
let command = "";
try {
  command = JSON.parse(readFileSync(0, "utf8").trim())?.tool_input?.command ?? "";
} catch {
  command = "";
}

// 진짜 `git commit`만 게이트. --no-verify / -n 으로 들어오면 우회를 존중한다.
const isGitCommit = /\bgit\b[^&|;]*\bcommit\b/.test(command);
const bypass = /--no-verify\b|(?:^|\s)-\w*n/.test(command);
if (!isGitCommit || bypass) process.exit(0);

// 플러그인은 "지금 작업 중인 프로젝트"(CLAUDE_PROJECT_DIR)를 대상으로 동작한다.
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
process.chdir(root);

// 프로젝트에 실제로 존재하는 단계만 실행 — 다른 저장소에 설치돼도 안전하게.
const steps = [
  ["lint", ["scripts/lint.mjs"], () => existsSync("scripts/lint.mjs")],
  ["build", ["scripts/build.mjs"], () => existsSync("scripts/build.mjs")],
  ["test", ["--test"], () => existsSync("tests")],
];

let ran = 0;
for (const [name, args, present] of steps) {
  if (!present()) continue;
  ran++;
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

if (ran) process.stderr.write("✅ pre-commit: lint · build · test 통과\n");
process.exit(0);
