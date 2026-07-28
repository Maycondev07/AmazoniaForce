/* ==========================================================
   AMAZONIA FORCE
   BUSCA GLOBAL (barra de pesquisa do header, presente em todo o site)

   - Mostra sugestões reais (produtos) em um dropdown enquanto digita.
   - Em produtos.html / categoria.html, o Enter não navega: quem cuida
     da busca "ao vivo" na grade é o filtros.js.
   - Em qualquer outra página, o Enter (ou "Ver todos os resultados")
     manda para produtos.html?busca=termo.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");
    const resultsBox = document.getElementById("searchResults");
    if (!form || !input) return;

    const db = window.supabaseClient;
    const emCatalogo = document.getElementById("productsGrid") || document.getElementById("categoryProducts");
    const emRaiz = !window.location.pathname.includes("/Routes/");
    const prefixoRotas = emRaiz ? "Routes/" : "";   // pra linkar Routes/produto.html a partir da raiz
    const prefixoAssets = emRaiz ? "" : "../";      // pra linkar Assets/... a partir de dentro de Routes/

    // Pré-preenche se a página já foi aberta com ?busca=
    const params = new URLSearchParams(window.location.search);
    const buscaAtual = params.get("busca");
    if (buscaAtual) input.value = buscaAtual;

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function fecharResultados() {
        if (!resultsBox) return;
        resultsBox.classList.remove("active");
        resultsBox.innerHTML = "";
    }

    async function buscarSugestoes(termo) {
        if (!resultsBox || !db) return;

        const { data, error } = await db
            .from("produtos")
            .select("id, nome, categoria, imagem_url")
            .eq("ativo", true)
            .or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,categoria.ilike.%${termo}%`)
            .limit(6);

        if (error) { console.error("Erro na busca:", error); return; }

        if (!data || !data.length) {
            resultsBox.innerHTML = `<div class="search-results-empty">Nenhum produto encontrado para "${escapeHtml(termo)}".</div>`;
            resultsBox.classList.add("active");
            return;
        }

        const imgFallback = `${prefixoAssets}Assets/img/logo.png`;

        const itens = data.map(p => `
            <a class="search-results-item" href="${prefixoRotas}produto.html?id=${p.id}">
                <img src="${p.imagem_url || imgFallback}" alt="">
                <div>
                    <strong>${escapeHtml(p.nome)}</strong>
                    <span>${escapeHtml(p.categoria || "")}</span>
                </div>
            </a>
        `).join("");

        const linkTodos = `${prefixoRotas}produtos.html?busca=${encodeURIComponent(termo)}`;

        resultsBox.innerHTML = itens + `<a class="search-results-footer" href="${linkTodos}">Ver todos os resultados para "${escapeHtml(termo)}" →</a>`;
        resultsBox.classList.add("active");
    }

    let debounce;
    input.addEventListener("input", () => {
        clearTimeout(debounce);
        const termo = input.value.trim();

        if (termo.length < 2) {
            fecharResultados();
            return;
        }

        debounce = setTimeout(() => buscarSugestoes(termo), 300);
    });

    input.addEventListener("focus", () => {
        if (input.value.trim().length >= 2 && resultsBox && resultsBox.innerHTML) {
            resultsBox.classList.add("active");
        }
    });

    document.addEventListener("click", (e) => {
        if (!form.contains(e.target)) fecharResultados();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { fecharResultados(); input.blur(); }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const termo = input.value.trim();
        if (!termo) return;

        fecharResultados();

        if (emCatalogo) return; // filtros.js já filtra a grade ao digitar

        window.location.href = `${prefixoRotas}produtos.html?busca=${encodeURIComponent(termo)}`;
    });

});
