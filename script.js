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