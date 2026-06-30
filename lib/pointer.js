// 룰렛 기하 로직 (브라우저 전역 + Node require 양쪽에서 사용하는 UMD 모듈)
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RouletteMath = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TAU = Math.PI * 2;
  const POINTER_ANGLE = 1.5 * Math.PI; // 화면 상단(12시) 방향

  // 회전각(rotation)과 섹터 개수(n)에서 상단 포인터가 가리키는 섹터 인덱스.
  // 휠 그리기와 당첨 판정이 동일한 이 함수를 쓰므로 "포인터 = 결과"가 보장된다.
  function pointerIndex(rotation, n) {
    if (!n || n <= 0) return -1;
    const seg = TAU / n;
    const rel = (((POINTER_ANGLE - rotation) % TAU) + TAU) % TAU;
    return Math.floor(rel / seg) % n;
  }

  return { TAU, POINTER_ANGLE, pointerIndex };
});
