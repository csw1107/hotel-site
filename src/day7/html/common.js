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

  // 2) 서브메뉴: 각 메뉴 아래 동적 렌더링 + 모바일 클릭 토글 바인딩
  initSubmenu();

  // 3) 맨 위로 버튼 — 항상 표시됨. show/hide 로직은 없음.
  const toTop = document.querySelector(".to-top");
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 4) 마우스 드래그로 가로 스크롤 — 재사용 가능한 함수로 각 요소에 적용
  initDragScroll(".rooms-row"); // ROOMS 섹션
  initDragScroll("#eventList"); // EVENT 섹션
});


/* ========== 서브메뉴 데이터 (객체로 관리) ==========
   각 상단 메뉴(data-menu) → 하위 항목 배열.
   text: 표시 문구, href: 이동 링크 */
const SUBMENU_DATA = {
  ABOUT: [
    { text: "호텔 소개", href: "#" },
    { text: "오시는길", href: "#" },
  ],
  ROOMS: [
    { text: "ROOM 1", href: "#" },
    { text: "ROOM 2", href: "#" },
    { text: "ROOM 3", href: "#" },
  ],
  RESERVATION: [
    { text: "예약 안내", href: "reservation1.html" },
    { text: "실시간 예약", href: "reservation2.html" },
  ],
  COMMUNITY: [
    { text: "공지사항", href: "#" },
    { text: "이벤트", href: "#" },
    { text: "FAQ", href: "#" },
  ],
};

// 모바일/데스크톱 분기 기준 (CSS 미디어쿼리 max-width: 1000px 와 동일)
// 주의: 이 값이 CSS보다 작으면(예: 768) 769~1000px 구간에서 CSS는 모바일
//       레이아웃인데 hover만 동작하고 클릭 토글은 안 되는 사각지대가 생김.
const SUBMENU_MOBILE_MAX = 1000;

// 서브메뉴 초기화:
// - 각 li 아래 .submenu 항목 미리 렌더링 (데스크톱 hover / 모바일 토글 공통)
// - 모바일(≤768px)에서만 클릭 토글 바인딩
function initSubmenu() {
  const items = document.querySelectorAll(".menu > li");
  if (!items.length) return;

  // 1) 각 메뉴 아래 서브메뉴 항목 렌더링
  items.forEach((item) => {
    const key = item.dataset.menu;
    if (!key || !SUBMENU_DATA[key]) return;
    const submenu = document.createElement("ul");
    submenu.className = "submenu";
    submenu.innerHTML = SUBMENU_DATA[key]
      .map((sub) => `<li><a href="${sub.href}">${sub.text}</a></li>`)
      .join("");
    item.appendChild(submenu);
  });

  // 2) 모바일에서만 클릭 토글 바인딩 (데스크톱은 CSS :hover 로 동작)
  //    - 클릭한 메뉴의 서브메뉴 open, 다시 클릭 시 닫힘
  //    - 다른 메뉴 클릭 시 이전은 닫히고 새 메뉴로 교체
  let currentOpen = null;
  items.forEach((item) => {
    item.querySelector(":scope > a").addEventListener("click", (e) => {
      // ★ href="#" 점프(페이지 상단 튀어오름)를 모든 폭에서 차단.
      //    반드시 데스크톱 조기 반환보다 앞서야 함 — 뒤에 있으면
      //    (분기점 ±, 미세폭)에서 점프가 살아남.
      e.preventDefault();
      if (window.innerWidth > SUBMENU_MOBILE_MAX) return; // 데스크톱이면 hover에 맡김
      const key = item.dataset.menu;
      if (currentOpen === item) {
        // 같은 메뉴 재클릭 → 닫기
        item.classList.remove("open");
        currentOpen = null;
      } else {
        // 다른 메뉴 → 이전 닫고 새로 열기
        items.forEach((it) => it.classList.remove("open"));
        item.classList.add("open");
        currentOpen = item;
      }
    });
  });
}

/* ========== 마우스 드래그로 가로 스크롤 (재사용 가능) ==========
   인자로 받은 CSS 선택자 요소에 드래그 스크롤을 적용.
   - 요소가 없으면(null) 조용히 종료
   - 드래그 중일 때 cursor가 grabbing으로 변하도록
     CSS의 .dragging 클래스와 짝을 맞춤 (CSS는 선택자 무관하게 동일)
   - 이미지 고스트 드래그 방지(dragstart preventDefault) 포함 */
function initDragScroll(selector) {
  const row = document.querySelector(selector);
  if (!row) return;

  let isDown = false;     // 마우스가 눌려 있는지
  let startX = 0;         // 드래그 시작 시점의 마우스 X좌표
  let scrollLeft = 0;     // 드래그 시작 시점의 가로 스크롤 위치

  // 드래그 시작
  row.addEventListener("mousedown", (e) => {
    isDown = true;
    row.classList.add("dragging");
    startX = e.pageX - row.offsetLeft;
    scrollLeft = row.scrollLeft;
  });

  // 이미지 드래그(고스트 이미지) 방지 — 요소 안의 이미지를 마우스로
  // 끌 때 브라우저 기본 동작이 뜨는 것을 차단
  row.addEventListener("dragstart", (e) => e.preventDefault());

  // 마우스가 영역을 벗어나거나 버튼을 놓으면 드래그 종료
  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    row.classList.remove("dragging");
  };
  row.addEventListener("mouseleave", endDrag);
  row.addEventListener("mouseup", endDrag);

  // 드래그 이동 — 누른 상태에서만 스크롤 이동량을 반영
  row.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - row.offsetLeft;
    const walk = x - startX; // 이동 거리(음수면 왼쪽으로 스크롤)
    row.scrollLeft = scrollLeft - walk;
  });
}

