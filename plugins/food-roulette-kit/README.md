# food-roulette-kit

"오늘 뭐 먹지?" food-roulette 앱을 위한 Claude Code 플러그인. 이 저장소의
`.claude/` 커스터마이즈를 배포 가능한 하나의 플러그인으로 묶은 것입니다.

## 들어 있는 것

| 종류 | 이름 | 설명 |
| --- | --- | --- |
| 스킬 | `code-review` | 바뀐 코드를 이 프로젝트 기준(핵심 불변식·무빌드 제약·출력 형식)으로 리뷰 |
| 서브에이전트 | `code-reviewer` | 읽기 전용 리뷰 에이전트. `code-review` 스킬을 호출해 랭크된 findings를 반환 |
| 훅 1 | `precommit-gate` (PreToolUse·Bash) | `git commit` 시 lint → build → test 실행, 실패하면 `exit 2`로 커밋 차단 |
| 훅 2 | `js-check` (PostToolUse·Edit/Write) | `.js/.mjs/.cjs` 편집 직후 `node --check`로 구문 검사, 오류면 Claude에 피드백 |
| 훅 3 | `session-invariant` (SessionStart) | 세션 시작 시 핵심 불변식(포인터=당첨, 상태 동기화, 무빌드)을 컨텍스트로 안내 |

훅 스크립트는 모두 의존성 없는 순수 Node (`scripts/*.mjs`)이며
`${CLAUDE_PLUGIN_ROOT}` 기준으로 실행됩니다. `precommit-gate`는 작업 중인
프로젝트(`CLAUDE_PROJECT_DIR`)를 대상으로 동작하고, 존재하는 단계만 실행하므로
다른 저장소에 설치돼도 안전합니다.

## 설치

이 저장소 자체가 마켓플레이스입니다(루트 `.claude-plugin/marketplace.json`).

```
/plugin marketplace add kyungtakDS/03_new_project
/plugin install food-roulette-kit@food-roulette-marketplace
```

설치 후 `/plugin` 메뉴 또는 `/hooks`, 그리고 코드리뷰 스킬/서브에이전트로
바로 사용할 수 있습니다.

## 구조

```
food-roulette-kit/
├── .claude-plugin/plugin.json     # 매니페스트
├── skills/code-review/SKILL.md    # 코드리뷰 스킬
├── agents/code-reviewer.md        # 코드리뷰 서브에이전트
├── hooks/hooks.json               # 훅 3종 등록
└── scripts/
    ├── precommit-gate.mjs         # 훅 1
    ├── js-check.mjs               # 훅 2
    └── session-invariant.mjs      # 훅 3
```
