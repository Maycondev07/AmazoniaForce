/* ==========================================================================
   AMAZONIA FORCE - SCRIPT GLOBAL DO SITE
   Atende tanto a Home (index.html) quanto as Páginas de Produtos / Rotas
   ========================================================================== */

/* ---- Funções globais chamadas via atributos HTML (ex: onclick="") ---- */
function toggleCart() {
    const miniCart = document.querySelector('.mini-cart');
    if (miniCart) miniCart.classList.toggle('active');
}

function closeLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('active');
}

function openLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.add('active');
}

document.addEventListener('DOMContentLoaded', async () => {

    /* ==========================================================================
       1. RECURSOS COMUNS / LAYOUT GLOBAL
       ========================================================================== */

    /* ---------------- LOADER ---------------- */
    const loader = document.querySelector('.loader');
    if (loader) setTimeout(() => loader.classList.add('hide'), 400);

    /* ---------------- HEADER SCROLL + BACK TO TOP ---------------- */
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 50;
        if (header) header.classList.toggle('scrolled', scrolled);
        if (backToTop) backToTop.classList.toggle('show', scrolled);
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------------- MENU MOBILE ---------------- */
    const menuToggle = document.querySelector('.menu-toggle');
    const navbarList = document.querySelector('.navbar > .container > ul');
    if (menuToggle && navbarList) {
        menuToggle.addEventListener('click', () => {
            navbarList.classList.toggle('mobile-open');
        });
    }

    /* ---------------- HERO SLIDER (HOME) ---------------- */
    const slides = document.querySelectorAll('.hero-slider .slide');
    const dots = document.querySelectorAll('.hero-dot');
    let currentSlide = 0;
    let sliderInterval;

    function goToSlide(index) {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function startAutoSlide() {
        clearInterval(sliderInterval);
        if (slides.length > 1) {
            sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
        }
    }

    if (slides.length) {
        const nextBtn = document.querySelector('.slider-next');
        const prevBtn = document.querySelector('.slider-prev');
        if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); startAutoSlide(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); startAutoSlide(); });
        dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); startAutoSlide(); }));
        startAutoSlide();
    }

    /* ---------------- CARROSSEL DE PRODUTOS + SELETORES 1 2 3 4 (HOME) ---------------- */
    const productsContainer = document.getElementById('productsGrid');
    const prevBtn = document.getElementById('productPrevBtn');
    const nextBtn = document.getElementById('productNextBtn');
    const paginationContainer = document.getElementById('productsPagination');

    if (productsContainer) {
        let productTimer = null;
        let currentIndex = 0;

        function getCards() {
            return productsContainer.querySelectorAll('.product-card');
        }

        function renderPagination() {
            if (!paginationContainer) return;
            const cards = getCards();
            paginationContainer.innerHTML = '';

            if (cards.length <= 1) return;

            cards.forEach((_, index) => {
                const pageBtn = document.createElement('button');
                pageBtn.classList.add('pagination-btn');
                pageBtn.textContent = index + 1;
                if (index === currentIndex) pageBtn.classList.add('active');

                pageBtn.addEventListener('click', () => {
                    scrollToProduct(index);
                    startAutoProductScroll();
                });

                paginationContainer.appendChild(pageBtn);
            });
        }

        function highlightActiveCard() {
            const cards = getCards();
            if (!cards.length) return;

            cards.forEach((card, index) => {
                card.classList.toggle('active-product', index === currentIndex);
            });

            if (paginationContainer) {
                const buttons = paginationContainer.querySelectorAll('.pagination-btn');
                buttons.forEach((btn, index) => {
                    btn.classList.toggle('active', index === currentIndex);
                });
            }
        }

        function scrollToProduct(index) {
            const cards = getCards();
            if (!cards.length) return;

            if (index >= cards.length) {
                currentIndex = 0;
            } else if (index < 0) {
                currentIndex = cards.length - 1;
            } else {
                currentIndex = index;
            }

            const targetCard = cards[currentIndex];
            const scrollLeftPos = targetCard.offsetLeft - (productsContainer.clientWidth / 2) + (targetCard.clientWidth / 2);

            productsContainer.scrollTo({
                left: scrollLeftPos,
                behavior: 'smooth'
            });

            highlightActiveCard();
        }

        function nextProduct() { scrollToProduct(currentIndex + 1); }
        function prevProduct() { scrollToProduct(currentIndex - 1); }

        function startAutoProductScroll() {
            stopAutoProductScroll();
            productTimer = setInterval(nextProduct, 5000);
        }

        function stopAutoProductScroll() {
            if (productTimer) clearInterval(productTimer);
        }

        if (nextBtn) nextBtn.addEventListener('click', () => { nextProduct(); startAutoProductScroll(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { prevProduct(); startAutoProductScroll(); });

        productsContainer.addEventListener('mouseenter', stopAutoProductScroll);
        productsContainer.addEventListener('mouseleave', startAutoProductScroll);

        const observer = new MutationObserver(() => {
            const cards = getCards();
            if (cards.length > 0) {
                renderPagination();
                scrollToProduct(0);
                startAutoProductScroll();
            }
        });

        observer.observe(productsContainer, { childList: true });
    }

    /* ---------------- BUSCA EM TEMPO REAL E NEWSLETTER ---------------- */
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.product-card').forEach(card => {
                const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
                card.style.display = title.includes(term) ? '' : 'none';
            });
        });
    }

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Inscrição realizada com sucesso!');
            newsletterForm.reset();
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }


    /* ==========================================================================
       2. PÁGINA DE DETALHES DO PRODUTO (produto.html)
       Carrega via ?id= na URL e sincroniza variacoes, estoque, carrinho e favoritos
       ========================================================================== */
    const layout = document.getElementById("productLayout");
    const notFound = document.getElementById("productNotFound");
    const detailsSection = document.getElementById("productDetailsSection");

    if (layout) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");

        function esconderPagina() {
            layout.style.display = "none";
            if (detailsSection) detailsSection.style.display = "none";
            if (notFound) notFound.style.display = "block";
        }

        if (!id || !window.supabaseClient) {
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
        function escapeHtml(str) {
            return String(str || "").replace(/[&<>"']/g, m => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            }[m]));
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

        const priceEl = document.getElementById("productPrice");
        if (priceEl) priceEl.textContent = "💬 Consulte o valor com o vendedor";

        /* ---------------- VARIAÇÕES ---------------- */
        const { data: variacoes } = await db
            .from("produto_variacoes")
            .select("*")
            .eq("produto_id", produto.id)
            .order("ordem", { ascending: true });

        let variacaoSelecionada = null;
        const temVariacoes = !!(variacoes && variacoes.length);

        const variationsWrap = document.getElementById("productVariations");
        const variationOptions = document.getElementById("variationOptions");

        const qtyInput = document.getElementById("productQty");
        const addCartBtn = document.getElementById("addCartBtn");
        const buyNowBtn = document.getElementById("buyNowBtn");

        function atualizarExibicaoPreco() {
            const estoqueAtual = variacaoSelecionada ? (variacaoSelecionada.estoque ?? 0) : (produto.estoque ?? 0);
            if (stockEl) {
                const disponivel = estoqueAtual > 0;
                stockEl.classList.toggle("in-stock", disponivel);
                stockEl.classList.toggle("out-of-stock", !disponivel);
                stockEl.textContent = disponivel
                    ? `✔ Em estoque (${estoqueAtual} ${estoqueAtual === 1 ? "unidade" : "unidades"})`
                    : "✖ Produto indisponível no momento";
            }

            if (qtyInput) qtyInput.max = estoqueAtual > 0 ? estoqueAtual : 99;
            atualizarBotoesCompra();
        }

        if (temVariacoes && variationsWrap && variationOptions) {
            variationsWrap.style.display = "block";

            variationOptions.innerHTML = variacoes.map(v => `
                <button type="button" class="variation-option" data-variacao-id="${v.id}">
                    ${escapeHtml(v.nome)}
                </button>
            `).join("");

            variationOptions.querySelectorAll(".variation-option").forEach(btn => {
                btn.addEventListener("click", () => {
                    variacaoSelecionada = variacoes.find(v => v.id === btn.dataset.variacaoId) || null;

                    variationOptions.querySelectorAll(".variation-option").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");

                    atualizarExibicaoPreco();
                });
            });
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
        function atualizarBotoesCompra() {
            const estoqueAtual = variacaoSelecionada ? (variacaoSelecionada.estoque ?? 0) : (produto.estoque ?? 0);
            const semEstoqueNaSelecao = !emEstoque || (temVariacoes && !!variacaoSelecionada && estoqueAtual <= 0);

            [addCartBtn, buyNowBtn].forEach(btn => {
                if (!btn) return;
                btn.disabled = semEstoqueNaSelecao;
                btn.textContent = semEstoqueNaSelecao
                    ? "Indisponível"
                    : (btn === addCartBtn ? "Adicionar ao Carrinho" : "Comprar Agora");
            });
        }

        function validarSelecaoVariacao() {
            if (temVariacoes && !variacaoSelecionada) {
                if (window.Toast) window.Toast.show("Selecione uma opção antes de continuar.", "error");
                return false;
            }
            return true;
        }

        if (!emEstoque) {
            if (addCartBtn) { addCartBtn.disabled = true; addCartBtn.textContent = "Indisponível"; }
            if (buyNowBtn) { buyNowBtn.disabled = true; buyNowBtn.textContent = "Indisponível"; }
        } else {
            if (addCartBtn) {
                addCartBtn.addEventListener("click", () => {
                    if (!validarSelecaoVariacao()) return;
                    const qtd = parseInt(qtyInput?.value || "1", 10);
                    if (window.Cart) window.Cart.add(produto.id, qtd, variacaoSelecionada?.id || null);
                });
            }
            if (buyNowBtn) {
                buyNowBtn.addEventListener("click", async () => {
                    if (!validarSelecaoVariacao()) return;
                    const qtd = parseInt(qtyInput?.value || "1", 10);
                    if (window.Cart) await window.Cart.add(produto.id, qtd, variacaoSelecionada?.id || null);
                    window.location.href = "carrinho.html";
                });
            }
        }

        /* ---------------- FAVORITOS ---------------- */
        const favoriteBtn = document.getElementById("favoriteBtn");
        if (favoriteBtn) {
            let favoritado = false;

            const user = window.session ? await window.session.user() : null;
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
                const currentUser = window.session ? await window.session.user() : null;
                if (!currentUser) {
                    if (window.Toast) window.Toast.show("Faça login para usar a lista de favoritos.", "info");
                    try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (e) { }
                    setTimeout(() => { window.location.href = "login.html"; }, 900);
                    return;
                }

                if (favoritado) {
                    await db.from("favoritos").delete().eq("user_id", currentUser.id).eq("produto_id", produto.id);
                    favoritado = false;
                    if (window.Toast) window.Toast.show("Removido dos favoritos.", "success");
                } else {
                    await db.from("favoritos").insert({ user_id: currentUser.id, produto_id: produto.id });
                    favoritado = true;
                    if (window.Toast) window.Toast.show("Adicionado aos favoritos!", "success");
                }
                atualizarBotaoFavorito();
                if (window.Favoritos) window.Favoritos.refresh();
            });
        }

        /* ---------------- COMPARTILHAR ---------------- */
        const shareBtn = document.getElementById("shareBtn");
        if (shareBtn) {
            shareBtn.addEventListener("click", async () => {
                const url = window.location.href;
                if (navigator.share) {
                    try { await navigator.share({ title: produto.nome, url }); } catch (e) { }
                } else {
                    await navigator.clipboard.writeText(url);
                    if (window.Toast) window.Toast.show("Link copiado!", "success");
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
    }

});