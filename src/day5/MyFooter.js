class MyFooter extends HTMLElement {
    connectedCallback() {
        const footer = document.createElement("footer");
        const p = document.createElement("p");
        p.textContent = "Copyright 2026 내 포트폴리오 All rights reserved.";
        footer.appendChild(p);
        this.appendChild(footer);
    }
}
customElements.define("my-footer", MyFooter);