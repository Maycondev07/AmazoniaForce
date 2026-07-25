/* ==========================================================================
   AMAZONIA FORCE - SCRIPT GLOBAL DO SITE
   Usado por index.html e por todas as páginas em /Routes
   ========================================================================== */

/* ---- Funções globais chamadas via onclick="" nas páginas do site ---- */
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

function changeQty(id, delta) {
    if (window.__cartChangeQty) window.__cartChangeQty(id, delta);
}

function removeFromCart(id) {
    if (window.__cartRemove) window.__cartRemove(id);
}

document.addEventListener('DOMContentLoaded', () => {

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

    /* ---------------- HERO SLIDER ---------------- */
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

    /* ---------------- CARRINHO ---------------- */
    let cart = [];
    const cartItemsContainer = document.querySelector('.cart-items');

    // Delegação de eventos: funciona também para cards de produto
    // inseridos dinamicamente depois (ex.: produtos-loader.js)
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-add-cart');
        if (!button) return;

        const card = button.closest('.product-card');
        if (!card) return;

        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const img = card.querySelector('img');

        if (img) animateFlyToCart(img);
        addToCart(id, name, price);
    });

    function animateFlyToCart(imgElement) {
        const cartBtn = document.querySelector('.cart-btn');
        if (!cartBtn) return;

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

    function addToCart(id, name, price) {
        const item = cart.find(i => i.id === id);
        if (item) item.qty++;
        else cart.push({ id, name, price, qty: 1 });
        updateCartUI();
        showToast(`${name} adicionado ao carrinho!`);
    }

    function cartRemove(id) {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    }

    function cartChangeQty(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
        updateCartUI();
    }
    window.__cartChangeQty = cartChangeQty;
    window.__cartRemove = cartRemove;

    function updateCartUI() {
        const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
        const totalPrice = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
        const formattedTotal = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

        document.querySelectorAll('.cart-count, .favorite-count').forEach(el => {
            if (el.classList.contains('cart-count')) el.textContent = totalQty;
        });
        document.querySelectorAll('.cart-total, .cart-total-amount').forEach(el => {
            el.textContent = formattedTotal;
        });

        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = cart.length ? cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="changeQty('${item.id}', -1)" aria-label="Diminuir">-</button>
                    <span>${item.qty}</span>
                    <button class="btn-qty" onclick="changeQty('${item.id}', 1)" aria-label="Aumentar">+</button>
                </div>
            </div>
        `).join('') : `<p style="text-align:center; color:var(--af-steel); padding:2rem 0;">Seu carrinho está vazio.</p>`;
    }

    /* ---------------- BUSCA EM TEMPO REAL ---------------- */
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

    /* ---------------- NEWSLETTER ---------------- */
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Inscrição realizada com sucesso!');
            newsletterForm.reset();
        });
    }

    /* ---------------- TOAST ---------------- */
    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});