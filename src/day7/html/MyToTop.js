/* =========================================================
   <my-to-top> 커스텀 엘리먼트
   - components/to-top.html 의 마크업을 그대로 렌더링
   - 맨 위로 스크롤 클릭 이벤트 연결 (항상 표시, show/hide 로직 없음)
   (common.js 의 to-top click 바인딩을 이관)
   ========================================================= */

class MyToTop extends HTMLElement {
  connectedCallback() {
    // [가드] 이미 렌더링됐으면 중복 실행 방지
    if (this.querySelector(".to-top")) return;

    // components/to-top.html 내용 그대로
    this.innerHTML = `<button class="to-top"><i class="fa-solid fa-arrow-up"></i></button>`;

    // 맨 위로 버튼 — 항상 표시됨. show/hide 로직은 없음.
    const btn = this.querySelector(".to-top");
    if (btn) {
      btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }
}

// 중복 정의 방지 가드
if (!customElements.get("my-to-top")) {
  customElements.define("my-to-top", MyToTop);
}
