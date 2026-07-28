/* ==========================================================
   AMAZONIA FORCE
   CARREGADOR PÚBLICO DE PRODUTOS (Supabase)
   Preenche qualquer grid marcado com [data-products-source]
   usando os produtos cadastrados no Painel Admin.

   Uso no HTML:
     <div class="products-grid"
          data-products-source="destaque"   |  "todos"  |  "ofertas"  |  "categoria"
          data-products-limit="8"           (opcional)
          data-products-categoria="Cilindros"  (só quando source="categoria";
                                                 se omitido, lê ?categoria= da URL)>
     </div>

   Requer supabase.js carregado antes deste arquivo.
========================================================== */

(function () {

    function cardHtml(p) {
        const badges = [];
        if (p.destaque) badges.push('<span class="badge orange">Destaque</span>');
        if (p.em_oferta) badges.push('<span class="badge red">Oferta</span>');
        const badgeHtml = badges.length ? `<div class="product-badges">${badges.join("")}</div>` : "";

        const imagem = p.imagem_url || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80";

        // O carregador roda tanto em index.html (raiz do site) quanto nas
        // páginas dentro de /Routes/ — o link do produto precisa refletir isso.
        const emRoutes = window.location.pathname.includes("/Routes/");
        const linkProduto = `${emRoutes ? "" : "Routes/"}produto.html?id=${p.id}`;

        return `
            <article class="product-card" data-id="${p.id}" data-name="${escapeAttr(p.nome)}">
                ${badgeHtml}
                <button
                    type="button"
                    class="card-favorite-btn"
                    data-produto-id="${p.id}"
                    aria-label="Adicionar aos favoritos"
                    title="Favoritar">🤍</button>
                <a href="${linkProduto}" class="product-img">
                    <img src="${imagem}" alt="${escapeAttr(p.nome)}" loading="lazy">
                </a>
                <div class="product-info">
                    <h3><a href="${linkProduto}" style="text-decoration:none; color:inherit;">${escapeHtml(p.nome)}</a></h3>
                    <p class="description">${escapeHtml(p.descricao || p.categoria || "")}</p>
                    <div class="price-row">
                        <span class="price price-consult">Consulte o valor com o vendedor</span>
                        <button class="btn-add-cart" aria-label="Adicionar à lista">🛒 Adicionar</button>
                    </div>
                </div>
            </article>
        `;
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    /* ---------------- ESTADO DOS FAVORITOS (❤ nos cards) ---------------- */
    // Carregado uma única vez por página e reaproveitado em toda grid
    // renderizada (Destaque, Ofertas, Categoria, Recomendados, etc.).
    let favoritosPromise = null;

    async function carregarFavoritosIds() {
        if (favoritosPromise) return favoritosPromise;

        favoritosPromise = (async () => {
            const db = window.supabaseClient;
            if (!db || !window.session) return new Set();

            const user = await window.session.user();
            if (!user) return new Set();

            const { data, error } = await db.from("favoritos").select("produto_id").eq("user_id", user.id);
            if (error || !data) return new Set();

            return new Set(data.map(f => f.produto_id));
        })();

        return favoritosPromise;
    }

    async function aplicarEstadoFavoritos(grid) {
        const botoes = grid.querySelectorAll(".card-favorite-btn");
        if (!botoes.length) return;

        const idsFavoritados = await carregarFavoritosIds();
        botoes.forEach(btn => marcarBotao(btn, idsFavoritados.has(btn.dataset.produtoId)));
    }

    function marcarBotao(btn, ativo) {
        btn.classList.toggle("active", ativo);
        btn.textContent = ativo ? "❤" : "🤍";
    }

    // Chamado por Assets/js/favoritos.js assim que o usuário curte/descurtir
    // um produto pelo coração do card, pra manter todos os cards do produto
    // (ele pode aparecer em mais de uma vitrine na mesma página) sincronizados.
    async function setFavoritoState(produtoId, ativo) {
        const ids = await carregarFavoritosIds();
        if (ativo) ids.add(produtoId); else ids.delete(produtoId);

        document.querySelectorAll(`.card-favorite-btn[data-produto-id="${produtoId}"]`)
            .forEach(btn => marcarBotao(btn, ativo));
    }

    /* ---------------- MONTAGEM DA GRID ---------------- */
    function montarGrid(grid, produtos) {
        if (!produtos || !produtos.length) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--af-steel); padding:2rem 0;">Nenhum produto encontrado com esses filtros.</p>`;
            return;
        }
        grid.innerHTML = produtos.map(cardHtml).join("");
        aplicarEstadoFavoritos(grid);
        // O clique em ".btn-add-cart" e ".card-favorite-btn" já é tratado
        // globalmente (cart.js / favoritos.js) por delegação de eventos —
        // não precisa religar nada aqui.
    }

    async function carregarGrid(grid) {
        const db = window.supabaseClient;
        if (!db) return;

        const source = grid.dataset.productsSource || "todos";
        const limite = parseInt(grid.dataset.productsLimit || "0", 10);

        let query = db.from("produtos").select("*").eq("ativo", true);

        if (source === "destaque") {
            query = query.eq("destaque", true);
        } else if (source === "ofertas") {
            query = query.eq("em_oferta", true);
        } else if (source === "categoria") {
            const params = new URLSearchParams(window.location.search);
            const categoria = grid.dataset.productsCategoria || params.get("categoria");
            if (categoria) query = query.ilike("categoria", `%${categoria}%`);
        }

        query = query.order("criado_em", { ascending: false });
        if (limite) query = query.limit(limite);

        let { data, error } = await query;

        // Proteção: se a coluna "em_oferta" ainda não existir no banco (migração
        // database/setup-variacoes-ofertas.sql pendente), refaz a busca de forma
        // simples em vez de deixar a seção completamente vazia.
        if (error && source === "ofertas") {
            console.error("Erro ao carregar ofertas (tentando modo compatível):", error);
            const fallback = await db.from("produtos").select("*").eq("ativo", true)
                .order("criado_em", { ascending: false })
                .limit(limite || 100);
            data = fallback.data;
            error = fallback.error;
        }

        if (error) {
            console.error("Erro ao carregar produtos:", error);
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--af-steel); padding:2rem 0;">Não foi possível carregar os produtos agora.</p>`;
            return;
        }

        let resultados = data || [];

        // Na página de produto, não faz sentido "produto relacionado" ser o próprio produto
        const params = new URLSearchParams(window.location.search);
        const idAtual = params.get("id");
        if (idAtual) resultados = resultados.filter(p => p.id !== idAtual);

        montarGrid(grid, resultados);
    }

    // Módulo reaproveitado por Assets/js/filtros.js e Assets/js/ofertas.js
    // (busca e filtros de produtos.html/categoria.html/ofertas.html) e por
    // Assets/js/favoritos.js (sincronização do coração entre cards).
    window.ProdutosLoader = { cardHtml, renderCards: montarGrid, setFavoritoState };

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-products-source]").forEach(carregarGrid);
    });

})();
