/* ==========================================================
   AMAZONIA FORCE
   FILTROS E BUSCA REAIS (produtos.html e categoria.html)

   As opções de categoria/marca são geradas a partir dos produtos
   que realmente existem no banco — nada de lista fixa desatualizada.

   Requer: supabase.js, produtos-loader.js carregados antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const grid = document.getElementById("productsGrid") || document.getElementById("categoryProducts");
    if (!grid || !window.ProdutosLoader) return;

    const db = window.supabaseClient;
    const isCategoriaPage = !!document.getElementById("categoryProducts");
    const params = new URLSearchParams(window.location.search);

    const catContainer = document.getElementById("filterCategorias");
    const marcaContainer = document.getElementById("filterMarcas");
    const priceGroup = document.getElementById("filterPrecoGroup");       // produtos.html (radios)
    const priceRange = document.getElementById("filterPriceRange");       // categoria.html (slider)
    const priceRangeValue = document.getElementById("filterPriceValue");
    const sortSelect = document.getElementById("sortProducts");
    const countEl = document.getElementById("productsCountNumber");
    const resetBtn = document.getElementById("filterReset");
    const searchInput = document.getElementById("searchInput");
    const categoryTitleEl = document.getElementById("categoryTitle");
    const categoryNameEl = document.getElementById("categoryName");

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    /* ---------------- TÍTULO DA CATEGORIA (dados reais, não texto fixo) ---------------- */
    if (isCategoriaPage) {
        const catParam = params.get("categoria");
        const titulo = catParam || "Todos os Produtos";
        if (categoryTitleEl) categoryTitleEl.textContent = titulo;
        if (categoryNameEl) categoryNameEl.textContent = titulo;
        document.title = `${titulo} | Amazônia Force`;
    }

    /* ---------------- MONTA OS FILTROS COM DADOS REAIS ---------------- */
    const { data: baseProdutos } = await db.from("produtos").select("categoria, marca").eq("ativo", true);
    const categoriasUnicas = [...new Set((baseProdutos || []).map(p => p.categoria).filter(Boolean))].sort();
    const marcasUnicas = [...new Set((baseProdutos || []).map(p => p.marca).filter(Boolean))].sort();

    function preencherFiltro(container, valores, comLi) {
        if (!container) return;
        if (!valores.length) {
            container.innerHTML = comLi
                ? '<li style="color:var(--af-steel); font-size:0.85rem; list-style:none;">Nenhuma opção disponível.</li>'
                : '<span style="color:var(--af-steel); font-size:0.85rem;">Nenhuma opção disponível.</span>';
            return;
        }
        container.innerHTML = valores.map(v => {
            const item = `<label><input type="checkbox" value="${escapeHtml(v)}"> ${escapeHtml(v)}</label>`;
            return comLi ? `<li>${item}</li>` : item;
        }).join("");
    }

    preencherFiltro(catContainer, categoriasUnicas, isCategoriaPage);
    preencherFiltro(marcaContainer, marcasUnicas, isCategoriaPage);

    // Na página de categoria, já marca a categoria atual (vinda da URL) como selecionada
    if (isCategoriaPage && catContainer) {
        const catParam = (params.get("categoria") || "").toLowerCase();
        if (catParam) {
            const alvo = [...catContainer.querySelectorAll('input[type="checkbox"]')]
                .find(cb => cb.value.toLowerCase() === catParam);
            if (alvo) alvo.checked = true;
        }
    }

    /* ---------------- BUSCA (barra do header) ---------------- */
    if (searchInput && params.get("busca")) searchInput.value = params.get("busca");

    /* ---------------- EVENTOS ---------------- */
    let debounce;
    function onFilterChange() { executarBusca(); }
    function onSearchInput() { clearTimeout(debounce); debounce = setTimeout(executarBusca, 350); }

    if (catContainer) catContainer.addEventListener("change", onFilterChange);
    if (marcaContainer) marcaContainer.addEventListener("change", onFilterChange);
    if (sortSelect) sortSelect.addEventListener("change", onFilterChange);
    if (priceGroup) priceGroup.addEventListener("change", onFilterChange);
    if (searchInput) searchInput.addEventListener("input", onSearchInput);

    if (priceRange) {
        const atualizarLabel = () => { if (priceRangeValue) priceRangeValue.textContent = `Até R$ ${priceRange.value}`; };
        atualizarLabel();
        priceRange.addEventListener("input", atualizarLabel);
        priceRange.addEventListener("change", onFilterChange);
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (catContainer) catContainer.querySelectorAll("input").forEach(i => i.checked = false);
            if (marcaContainer) marcaContainer.querySelectorAll("input").forEach(i => i.checked = false);
            if (priceGroup) priceGroup.querySelectorAll("input").forEach(i => i.checked = false);
            if (priceRange) { priceRange.value = priceRange.max; if (priceRangeValue) priceRangeValue.textContent = `Até R$ ${priceRange.value}`; }
            if (searchInput) searchInput.value = "";
            if (sortSelect) sortSelect.value = "recent";
            executarBusca();
        });
    }

    /* ---------------- EXECUTA A CONSULTA REAL NO SUPABASE ---------------- */
    async function executarBusca() {
        let query = db.from("produtos").select("*").eq("ativo", true);

        const categoriasSelecionadas = catContainer
            ? [...catContainer.querySelectorAll("input:checked")].map(i => i.value)
            : [];

        if (categoriasSelecionadas.length) {
            query = query.in("categoria", categoriasSelecionadas);
        } else if (isCategoriaPage && params.get("categoria")) {
            query = query.ilike("categoria", `%${params.get("categoria")}%`);
        }

        const marcasSelecionadas = marcaContainer
            ? [...marcaContainer.querySelectorAll("input:checked")].map(i => i.value)
            : [];
        if (marcasSelecionadas.length) query = query.in("marca", marcasSelecionadas);

        if (priceGroup) {
            const radio = priceGroup.querySelector("input:checked");
            if (radio) {
                query = query.gte("preco", Number(radio.dataset.min)).lte("preco", Number(radio.dataset.max));
            }
        }
        if (priceRange) {
            query = query.lte("preco", Number(priceRange.value));
        }

        const termo = searchInput ? searchInput.value.trim() : "";
        if (termo) {
            query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%`);
        }

        const sortVal = sortSelect ? sortSelect.value : "recent";
        if (sortVal === "low") query = query.order("preco", { ascending: true });
        else if (sortVal === "high") query = query.order("preco", { ascending: false });
        else if (sortVal === "name") query = query.order("nome", { ascending: true });
        else query = query.order("criado_em", { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao filtrar produtos:", error);
            return;
        }

        window.ProdutosLoader.renderCards(grid, data);
        if (countEl) countEl.textContent = (data || []).length;
    }

    executarBusca();

});
