/* =========================================================
   공통 스크립트 (모든 페이지에서 사용)
   1. 컴포넌트(header/footer/to-top) fetch로 삽입
   2. 모바일 메뉴 토글
   3. 맨 위로 버튼 클릭 (항상 표시, 스크롤 이벤트 없음)
   ========================================================= */

// 컴포넌트 하나를 placeholder에 fetch로 삽입
async function loadComponent(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + " 로드 실패");
    el.innerHTML = await res.text();
  } catch (e) {
    console.error(e);
  }
}

// DOM이 준비되면 컴포넌트 3개를 병렬로 불러온 뒤 동작 바인딩
window.addEventListener("DOMContentLoaded", async () => {
  // 1) 컴포넌트 삽입 (둘 다 끝나야 이후 바인딩이 안전함)
  await Promise.all([
    loadComponent("header-slot", "components/header.html"),
    loadComponent("footer-slot", "components/footer.html"),
    loadComponent("to-top-slot", "components/to-top.html"),
  ]);

  // 2) 모바일 메뉴 토글 (header 삽입 후 — 요소가 있어야 바인딩 가능)
  document.querySelectorAll(".menu > li").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 1000) {
        item.classList.toggle("active");
      }
    });
  });

  // 3) 맨 위로 버튼 — 항상 표시됨. show/hide 로직은 없음.
  const toTop = document.querySelector(".to-top");
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
