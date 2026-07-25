/* ==========================================================
   AMAZONIA FORCE
   PÁGINA DE PRODUTO — busca o produto real pelo ?id= da URL
   Requer: supabase.js, session.js, toast.js, cart.js carregados antes.
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const layout = document.getElementById("productLayout");
    const notFound = document.getElementById("productNotFound");
    const detailsSection = document.getElementById("productDetailsSection");

    if (!layout) return; // não estamos em produto.html

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    function esconderPagina() {
        layout.style.display = "none";
        if (detailsSection) detailsSection.style.display = "none";
        if (notFound) notFound.style.display = "block";
    }

    if (!id) {
        esconderPagina();
        return;
    }

    const db = window.supabaseClient;
    const { data: produto, error } = await db
        .from("produtos")
        .select("*")
        .eq("id", id)
        .eq("ativo", true)
        .maybeSingle();

    if (error || !produto) {
        esconderPagina();
        return;
    }

    /* ---------------- PREENCHER DADOS REAIS ---------------- */
    function formatarPreco(v) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    document.title = `${produto.nome} | Amazônia Force`;

    const breadcrumb = document.getElementById("breadcrumbProductName");
    if (breadcrumb) breadcrumb.textContent = produto.nome;

    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        mainImage.src = produto.imagem_url || "../Assets/img/logo.png";
        mainImage.alt = produto.nome;
    }

    const brandEl = document.getElementById("productBrand");
    if (brandEl) brandEl.textContent = produto.marca || produto.categoria || "";

    const titleEl = document.getElementById("productTitle");
    if (titleEl) titleEl.textContent = produto.nome;

    const codeEl = document.getElementById("productCode");
    if (codeEl) codeEl.textContent = produto.codigo ? `Código: ${produto.codigo}` : "";

    const stockEl = document.getElementById("productStock");
    const emEstoque = (produto.estoque ?? 0) > 0;
    if (stockEl) {
        stockEl.classList.toggle("in-stock", emEstoque);
        stockEl.classList.toggle("out-of-stock", !emEstoque);
        stockEl.textContent = emEstoque
            ? `✔ Em estoque (${produto.estoque} ${produto.estoque === 1 ? "unidade" : "unidades"})`
            : "✖ Produto indisponível no momento";
    }

    const oldPriceEl = document.getElementById("productOldPrice");
    if (oldPriceEl) {
        if (produto.preco_antigo && produto.preco_antigo > produto.preco) {
            oldPriceEl.textContent = formatarPreco(produto.preco_antigo);
            oldPriceEl.style.display = "block";
        } else {
            oldPriceEl.style.display = "none";
        }
    }

    const priceEl = document.getElementById("productPrice");
    if (priceEl) priceEl.textContent = formatarPreco(produto.preco);

    const installmentEl = document.getElementById("productInstallment");
    if (installmentEl && produto.preco >= 20) {
        installmentEl.textContent = `ou 10x de ${formatarPreco(produto.preco / 10)} sem juros`;
    }

    const descTexto = document.getElementById("descricaoTexto");
    if (descTexto) {
        descTexto.innerHTML = produto.descricao
            ? `<p>${escapeHtml(produto.descricao)}</p>`
            : `<p style="color:var(--af-steel);">Nenhuma descrição cadastrada para este produto.</p>`;
    }

    const specsBody = document.getElementById("specsTableBody");
    if (specsBody) {
        const linhas = [
            ["Marca", produto.marca],
            ["Categoria", produto.categoria],
            ["Código", produto.codigo],
            ["Estoque disponível", produto.estoque != null ? `${produto.estoque} unidades` : null],
        ].filter(([, valor]) => !!valor);

        specsBody.innerHTML = linhas.length
            ? linhas.map(([campo, valor]) => `<tr><td>${escapeHtml(campo)}</td><td>${escapeHtml(valor)}</td></tr>`).join("")
            : `<tr><td colspan="2" style="color:var(--af-steel);">Nenhuma especificação cadastrada.</td></tr>`;
    }

    /* ---------------- QUANTIDADE ---------------- */
    const qtyInput = document.getElementById("productQty");
    const qtyMinus = document.getElementById("qtyMinus");
    const qtyPlus = document.getElementById("qtyPlus");
    const maxQtd = produto.estoque > 0 ? produto.estoque : 99;

    if (qtyInput) qtyInput.max = maxQtd;

    function alterarQtd(delta) {
        if (!qtyInput) return;
        let val = parseInt(qtyInput.value || "1", 10) + delta;
        val = Math.max(1, Math.min(val, maxQtd));
        qtyInput.value = val;
    }
    if (qtyMinus) qtyMinus.addEventListener("click", () => alterarQtd(-1));
    if (qtyPlus) qtyPlus.addEventListener("click", () => alterarQtd(1));

    /* ---------------- COMPRAR ---------------- */
    const addCartBtn = document.getElementById("addCartBtn");
    const buyNowBtn = document.getElementById("buyNowBtn");

    if (!emEstoque) {
        if (addCartBtn) { addCartBtn.disabled = true; addCartBtn.textContent = "Indisponível"; }
        if (buyNowBtn) { buyNowBtn.disabled = true; buyNowBtn.textContent = "Indisponível"; }
    } else {
        if (addCartBtn) {
            addCartBtn.addEventListener("click", () => {
                const qtd = parseInt(qtyInput?.value || "1", 10);
                window.Cart.add(produto.id, qtd);
            });
        }
        if (buyNowBtn) {
            buyNowBtn.addEventListener("click", async () => {
                const qtd = parseInt(qtyInput?.value || "1", 10);
                await window.Cart.add(produto.id, qtd);
                window.location.href = "carrinho.html";
            });
        }
    }

    /* ---------------- FAVORITOS ---------------- */
    const favoriteBtn = document.getElementById("favoriteBtn");
    if (favoriteBtn) {
        let favoritado = false;

        const user = await window.session.user();
        if (user) {
            const { data: fav } = await db
                .from("favoritos")
                .select("id")
                .eq("user_id", user.id)
                .eq("produto_id", produto.id)
                .maybeSingle();
            favoritado = !!fav;
            atualizarBotaoFavorito();
        }

        function atualizarBotaoFavorito() {
            favoriteBtn.textContent = favoritado ? "❤ Remover dos Favoritos" : "🤍 Adicionar aos Favoritos";
        }

        favoriteBtn.addEventListener("click", async () => {
            const currentUser = await window.session.user();
            if (!currentUser) {
                Toast.show("Faça login para usar a lista de favoritos.", "info");
                try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (e) { /* ignore */ }
                setTimeout(() => { window.location.href = "login.html"; }, 900);
                return;
            }

            if (favoritado) {
                await db.from("favoritos").delete().eq("user_id", currentUser.id).eq("produto_id", produto.id);
                favoritado = false;
                Toast.show("Removido dos favoritos.", "success");
            } else {
                await db.from("favoritos").insert({ user_id: currentUser.id, produto_id: produto.id });
                favoritado = true;
                Toast.show("Adicionado aos favoritos!", "success");
            }
            atualizarBotaoFavorito();
        });
    }

    /* ---------------- COMPARTILHAR ---------------- */
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            const url = window.location.href;
            if (navigator.share) {
                try { await navigator.share({ title: produto.nome, url }); } catch (e) { /* usuário cancelou */ }
            } else {
                await navigator.clipboard.writeText(url);
                Toast.show("Link copiado!", "success");
            }
        });
    }

    /* ---------------- ABAS (Descrição / Especificações / Avaliações) ---------------- */
    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            const target = document.getElementById(btn.dataset.tab);
            if (target) target.classList.add("active");
        });
    });

});
