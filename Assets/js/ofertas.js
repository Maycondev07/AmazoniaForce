/* ==========================================================
   AMAZONIA FORCE
   PÁGINA DE OFERTAS — DADOS REAIS (Supabase)

   Substitui a antiga versão "vitrine" (contador fixo, filtros de
   desconto sem efeito, paginação decorativa) por uma página que:
   - Carrega somente produtos com em_oferta = true e ativo = true
   - Gera os filtros de Categoria/Marca a partir das ofertas reais
   - Ordena, busca e pagina os resultados de verdade

   Requer: supabase.js e produtos-loader.js (para ProdutosLoader e
   escapeHtml) carregados antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const grid = document.getElementById("offersGrid");
    if (!grid || !window.ProdutosLoader) return;

    const db = window.supabaseClient;
    if (!db) return;

    const PAGE_SIZE = 9;
    let paginaAtual = 1;

    const catContainer = document.getElementById("offerFilterCategorias");
    const marcaContainer = document.getElementById("offerFilterMarcas");
    const sortSelect = document.getElementById("offersSort");
    const countEl = document.getElementById("offersCountNumber");
    const activeCountEl = document.getElementById("offersActiveCount");
    const resetBtn = document.getElementById("offerFilterReset");
    const searchInput = document.getElementById("searchInput");
    const paginationEl = document.getElementById("offersPagination");

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    /* ---------------- CARREGA TODAS AS OFERTAS ATIVAS ---------------- */
    let { data: ofertas, error } = await db.from("produtos").select("*").eq("ativo", true).eq("em_oferta", true);

    if (error) {
        console.error("Erro ao carregar ofertas:", error);
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--af-steel); padding:2rem 0;">Não foi possível carregar as ofertas agora.</p>`;
        if (paginationEl) paginationEl.innerHTML = "";
        return;
    }

    ofertas = ofertas || [];
    if (activeCountEl) activeCountEl.textContent = ofertas.length;

    /* ---------------- MONTA OS FILTROS COM DADOS REAIS ---------------- */
    const categoriasUnicas = [...new Set(ofertas.map(p => p.categoria).filter(Boolean))].sort();
    const marcasUnicas = [...new Set(ofertas.map(p => p.marca).filter(Boolean))].sort();

    function preencherFiltro(container, valores) {
        if (!container) return;
        if (!valores.length) {
            container.innerHTML = '<span style="color:var(--af-steel); font-size:0.85rem;">Nenhuma opção disponível.</span>';
            return;
        }
        container.innerHTML = valores.map(v =>
            `<label><input type="checkbox" value="${escapeHtml(v)}"> ${escapeHtml(v)}</label>`
        ).join("");
    }

    preencherFiltro(catContainer, categoriasUnicas);
    preencherFiltro(marcaContainer, marcasUnicas);

    /* ---------------- BUSCA (barra do header) ---------------- */
    const params = new URLSearchParams(window.location.search);
    if (searchInput && params.get("busca")) searchInput.value = params.get("busca");

    /* ---------------- EVENTOS ---------------- */
    let debounce;
    function onFilterChange() { paginaAtual = 1; aplicarFiltros(); }
    function onSearchInput() { clearTimeout(debounce); debounce = setTimeout(onFilterChange, 350); }

    if (catContainer) catContainer.addEventListener("change", onFilterChange);
    if (marcaContainer) marcaContainer.addEventListener("change", onFilterChange);
    if (sortSelect) sortSelect.addEventListener("change", onFilterChange);
    if (searchInput) searchInput.addEventListener("input", onSearchInput);

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (catContainer) catContainer.querySelectorAll("input").forEach(i => i.checked = false);
            if (marcaContainer) marcaContainer.querySelectorAll("input").forEach(i => i.checked = false);
            if (searchInput) searchInput.value = "";
            if (sortSelect) sortSelect.value = "recent";
            paginaAtual = 1;
            aplicarFiltros();
        });
    }

    /* ---------------- FILTRA, ORDENA E PAGINA (em memória, sobre as ofertas reais) ---------------- */
    function aplicarFiltros() {
        let resultado = [...ofertas];

        const categoriasSelecionadas = catContainer
            ? [...catContainer.querySelectorAll("input:checked")].map(i => i.value)
            : [];
        if (categoriasSelecionadas.length) {
            resultado = resultado.filter(p => categoriasSelecionadas.includes(p.categoria));
        }

        const marcasSelecionadas = marcaContainer
            ? [...marcaContainer.querySelectorAll("input:checked")].map(i => i.value)
            : [];
        if (marcasSelecionadas.length) {
            resultado = resultado.filter(p => marcasSelecionadas.includes(p.marca));
        }

        const termo = searchInput ? searchInput.value.trim().toLowerCase() : "";
        if (termo) {
            resultado = resultado.filter(p =>
                (p.nome || "").toLowerCase().includes(termo) ||
                (p.descricao || "").toLowerCase().includes(termo)
            );
        }

        const sortVal = sortSelect ? sortSelect.value : "recent";
        if (sortVal === "name") {
            resultado.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        } else {
            resultado.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
        }

        if (countEl) countEl.textContent = resultado.length;

        const totalPaginas = Math.max(1, Math.ceil(resultado.length / PAGE_SIZE));
        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

        const inicio = (paginaAtual - 1) * PAGE_SIZE;
        const pagina = resultado.slice(inicio, inicio + PAGE_SIZE);

        window.ProdutosLoader.renderCards(grid, pagina);
        renderPaginacao(totalPaginas);
    }

    function renderPaginacao(totalPaginas) {
        if (!paginationEl) return;

        if (totalPaginas <= 1) {
            paginationEl.innerHTML = "";
            return;
        }

        let html = `<button ${paginaAtual === 1 ? "disabled" : ""} data-page="${paginaAtual - 1}">← Anterior</button>`;

        for (let i = 1; i <= totalPaginas; i++) {
            html += `<button class="${i === paginaAtual ? "active" : ""}" data-page="${i}">${i}</button>`;
        }

        html += `<button ${paginaAtual === totalPaginas ? "disabled" : ""} data-page="${paginaAtual + 1}">Próxima →</button>`;

        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll("button[data-page]").forEach(btn => {
            btn.addEventListener("click", () => {
                const alvo = parseInt(btn.dataset.page, 10);
                if (!alvo || alvo === paginaAtual) return;
                paginaAtual = alvo;
                aplicarFiltros();
                grid.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    aplicarFiltros();

});
