/* =========================================================
   <my-header> 커스텀 엘리먼트
   - components/header.html 의 마크업을 그대로 렌더링
   - 서브메뉴(.submenu) 동적 렌더링 + 모바일 클릭 토글
   (common.js 의 loadComponent / initSubmenu 로직을 이관)
   ========================================================= */

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

class MyHeader extends HTMLElement {
  connectedCallback() {
    // [가드] 이미 렌더링됐으면 중복 실행 방지
    if (this.querySelector("header")) return;

    // [1단계: 마크업 생성] components/header.html 내용 그대로
    this.innerHTML = `
      <header>
        <h1 class="logo"><a href="HOME.html">H</a></h1>
        <nav>
          <ul class="menu">
            <li data-menu="ABOUT"><a href="#">ABOUT</a></li>
            <li data-menu="ROOMS"><a href="#">ROOMS</a></li>
            <li data-menu="RESERVATION"><a href="#">RESERVATION</a></li>
            <li data-menu="COMMUNITY"><a href="#">COMMUNITY</a></li>
          </ul>
        </nav>
        <!-- 서브메뉴(.submenu)는 아래 _renderSubmenu 가 각 li 아래에 동적으로 삽입.
             데스크톱은 CSS :hover, 모바일은 클릭 토글로 동작. -->
      </header>
    `;

    // [2단계: 서브메뉴 렌더링] 각 li 아래 .submenu 항목 생성
    this._renderSubmenu();

    // [3단계: 모바일 클릭 토글 바인딩]
    this._bindMobileToggle();
  }

  // 각 메뉴 아래 서브메뉴 항목 미리 렌더링 (데스크톱 hover / 모바일 토글 공통)
  _renderSubmenu() {
    const items = this.querySelectorAll(".menu > li");
    if (!items.length) return;

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
  }

  // 모바일(≤1000px)에서만 클릭 토글 바인딩 (데스크톱은 CSS :hover 로 동작)
  // - 클릭한 메뉴의 서브메뉴 open, 다시 클릭 시 닫힘
  // - 다른 메뉴 클릭 시 이전은 닫히고 새 메뉴로 교체
  _bindMobileToggle() {
    const items = this.querySelectorAll(".menu > li");
    if (!items.length) return;

    this._currentOpen = null; // 단일 열림 추적 (인스턴스 필드)
    items.forEach((item) => {
      item.querySelector(":scope > a").addEventListener("click", (e) => {
        // ★ href="#" 점프(페이지 상단 튀어오름)를 모든 폭에서 차단.
        //    반드시 데스크톱 조기 반환보다 앞서야 함 — 뒤에 있으면
        //    (분기점 ±, 미세폭)에서 점프가 살아남.
        e.preventDefault();
        if (window.innerWidth > SUBMENU_MOBILE_MAX) return; // 데스크톱이면 hover에 맡김
        if (this._currentOpen === item) {
          // 같은 메뉴 재클릭 → 닫기
          item.classList.remove("open");
          this._currentOpen = null;
        } else {
          // 다른 메뉴 → 이전 닫고 새로 열기
          items.forEach((it) => it.classList.remove("open"));
          item.classList.add("open");
          this._currentOpen = item;
        }
      });
    });
  }
}

// 중복 정의 방지 가드
if (!customElements.get("my-header")) {
  customElements.define("my-header", MyHeader);
}
