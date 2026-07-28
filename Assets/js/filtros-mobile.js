/* ==========================================================
   AMAZONIA FORCE
   GAVETA DE FILTROS NO MOBILE
   Usado em produtos.html, categoria.html e ofertas.html.
   No desktop os filtros continuam fixos do lado; no mobile
   viram uma gaveta que abre por cima do conteúdo (sem empurrar
   os produtos pra baixo).
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".filters, .category-sidebar, .offers-sidebar");
    const toggleBtn = document.querySelector(".filters-toggle-btn");
    const closeBtn = document.querySelector(".filters-close-btn");
    if (!sidebar || !toggleBtn) return;

    const backdrop = document.createElement("div");
    backdrop.className = "filters-backdrop";
    document.body.appendChild(backdrop);

    function abrir() {
        sidebar.classList.add("mobile-open");
        backdrop.classList.add("active");
        document.body.classList.add("no-scroll");
    }

    function fechar() {
        sidebar.classList.remove("mobile-open");
        backdrop.classList.remove("active");
        document.body.classList.remove("no-scroll");
    }

    toggleBtn.addEventListener("click", abrir);
    if (closeBtn) closeBtn.addEventListener("click", fechar);
    backdrop.addEventListener("click", fechar);

    // Fecha automaticamente a gaveta ao aplicar um filtro, pra já ver o resultado
    sidebar.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        input.addEventListener("change", () => {
            if (window.innerWidth <= 768) fechar();
        });
    });

    const resetBtn = sidebar.querySelector(".filter-reset");
    if (resetBtn) resetBtn.addEventListener("click", fechar);
});
