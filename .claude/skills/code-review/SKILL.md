---
name: code-review
description: >-
  Review changed code in this vanilla HTML/CSS/JS food-roulette project for
  correctness bugs and quality issues (reuse, simplification, readability).
  Use this skill whenever the user asks to review code, look over a diff, check
  recent changes, sanity-check before committing, or "see if this looks okay" —
  and whenever the code-reviewer subagent is asked to evaluate changes, even if
  the word "review" isn't used. Covers index.html, style.css, script.js, the
  lib/pointer.js UMD module, the scripts/*.mjs lint/build tooling, and the
  tests/*.test.mjs suite.
---

# Code Review

Review the project's changed code and report a short, ranked list of real
problems. The goal is to catch things that would actually bite — bugs that ship,
or messiness that will slow the next change — without drowning the author in
nitpicks.

## How to start

1. Find what changed. If this is a git repo, read the diff first:
   - Unstaged/working changes: `git diff`
   - Staged (about to commit): `git diff --cached`
   - If nothing is staged or modified, review the most recent commit: `git show`
2. Read the **full changed files**, not just the diff hunks — a line can look
   fine in isolation but break an invariant established elsewhere in the file.
3. Review only what changed plus what it directly touches. Don't rewrite the
   whole app.

## What to look for

Lead with correctness — a wrong result that ships is worse than untidy code.
Then quality.

### Correctness (highest priority)

- **Logic errors**: off-by-one, inverted conditions, wrong operator, mishandled
  empty/zero/negative inputs.
- **Broken invariants**: this app's central invariant is that **the sector under
  the top pointer equals the announced winner**. Both drawing and result use
  `RouletteMath.pointerIndex(rotation, n)` in `lib/pointer.js`. If a change
  computes the winner a different way, draws sectors with a different angle
  convention, or changes `POINTER_ANGLE`, flag it — the two can silently drift
  apart.
- **State/render desync**: `menus`, `history`, and the canvas must stay in sync.
  After mutating state, the code must re-render (`renderAll`/`drawWheel`) and
  persist (`save()`). A mutation that skips one of these is a bug.
- **Edge cases**: spinning with 0–1 menus, duplicate menu names, very long
  names, an empty wheel, `localStorage` unavailable (private mode) or holding
  malformed JSON.
- **Async/animation**: `requestAnimationFrame` loops that never terminate,
  double-spins (spin fired while `spinning` is true), `AudioContext` created
  outside a user gesture (browsers block it).

### Quality (flag when it clearly helps)

- **Reuse**: duplicated logic that should call an existing helper. Prefer
  reusing `RouletteMath`, `renderAll`, `save`/`load`, `beep` rather than new
  parallel implementations.
- **Simplification**: dead code, redundant branches, a loop that a single
  expression would express more clearly.
- **Readability**: a name that misleads, a magic number that needs a comment, a
  function doing three unrelated things.
- **Efficiency**: only when it matters here (e.g., rebuilding the whole DOM list
  every animation frame). Micro-optimizations that don't change UX aren't worth
  a finding.

## Project-specific notes (no build step)

This is a static site opened directly in the browser — there is no bundler, no
transpile, no `node_modules`. Keep that frame when reviewing:

- **No ES modules in the browser.** `index.html` loads plain `<script>` tags in
  order: `lib/pointer.js` then `script.js`. `lib/pointer.js` is a UMD module so
  the same file works as a browser global (`RouletteMath`) and a Node
  `require` (for tests). A change that switches it to `import`/`export` would
  break either the browser or the tests — flag it.
- **Script load order matters.** `script.js` depends on `RouletteMath` already
  being defined. Reordering or deferring the tags can break it.
- **Tooling is dependency-free** (`scripts/lint.mjs` = `node --check`,
  `scripts/build.mjs` = asset/reference checks, `tests/*.test.mjs` =
  `node:test`). A change that adds an npm dependency contradicts the project's
  zero-install design — call it out so it's a deliberate decision.
- **The pre-commit hook runs lint + build + test.** If a change would make any
  of those fail (e.g., renaming an asset without updating `index.html`'s
  reference, or breaking `pointerIndex`'s contract), say so explicitly.

## What NOT to flag

Keep the signal high. Skip:

- Pure style/formatting the project is consistent about (quote style, spacing).
- Hypotheticals with no realistic trigger in this app.
- "Could be a framework/TypeScript" suggestions — this project is intentionally
  vanilla, no-build.
- Restating that tests exist or that the code works; only report problems.

## Output format

Report findings as a ranked list, most severe first. If there are no real
problems, say so plainly — don't invent findings.

For each finding use:

```
### [severity] short title
- **File / line:** path:line
- **Problem:** what's wrong and the concrete failure it causes (inputs → result).
- **Fix:** the specific change to make.
```

Severity legend:
- **[blocker]** — wrong behavior, crash, or data loss; should not ship.
- **[major]** — real bug in an edge case, or quality issue that will cause future bugs.
- **[minor]** — worth fixing but safe to defer.

Close with a one-line verdict: is the change safe to commit, or does a blocker
need fixing first?

**Example finding:**

```
### [blocker] Winner computed independently of the wheel drawing
- **File / line:** script.js:142
- **Problem:** finishSpin() recomputes the index with `Math.floor(rotation / seg)`
  instead of `RouletteMath.pointerIndex(rotation, menus.length)`. It drops the
  POINTER_ANGLE offset and the modulo normalization, so for negative rotations
  the banner shows a different menu than the one under the pointer.
- **Fix:** call `pointerIndex()` (the shared helper) and use its result for both
  the banner and the history entry.
```
