// 룰렛 핵심 로직 테스트: 포인터가 가리키는 섹터 = 당첨 섹터 보장 (node:test, 무의존)
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { pointerIndex, POINTER_ANGLE, TAU } = require("../lib/pointer.js");

test("후보 0개면 -1을 반환", () => {
  assert.equal(pointerIndex(0, 0), -1);
  assert.equal(pointerIndex(1.23, 0), -1);
});

test("회전 0, n=4면 상단 포인터는 인덱스 3", () => {
  // rel = 1.5π, seg = 0.5π → floor(3) = 3
  assert.equal(pointerIndex(0, 4), 3);
});

test("각 섹터 중심으로 회전시키면 그 섹터가 당첨된다 (라운드트립)", () => {
  for (const n of [2, 3, 5, 8, 12]) {
    const seg = TAU / n;
    for (let i = 0; i < n; i++) {
      const rotation = POINTER_ANGLE - (i * seg + seg / 2);
      assert.equal(pointerIndex(rotation, n), i, `n=${n}, i=${i}`);
    }
  }
});

test("여러 바퀴(양수/음수 큰 회전)에도 동일 결과", () => {
  const n = 6;
  const seg = TAU / n;
  for (let i = 0; i < n; i++) {
    const base = POINTER_ANGLE - (i * seg + seg / 2);
    assert.equal(pointerIndex(base + TAU * 5, n), i, `+5바퀴 i=${i}`);
    assert.equal(pointerIndex(base - TAU * 3, n), i, `-3바퀴 i=${i}`);
  }
});

test("반환 인덱스는 항상 [0, n) 범위", () => {
  const n = 7;
  for (let r = -20; r <= 20; r += 0.37) {
    const idx = pointerIndex(r, n);
    assert.ok(idx >= 0 && idx < n, `rotation=${r} → ${idx}`);
  }
});
