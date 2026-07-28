/* ==========================================================
   AMAZONIA FORCE
   CARRINHO REAL (persistente no Supabase, por usuário logado)
   Substitui o carrinho "de mentira" que existia antes em script.js.

   Requer, nesta ordem, antes deste arquivo:
     supabase.js, session.js

   Expõe window.Cart e as funções globais usadas via onclick="":
     changeQty(itemId, delta), removeFromCart(itemId)

   Cada linha do carrinho é identificada pelo seu próprio id (não mais
   pelo produto), porque agora um mesmo produto pode estar no carrinho
   mais de uma vez com variações diferentes (ex.: Bocal 1/2" e 1/4").
========================================================== */

(function () {

    const Cart = {
        items: [],        // [{ id, produto_id, variacao_id, quantidade, produtos: {...}, produto_variacoes: {...} }]
        user: null,
        loaded: false,
    };

    /* ---------------- CARREGAR CARRINHO ---------------- */
    async function load() {
        Cart.user = await window.session.user();

        if (!Cart.user) {
            Cart.items = [];
            Cart.loaded = true;
            render();
            return;
        }

        const { data, error } = await window.supabaseClient
            .from("carrinho_itens")
            .select("id, produto_id, variacao_id, quantidade, produtos(*), produto_variacoes(*)")
            .order("criado_em", { ascending: true });

        if (error) {
            console.error("Erro ao carregar carrinho:", error);
            Cart.items = [];
        } else {
            Cart.items = data || [];
        }

        Cart.loaded = true;
        render();
    }

    /* ---------------- AÇÕES ---------------- */
    async function add(produtoId, quantidade = 1, variacaoId = null) {
        Cart.user = Cart.user || await window.session.user();

        if (!Cart.user) {
            Toast.show("Faça login para adicionar produtos ao carrinho.", "info");
            try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (e) { /* ignore */ }
            const loginUrl = window.location.pathname.includes("/Routes/") ? "login.html" : "Routes/login.html";
            setTimeout(() => { window.location.href = loginUrl; }, 900);
            return;
        }

        variacaoId = variacaoId || null;

        const existente = Cart.items.find(
            i => i.produto_id === produtoId && (i.variacao_id || null) === variacaoId
        );

        if (existente) {
            const { error } = await window.supabaseClient
                .from("carrinho_itens")
                .update({ quantidade: existente.quantidade + quantidade })
                .eq("id", existente.id);
            if (error) { Toast.show("Erro ao atualizar carrinho.", "error"); return; }
        } else {
            const { error } = await window.supabaseClient
                .from("carrinho_itens")
                .insert({ user_id: Cart.user.id, produto_id: produtoId, variacao_id: variacaoId, quantidade });
            if (error) { Toast.show("Erro ao adicionar ao carrinho.", "error"); return; }
        }

        Toast.show("Produto adicionado ao carrinho!", "success");
        await load();
    }

    async function remove(itemId) {
        const item = Cart.items.find(i => i.id === itemId);
        if (!item) return;

        const { error } = await window.supabaseClient
            .from("carrinho_itens")
            .delete()
            .eq("id", item.id);

        if (error) { Toast.show("Erro ao remover item.", "error"); return; }
        await load();
    }

    async function changeQty(itemId, delta) {
        const item = Cart.items.find(i => i.id === itemId);
        if (!item) return;

        const novaQtd = item.quantidade + delta;

        if (novaQtd <= 0) {
            await remove(itemId);
            return;
        }

        const { error } = await window.supabaseClient
            .from("carrinho_itens")
            .update({ quantidade: novaQtd })
            .eq("id", item.id);

        if (error) { Toast.show("Erro ao atualizar quantidade.", "error"); return; }
        await load();
    }

    async function clear() {
        if (!Cart.user) return;
        await window.supabaseClient.from("carrinho_itens").delete().eq("user_id", Cart.user.id);
        await load();
    }

    function totals() {
        const totalQty = Cart.items.reduce((acc, i) => acc + i.quantidade, 0);
        return { totalQty };
    }

    /* ---------------- RENDERIZAÇÃO ---------------- */
    function render() {
        const { totalQty } = totals();

        document.querySelectorAll(".cart-count").forEach(el => { el.textContent = totalQty; });
        const subtotalEl = document.getElementById("subtotal");
        if (subtotalEl) subtotalEl.textContent = totalQty;

        renderMiniCart();
        renderPaginaCarrinho();
    }

    function renderMiniCart() {
        const container = document.querySelector(".mini-cart .cart-items");
        if (!container) return;

        if (!Cart.user) {
            container.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 1rem;">Faça login para ver seu carrinho.</p>`;
            return;
        }

        if (!Cart.items.length) {
            container.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 1rem;">Seu carrinho está vazio.</p>`;
            return;
        }

        container.innerHTML = Cart.items.map(i => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHtml(i.produtos?.nome || "Produto")}</h4>
                    ${i.produto_variacoes ? `<span class="cart-item-variacao">${escapeHtml(i.produto_variacoes.nome)}</span>` : ""}
                    <span class="price-consult">Consulte o valor com o vendedor</span>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="changeQty('${i.id}', -1)" aria-label="Diminuir">-</button>
                    <span>${i.quantidade}</span>
                    <button class="btn-qty" onclick="changeQty('${i.id}', 1)" aria-label="Aumentar">+</button>
                </div>
            </div>
        `).join("");
    }

    function renderPaginaCarrinho() {
        const table = document.querySelector(".cart-table");
        if (!table) return; // só existe em carrinho.html

        if (!Cart.user) {
            table.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 0;">Faça login para ver seu carrinho.</p>`;
            return;
        }

        if (!Cart.items.length) {
            table.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 0;">Seu carrinho está vazio. <a href="produtos.html" style="color:var(--af-blue);">Ver produtos →</a></p>`;
            return;
        }

        table.innerHTML = Cart.items.map(i => {
            const p = i.produtos || {};
            const v = i.produto_variacoes;
            return `
                <div class="cart-item" style="display:flex; align-items:center; gap:1rem; padding:1rem; border:1px solid var(--border-color); border-radius:10px;">
                    <img src="${p.imagem_url || v?.imagem_url || '../Assets/img/logo.png'}" alt="${escapeHtml(p.nome)}" style="width:70px; height:70px; object-fit:contain; border-radius:8px; background:var(--bg-dark); flex-shrink:0;">
                    <div style="flex:1; min-width:0;">
                        <h4 style="color:#fff; font-size:0.95rem; margin-bottom:0.3rem;">${escapeHtml(p.nome || "Produto")}</h4>
                        ${v ? `<span style="color:var(--af-steel); font-size:0.82rem;">Opção: ${escapeHtml(v.nome)}</span>` : ""}
                    </div>
                    <div class="cart-item-actions" style="display:flex; align-items:center; gap:0.6rem; border:1px solid var(--border-color); border-radius:8px; padding:0.2rem;">
                        <button class="btn-qty" onclick="changeQty('${i.id}', -1)" aria-label="Diminuir" style="width:28px; height:28px; border:none; background:none; color:#fff; cursor:pointer; font-size:1rem;">-</button>
                        <span style="min-width:20px; text-align:center; color:#fff;">${i.quantidade}</span>
                        <button class="btn-qty" onclick="changeQty('${i.id}', 1)" aria-label="Aumentar" style="width:28px; height:28px; border:none; background:none; color:#fff; cursor:pointer; font-size:1rem;">+</button>
                    </div>
                    <button onclick="removeFromCart('${i.id}')" aria-label="Remover" style="background:none; border:none; color:var(--af-red); cursor:pointer; font-size:1.2rem;">🗑</button>
                </div>
            `;
        }).join("");
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function animateFlyToCart(imgElement) {
        const cartBtn = document.querySelector('.cart-btn');
        if (!cartBtn || !imgElement) return;

        const imgRect = imgElement.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        const flyingImg = imgElement.cloneNode();
        flyingImg.classList.add('flying-img');
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        document.body.appendChild(flyingImg);

        requestAnimationFrame(() => {
            flyingImg.style.left = `${cartRect.left + 10}px`;
            flyingImg.style.top = `${cartRect.top + 10}px`;
            flyingImg.style.width = '20px';
            flyingImg.style.height = '20px';
            flyingImg.style.opacity = '0.4';
        });

        setTimeout(() => {
            flyingImg.remove();
            document.querySelectorAll('.cart-count').forEach(el => {
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 300);
            });
        }, 800);
    }

    /* ---------------- BOTÃO "COMPRAR" (delegação global) ---------------- */
    document.addEventListener("click", (e) => {
        const button = e.target.closest(".btn-add-cart");
        if (!button) return;

        const card = button.closest(".product-card");
        if (!card) return;

        const img = card.querySelector("img");
        if (img && Cart.user) animateFlyToCart(img);

        // Adição rápida pela vitrine: sem variação selecionada.
        // Produtos com variações obrigatórias devem ser comprados
        // pela página do produto, onde é possível escolher a opção.
        add(card.dataset.id, 1);
    });

    /* ---------------- FINALIZAR PEDIDO PELO WHATSAPP ---------------- */
    // Não há checkout/pagamento online: o cliente monta o carrinho aqui no
    // site e o valor é combinado direto com o vendedor pelo WhatsApp.
    const WHATSAPP_NUMERO = "5511970263943"; // Amazônia Force — inclui código do país (55) + DDD

    function montarMensagemPedido() {
        const linhas = Cart.items.map(i => {
            const nome = i.produtos?.nome || "Produto";
            const variacao = i.produto_variacoes?.nome ? ` (${i.produto_variacoes.nome})` : "";
            return `• ${i.quantidade}x ${nome}${variacao}`;
        });

        return [
            "Olá! Gostaria de solicitar um orçamento dos seguintes produtos na Amazônia Force:",
            "",
            ...linhas,
            "",
            "Poderiam me informar os valores e a disponibilidade?",
        ].join("\n");
    }

    async function finalizarPedidoWhatsApp() {
        Cart.user = Cart.user || await window.session.user();

        if (!Cart.user) {
            Toast.show("Faça login para solicitar seu orçamento.", "info");
            try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (e) { /* ignore */ }
            const loginUrl = window.location.pathname.includes("/Routes/") ? "login.html" : "Routes/login.html";
            setTimeout(() => { window.location.href = loginUrl; }, 900);
            return;
        }

        if (!Cart.items.length) {
            Toast.show("Seu carrinho está vazio.", "error");
            return;
        }

        const mensagem = montarMensagemPedido();
        const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank", "noopener");
    }

    // Intercepta qualquer botão/link "Solicitar Orçamento" (mini-carrinho, página
    // do carrinho) e o antigo botão do checkout, e manda direto para o
    // WhatsApp em vez de seguir para checkout.html.
    document.addEventListener("click", (e) => {
        const alvo = e.target.closest('a[href="checkout.html"], .checkout-button, [data-solicitar-orcamento]');
        if (!alvo) return;
        e.preventDefault();
        finalizarPedidoWhatsApp();
    });

    window.finalizarPedidoWhatsApp = finalizarPedidoWhatsApp;

    /* ---------------- EXPOSIÇÃO GLOBAL ---------------- */
    window.Cart = { load, add, remove, changeQty, clear, totals: () => totals() };
    window.changeQty = (id, delta) => changeQty(id, delta);
    window.removeFromCart = (id) => remove(id);

    document.addEventListener("DOMContentLoaded", load);

})();
