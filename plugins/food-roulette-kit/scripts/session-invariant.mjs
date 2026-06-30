// food-roulette-kit 플러그인 · 훅 3/3 — SessionStart
// 세션이 시작될 때 이 앱의 핵심 불변식을 컨텍스트로 한 번 상기시킨다.
// (SessionStart 훅의 stdout은 세션 컨텍스트로 추가된다)
process.stdout.write(
  [
    "🎡 food-roulette 핵심 불변식 (휠/당첨 관련 코드 수정 전 확인):",
    "• 상단 포인터 아래 섹터 == 발표된 당첨 메뉴. 둘 다 RouletteMath.pointerIndex(rotation, n) 하나로만 계산한다.",
    "• 별도 Math.floor(rotation/seg) 등으로 당첨을 다시 구하지 말 것 — 시각과 결과가 조용히 어긋난다.",
    "• 상태 변경 후엔 항상 re-render(renderAll/drawWheel/renderHistory) + persist(save→localStorage).",
    "• 빌드 없음: index.html이 lib/pointer.js → script.js 순서로 로드. pointer.js는 UMD(브라우저 전역 + Node require) 유지.",
  ].join("\n") + "\n"
);
process.exit(0);
