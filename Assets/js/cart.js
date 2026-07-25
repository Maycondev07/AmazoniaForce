/* ==========================================================
   AMAZONIA FORCE
   CARRINHO REAL (persistente no Supabase, por usuário logado)
   Substitui o carrinho "de mentira" que existia antes em script.js.

   Requer, nesta ordem, antes deste arquivo:
     supabase.js, session.js

   Expõe window.Cart e as funções globais usadas via onclick="":
     changeQty(id, delta), removeFromCart(id)
========================================================== */

(function () {

    const Cart = {
        items: [],        // [{ id, produto_id, quantidade, produtos: {...} }]
        user: null,
        loaded: false,
    };

    function formatarPreco(valor) {
        return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
    }

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
            .select("id, produto_id, quantidade, produtos(*)")
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
    async function add(produtoId, quantidade = 1) {
        Cart.user = Cart.user || await window.session.user();

        if (!Cart.user) {
            Toast.show("Faça login para adicionar produtos ao carrinho.", "info");
            try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (e) { /* ignore */ }
            const loginUrl = window.location.pathname.includes("/Routes/") ? "login.html" : "Routes/login.html";
            setTimeout(() => { window.location.href = loginUrl; }, 900);
            return;
        }

        const existente = Cart.items.find(i => i.produto_id === produtoId);

        if (existente) {
            const { error } = await window.supabaseClient
                .from("carrinho_itens")
                .update({ quantidade: existente.quantidade + quantidade })
                .eq("id", existente.id);
            if (error) { Toast.show("Erro ao atualizar carrinho.", "error"); return; }
        } else {
            const { error } = await window.supabaseClient
                .from("carrinho_itens")
                .insert({ user_id: Cart.user.id, produto_id: produtoId, quantidade });
            if (error) { Toast.show("Erro ao adicionar ao carrinho.", "error"); return; }
        }

        Toast.show("Produto adicionado ao carrinho!", "success");
        await load();
    }

    async function remove(produtoId) {
        const item = Cart.items.find(i => i.produto_id === produtoId);
        if (!item) return;

        const { error } = await window.supabaseClient
            .from("carrinho_itens")
            .delete()
            .eq("id", item.id);

        if (error) { Toast.show("Erro ao remover item.", "error"); return; }
        await load();
    }

    async function changeQty(produtoId, delta) {
        const item = Cart.items.find(i => i.produto_id === produtoId);
        if (!item) return;

        const novaQtd = item.quantidade + delta;

        if (novaQtd <= 0) {
            await remove(produtoId);
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
        const subtotal = Cart.items.reduce((acc, i) => acc + (Number(i.produtos?.preco || 0) * i.quantidade), 0);
        const totalQty = Cart.items.reduce((acc, i) => acc + i.quantidade, 0);
        return { subtotal, totalQty };
    }

    /* ---------------- RENDERIZAÇÃO ---------------- */
    function render() {
        const { subtotal, totalQty } = totals();

        document.querySelectorAll(".cart-count").forEach(el => { el.textContent = totalQty; });
        document.querySelectorAll(".cart-total, .cart-total-amount").forEach(el => { el.textContent = formatarPreco(subtotal); });

        renderMiniCart();
        renderPaginaCarrinho(subtotal);
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
                    <span>${formatarPreco(i.produtos?.preco)}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="changeQty('${i.produto_id}', -1)" aria-label="Diminuir">-</button>
                    <span>${i.quantidade}</span>
                    <button class="btn-qty" onclick="changeQty('${i.produto_id}', 1)" aria-label="Aumentar">+</button>
                </div>
            </div>
        `).join("");
    }

    function renderPaginaCarrinho(subtotal) {
        const table = document.querySelector(".cart-table");
        if (!table) return; // só existe em carrinho.html

        const subtotalEl = document.getElementById("subtotal");
        const totalEl = document.getElementById("total");

        if (!Cart.user) {
            table.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 0;">Faça login para ver seu carrinho.</p>`;
            if (subtotalEl) subtotalEl.textContent = formatarPreco(0);
            if (totalEl) totalEl.textContent = formatarPreco(0);
            return;
        }

        if (!Cart.items.length) {
            table.innerHTML = `<p style="text-align:center; color:var(--af-steel); padding:2rem 0;">Seu carrinho está vazio. <a href="produtos.html" style="color:var(--af-blue);">Ver produtos →</a></p>`;
            if (subtotalEl) subtotalEl.textContent = formatarPreco(0);
            if (totalEl) totalEl.textContent = formatarPreco(0);
            return;
        }

        table.innerHTML = Cart.items.map(i => {
            const p = i.produtos || {};
            const itemTotal = Number(p.preco || 0) * i.quantidade;
            return `
                <div class="cart-item" style="display:flex; align-items:center; gap:1rem; padding:1rem; border:1px solid var(--border-color); border-radius:10px;">
                    <img src="${p.imagem_url || '../Assets/img/logo.png'}" alt="${escapeHtml(p.nome)}" style="width:70px; height:70px; object-fit:contain; border-radius:8px; background:var(--bg-dark); flex-shrink:0;">
                    <div style="flex:1; min-width:0;">
                        <h4 style="color:#fff; font-size:0.95rem; margin-bottom:0.3rem;">${escapeHtml(p.nome || "Produto")}</h4>
                        <span style="color:var(--af-steel); font-size:0.85rem;">${formatarPreco(p.preco)} cada</span>
                    </div>
                    <div class="cart-item-actions" style="display:flex; align-items:center; gap:0.6rem; border:1px solid var(--border-color); border-radius:8px; padding:0.2rem;">
                        <button class="btn-qty" onclick="changeQty('${i.produto_id}', -1)" aria-label="Diminuir" style="width:28px; height:28px; border:none; background:none; color:#fff; cursor:pointer; font-size:1rem;">-</button>
                        <span style="min-width:20px; text-align:center; color:#fff;">${i.quantidade}</span>
                        <button class="btn-qty" onclick="changeQty('${i.produto_id}', 1)" aria-label="Aumentar" style="width:28px; height:28px; border:none; background:none; color:#fff; cursor:pointer; font-size:1rem;">+</button>
                    </div>
                    <strong style="color:var(--af-yellow); min-width:90px; text-align:right;">${formatarPreco(itemTotal)}</strong>
                    <button onclick="removeFromCart('${i.produto_id}')" aria-label="Remover" style="background:none; border:none; color:var(--af-red); cursor:pointer; font-size:1.2rem;">🗑</button>
                </div>
            `;
        }).join("");

        if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);
        atualizarTotalComExtras();
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

        add(card.dataset.id, 1);
    });

    /* ---------------- FRETE (estimativa) ---------------- */
    // Não há integração com transportadora — é uma regra simples e transparente:
    // frete grátis acima de R$300, senão um valor fixo por região do CEP.
    let freteAtual = 0;
    let cupomAtual = null; // { codigo, percentual }

    async function calcularFrete() {
        const input = document.getElementById("shippingZip");
        const shippingEl = document.getElementById("shipping");
        if (!input || !shippingEl) return;

        const cep = input.value.replace(/\D/g, "");
        if (cep.length !== 8) {
            Toast.show("Digite um CEP válido (8 dígitos).", "error");
            return;
        }

        const { subtotal } = totals();
        if (subtotal >= 300) {
            freteAtual = 0;
            shippingEl.textContent = "Grátis";
        } else {
            // Estimativa simples por região (1º dígito do CEP), não é uma tarifa real de transportadora
            const regiao = parseInt(cep[0], 10);
            const tabela = [28, 24, 22, 26, 30, 32, 27, 20, 25, 29];
            freteAtual = tabela[regiao] ?? 25;
            shippingEl.textContent = formatarPreco(freteAtual);
        }

        Toast.show("Frete calculado.", "success");
        atualizarTotalComExtras();
    }

    /* ---------------- CUPOM ---------------- */
    async function aplicarCupom() {
        const input = document.getElementById("coupon");
        if (!input || !input.value.trim()) {
            Toast.show("Digite um cupom.", "error");
            return;
        }

        const codigo = input.value.trim().toUpperCase();

        const { data, error } = await window.supabaseClient
            .from("cupons")
            .select("*")
            .eq("codigo", codigo)
            .eq("ativo", true)
            .maybeSingle();

        if (error || !data) {
            Toast.show("Cupom inválido ou expirado.", "error");
            cupomAtual = null;
            return;
        }

        if (data.validade && new Date(data.validade) < new Date()) {
            Toast.show("Este cupom expirou.", "error");
            cupomAtual = null;
            return;
        }

        cupomAtual = { codigo: data.codigo, percentual: Number(data.percentual) };
        Toast.show(`Cupom aplicado: ${data.percentual}% de desconto!`, "success");
        atualizarTotalComExtras();
    }

    function atualizarTotalComExtras() {
        const totalEl = document.getElementById("total");
        if (!totalEl) return;
        const { subtotal } = totals();
        let total = subtotal + freteAtual;
        if (cupomAtual) total -= total * (cupomAtual.percentual / 100);
        totalEl.textContent = formatarPreco(Math.max(total, 0));
    }

    window.calculateShipping = calcularFrete;
    window.applyCoupon = aplicarCupom;
    window.updateCart = () => load();

    /* ---------------- EXPOSIÇÃO GLOBAL ---------------- */
    window.Cart = { load, add, remove, changeQty, clear, totals: () => totals() };
    window.changeQty = (id, delta) => changeQty(id, delta);
    window.removeFromCart = (id) => remove(id);

    document.addEventListener("DOMContentLoaded", load);

})();
