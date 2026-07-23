document.addEventListener('DOMContentLoaded', () => {
    // LOADER
    const loader = document.querySelector('.loader');
    setTimeout(() => loader.classList.add('hide'), 400);

    // HEADER SCROLL E BACK TO TOP
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            backToTop.classList.add('show');
        } else {
            header.classList.remove('scrolled');
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // HERO SLIDER
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.hero-dot');
    let currentSlide = 0;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    document.querySelector('.slider-next').addEventListener('click', () => goToSlide(currentSlide + 1));
    document.querySelector('.slider-prev').addEventListener('click', () => goToSlide(currentSlide - 1));
    setInterval(() => goToSlide(currentSlide + 1), 5000);

    // CARRINHO INTERATIVO & ANIMAÇÃO FLY-TO-CART
    let cart = [];
    const miniCart = document.getElementById('miniCart');
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    document.getElementById('openCartBtn').addEventListener('click', () => miniCart.classList.add('active'));
    document.getElementById('closeCartBtn').addEventListener('click', () => miniCart.classList.remove('active'));

    document.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = card.dataset.id;
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);

            // Animação Fly-To-Cart
            animateFlyToCart(card.querySelector('img'));

            addToCart(id, name, price);
        });
    });

    function animateFlyToCart(imgElement) {
        const imgRect = imgElement.getBoundingClientRect();
        const cartBtnRect = document.getElementById('openCartBtn').getBoundingClientRect();

        const flyingImg = imgElement.cloneNode();
        flyingImg.classList.add('flying-img');
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;

        document.body.appendChild(flyingImg);

        setTimeout(() => {
            flyingImg.style.left = `${cartBtnRect.left + 10}px`;
            flyingImg.style.top = `${cartBtnRect.top + 10}px`;
            flyingImg.style.width = '20px';
            flyingImg.style.height = '20px';
            flyingImg.style.opacity = '0.4';
        }, 10);

        setTimeout(() => {
            flyingImg.remove();
            cartCount.classList.add('bump');
            setTimeout(() => cartCount.classList.remove('bump'), 300);
        }, 800);
    }

    function addToCart(id, name, price) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty++;
        } else {
            cart.push({ id, name, price, qty: 1 });
        }
        updateCartUI();
        showToast(`${name} adicionado ao carrinho!`);
    }

    function updateCartUI() {
        const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
        const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

        cartCount.textContent = totalQty;
        cartTotal.textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong>
                    <div>R$ ${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <span>x${item.qty}</span>
                </div>
            </div>
        `).join('');
    }

    // BUSCA EM TEMPO REAL
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = title.includes(term) ? 'flex' : 'none';
        });
    });

    // TOAST NOTIFICATION
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});