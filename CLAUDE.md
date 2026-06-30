# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page "오늘 뭐 먹지?" food-roulette web app. Vanilla HTML/CSS/JS, **no build step, no bundler, no npm dependencies** — `index.html` runs directly in a browser. All tooling (lint/build/test) is plain Node, zero-install.

## Commands

```bash
# Run the app: just open index.html in a browser (double-click or file://).
# For a local server, any static server works, e.g.:  npx serve .

node scripts/lint.mjs            # lint  — node --check on every .js/.mjs in the repo
node scripts/build.mjs           # build — verifies required files exist + index.html references them
node --test                      # test  — discovers tests/*.test.mjs
node --test tests/pointer.test.mjs   # run a single test file
```

The pre-commit hook (see Tooling below) runs `lint → build → test` in that order; running them manually is the same check.

## Architecture

### The central invariant — read before touching the wheel
The sector under the top pointer **must** equal the announced winner. Both the wheel drawing and the winner decision go through one shared function: `RouletteMath.pointerIndex(rotation, n)` in `lib/pointer.js`. Never compute the winner a different way (e.g. a separate `Math.floor(rotation/seg)`) — the visual and the result will silently drift apart. The pointer sits at the top (12 o'clock), i.e. `POINTER_ANGLE = 1.5π`, in canvas angle convention.

### Script loading & the UMD module
`index.html` loads two plain `<script>` tags **in order**: `lib/pointer.js` then `script.js`. `script.js` depends on the `RouletteMath` global already existing — don't reorder or defer.

`lib/pointer.js` is a **UMD module on purpose**: it exposes `RouletteMath` as a browser global *and* supports `require()` in Node (the tests import it via `createRequire`). Keep both paths working — converting it to ES `import`/`export` breaks either the browser or the test suite.

### State model (`script.js`)
Three pieces of state: `menus[]` (wheel candidates), `history[]` (recent results), `soundOn`. After any mutation, the code must both **re-render** (`renderAll` / `drawWheel` / `renderHistory`) and **persist** (`save()` → `localStorage`). A mutation that skips either is a bug. `load()` restores from `localStorage` on startup (falling back to the Korean preset). Presets, spin animation (rAF + ease-out), confetti, and WebAudio sound effects all live in `script.js`.

Note: the spin animation uses `requestAnimationFrame`, which browsers pause in background/unfocused tabs — a spin triggered while the tab isn't foreground won't progress. This is a browser behavior, not an app bug.

## Tooling (`.claude/`)
This repo ships its own Claude Code customizations, and they reference each other:
- **`skills/code-review/`** — project-tailored code-review skill (knows the invariant above, the no-build constraints, and the output format).
- **`agents/code-reviewer.md`** — read-only review subagent; it invokes the `code-review` skill rather than freelancing a process.
- **`settings.json`** — a `PreToolUse`/`Bash` hook that, on `git commit`, runs `scripts/precommit-hook.mjs` (lint → build → test) and blocks the commit (exit 2) on failure. The hook script self-locates the repo root and only acts on real `git commit` commands (respecting `--no-verify`).
