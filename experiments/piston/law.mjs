export const law = `<section class="first-law" aria-labelledby="law-title">
  <div class="law-heading"><div><span class="eyebrow">에너지 보존</span><h2 id="law-title">열역학 제1법칙</h2></div><p>계는 실린더 안의 기체입니다.<br>열과 일은 계의 경계를 통해 에너지를 전달합니다.</p></div>
  <div class="law-equation" aria-label="기체가 받은 열은 내부 에너지 변화와 기체가 한 일의 합">
    <div class="law-term"><strong>Q</strong><span>기체가 받은 열</span><output id="law-Q">0.0 J</output></div>
    <span class="law-operator" aria-hidden="true">=</span>
    <div class="law-term"><strong>ΔU</strong><span>내부 에너지 변화</span><output id="law-U">0.0 J</output></div>
    <span class="law-operator" aria-hidden="true">+</span>
    <div class="law-term"><strong>W</strong><span>기체가 한 일</span><output id="law-W">0.0 J</output></div>
  </div>
  <div class="law-reading"><strong>ΔU = Q − W</strong><p id="law-story">실험을 선택하고 에너지의 이동을 확인하세요.</p></div>
  <div class="law-cases" aria-label="제1법칙 비교 실험"><button data-case="expand">1 · 팽창하며 가열</button><button data-case="fixed">2 · 고정하고 가열</button><button data-case="cool">3 · 냉각하며 압축</button></div>
  <p class="law-signs">Q: 열을 받으면 +, 내보내면 − · W: 기체가 일을 하면 +, 외부로부터 일을 받으면 −<br>ΔU는 내부 에너지의 변화량입니다. 열 Q나 일 W가 기체 안에 저장되는 양을 뜻하지는 않습니다.</p>
</section>`;
