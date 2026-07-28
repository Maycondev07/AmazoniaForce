/* ==========================================================
   AMAZONIA FORCE
   BARRA DE NAVEGAÇÃO INFERIOR (mobile)
   - Marca a aba ativa de acordo com a página atual.
   - Botão "Buscar" abre a busca do cabeçalho (#searchForm) como
     um painel no topo da tela, reaproveitando a lógica já existente
     em Assets/js/busca.js — não duplica nada, só mostra/esconde.
   - Botão "Conta" muda para "Minha Conta" quando logado (mesma
     regra usada no botão do cabeçalho, ver Assets/js/auth/ui.js).
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const nav = document.querySelector(".mobile-bottom-nav");
    if (!nav) return;

    /* ---------------- ABA ATIVA ---------------- */
    const path = window.location.pathname;
    let ativo = "home";
    if (path.includes("categoria.html")) ativo = "categorias";
    else if (path.includes("carrinho.html")) ativo = "carrinho";
    else if (path.includes("minha-conta.html") || path.includes("login.html")) ativo = "conta";
    else if (!path.endsWith("index.html") && path.includes("/Routes/")) ativo = "";

    const item = nav.querySelector(`[data-nav="${ativo}"]`);
    if (item) item.classList.add("active");

    /* ---------------- BOTÃO BUSCAR ---------------- */
    const searchToggle = nav.querySelector('[data-nav="buscar"]');
    const searchArea = document.querySelector(".search-area");
    const searchInput = document.getElementById("searchInput");

    if (searchToggle && searchArea) {
        searchToggle.addEventListener("click", () => {
            const abrindo = !searchArea.classList.contains("mobile-active");
            searchArea.classList.toggle("mobile-active", abrindo);
            searchToggle.classList.toggle("active", abrindo);
            if (abrindo && searchInput) setTimeout(() => searchInput.focus(), 150);
        });

        // Fecha ao clicar fora do painel de busca (mas não no próprio botão que abre)
        document.addEventListener("click", (e) => {
            if (!searchArea.classList.contains("mobile-active")) return;
            if (searchArea.contains(e.target) || searchToggle.contains(e.target)) return;
            searchArea.classList.remove("mobile-active");
            searchToggle.classList.remove("active");
        });

        searchArea.addEventListener("submit", () => {
            searchArea.classList.remove("mobile-active");
            searchToggle.classList.remove("active");
        });
    }

});
