class MyHeader extends HTMLElement {
    connectedCallback() {
        // 큰 상자, 제목, 메뉴 상자 만들기
const header = document.createElement("header");
const h1 = document.createElement("h1");
h1.textContent = "내 포트폴리오";
const nav = document.createElement("nav");

// 링크 데이터 (배열)
const links = [
    { text: "소개", href: "./portfolio.html" },
    { text: "할 일", href: "./todo.html" },
];
// links를 하나씩 돌면서 <a> 링크 만들어 nav에 붙이기
links.forEach(function(link) {
    const a = document.createElement("a");
    a.textContent = link.text;   // 글자
    a.href = link.href;          // 이동할 주소
    nav.appendChild(a);
});

// 러시아 인형 조립: 안 → 밖
header.appendChild(h1);
header.appendChild(nav);
this.appendChild(header);   // 완성품을 "내 자리"에 붙임!
    }
}
customElements.define("my-header", MyHeader);