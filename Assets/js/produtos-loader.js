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

    function formatarPreco(valor) {
        return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
    }

    function cardHtml(p) {
        const temDesconto = p.preco_antigo && p.preco_antigo > p.preco;
        const badge = p.destaque
            ? '<span class="badge orange">Destaque</span>'
            : (temDesconto ? '<span class="badge red">Oferta</span>' : "");

        const imagem = p.imagem_url || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80";
        const linkProduto = `produto.html?id=${p.id}`;

        return `
            <article class="product-card" data-id="${p.id}" data-name="${escapeAttr(p.nome)}" data-price="${p.preco}">
                ${badge}
                <a href="${linkProduto}" class="product-img">
                    <img src="${imagem}" alt="${escapeAttr(p.nome)}" loading="lazy">
                </a>
                <div class="product-info">
                    <h3><a href="${linkProduto}" style="text-decoration:none; color:inherit;">${escapeHtml(p.nome)}</a></h3>
                    <p class="description">${escapeHtml(p.descricao || p.categoria || "")}</p>
                    <div class="price-row">
                        <span class="price">
                            ${temDesconto ? `<small style="display:block; text-decoration:line-through; color:var(--af-steel); font-weight:400; font-size:0.75rem;">${formatarPreco(p.preco_antigo)}</small>` : ""}
                            ${formatarPreco(p.preco)}
                        </span>
                        <button class="btn-add-cart" aria-label="Adicionar ao Carrinho">🛒 Comprar</button>
                    </div>
                </div>
            </article>
        `;
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    async function carregarGrid(grid) {
        const db = window.supabaseClient;
        if (!db) return;

        const source = grid.dataset.productsSource || "todos";
        const limite = parseInt(grid.dataset.productsLimit || "0", 10);

        let query = db.from("produtos").select("*").eq("ativo", true);

        if (source === "destaque") {
            query = query.eq("destaque", true);
        } else if (source === "ofertas") {
            query = query.not("preco_antigo", "is", null);
        } else if (source === "categoria") {
            const params = new URLSearchParams(window.location.search);
            const categoria = grid.dataset.productsCategoria || params.get("categoria");
            if (categoria) query = query.ilike("categoria", `%${categoria}%`);
        }

        query = query.order("criado_em", { ascending: false });
        if (limite) query = query.limit(limite);

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao carregar produtos:", error);
            return;
        }

        if (!data || !data.length) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--af-steel); padding:2rem 0;">Nenhum produto encontrado no momento.</p>`;
            return;
        }

        grid.innerHTML = data.map(cardHtml).join("");
        // O clique em ".btn-add-cart" já é tratado globalmente por
        // script.js via delegação de eventos — não precisa religar aqui.
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-products-source]").forEach(carregarGrid);
    });

})();
