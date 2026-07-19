/*==================================================
AMAZONIA FORCE
SCRIPT.JS
==================================================*/

"use strict";

/*==================================================
ESTADO GLOBAL
==================================================*/

const App = {

    cart: [],

    favorites: [],

    products: [],

    currentSlide: 0

};

/*==================================================
ELEMENTOS
==================================================*/

const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);

/*==================================================
INIT
==================================================*/

document.addEventListener("DOMContentLoaded", init);

function init(){

    loadStorage();

    initLoader();

    loadProducts();

    initHeader();

    initMenu();

    initScroll();

    initBackToTop();

    updateCart();

    updateCartCount();

}

/*==================================================
LOADER
==================================================*/

function initLoader() {

    const loader = document.querySelector(".loader");

    if (!loader) return;

    setTimeout(() => {

        loader.classList.add("hide");

    }, 600);

}

/*==================================================
HEADER STICKY
==================================================*/

function initHeader(){

    const header = $("header");

    if(!header) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>80){

            header.classList.add("scrolled");

        }else{

            header.classList.remove("scrolled");

        }

    });

}

/*==================================================
MENU MOBILE
==================================================*/

function initMenu(){

    const toggle=$(".menu-toggle");

    const navbar=$(".navbar ul");

    if(!toggle || !navbar) return;

    toggle.addEventListener("click",()=>{

        navbar.classList.toggle("active");

        toggle.classList.toggle("active");

    });

}

/*==================================================
SCROLL SUAVE
==================================================*/

function initScroll(){

    document.querySelectorAll('a[href^="#"]').forEach(link=>{

        link.addEventListener("click",e=>{

            const target=document.querySelector(link.getAttribute("href"));

            if(!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior:"smooth",

                block:"start"

            });

        });

    });

}

/*==================================================
BOTÃO TOPO
==================================================*/

function initBackToTop(){

    const button=$("#backToTop");

    if(!button) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>500){

            button.classList.add("show");

        }else{

            button.classList.remove("show");

        }

    });

    button.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}

/*==================================================
LOCAL STORAGE
==================================================*/

function loadStorage(){

    App.cart=JSON.parse(

        localStorage.getItem("cart")

    ) || [];

    App.favorites=JSON.parse(

        localStorage.getItem("favorites")

    ) || [];

}

function saveStorage(){

    localStorage.setItem(

        "cart",

        JSON.stringify(App.cart)

    );

    localStorage.setItem(

        "favorites",

        JSON.stringify(App.favorites)

    );

}

/*==================================================
UTILS
==================================================*/

function currency(value){

    return value.toLocaleString(

        "pt-BR",

        {

            style:"currency",

            currency:"BRL"

        }

    );

}

function createID(){

    return Date.now()+Math.random();

}

function debounce(callback,delay=300){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(()=>{

            callback(...args);

        },delay);

    };

}

/*==================================================
HERO SLIDER
==================================================*/

let sliderInterval = null;

function initSlider() {

    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".hero-dot");
    const prev = document.querySelector(".slider-prev");
    const next = document.querySelector(".slider-next");
    const slider = document.querySelector(".hero-slider");

    if (!slides.length) return;

    App.currentSlide = 0;

    function showSlide(index) {

        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        slides.forEach(slide => {
            slide.classList.remove("active");
        });

        dots.forEach(dot => {
            dot.classList.remove("active");
        });

        slides[index].classList.add("active");

        if (dots[index]) {
            dots[index].classList.add("active");
        }

        App.currentSlide = index;

    }

    function nextSlide() {

        showSlide(App.currentSlide + 1);

    }

    function prevSlide() {

        showSlide(App.currentSlide - 1);

    }

    function startSlider() {

        stopSlider();

        sliderInterval = setInterval(() => {

            nextSlide();

        }, 5000);

    }

    function stopSlider() {

        clearInterval(sliderInterval);

    }

    if (next) {

        next.addEventListener("click", nextSlide);

    }

    if (prev) {

        prev.addEventListener("click", prevSlide);

    }

    dots.forEach((dot, index) => {

        dot.addEventListener("click", () => {

            showSlide(index);

        });

    });

    if (slider) {

        slider.addEventListener("mouseenter", stopSlider);

        slider.addEventListener("mouseleave", startSlider);

    }

    /* Swipe Mobile */

    let startX = 0;

    if (slider) {

        slider.addEventListener("touchstart", e => {

            startX = e.touches[0].clientX;

        });

        slider.addEventListener("touchend", e => {

            const endX = e.changedTouches[0].clientX;

            const distance = startX - endX;

            if (distance > 60) {

                nextSlide();

            }

            if (distance < -60) {

                prevSlide();

            }

        });

    }

    showSlide(0);

    startSlider();

}

/*==================================================
PRODUTOS
==================================================*/

async function loadProducts() {

    try {

        const response = await fetch("Assets/js/produtos.json");

        if (!response.ok) {

            throw new Error("Erro ao carregar produtos.");

        }

        App.products = await response.json();

        renderProducts(App.products);

    } catch (error) {

        console.error(error);

    }

}

/*==================================================
RENDER
==================================================*/

function renderProducts(products) {

    const grid = document.querySelector(".products-grid");

    if (!grid) return;

    grid.innerHTML = "";

    products.forEach(product => {

        grid.innerHTML += createProductCard(product);

    });

}

/*==================================================
CARD
==================================================*/

function createProductCard(product) {

    return `

<article class="product-card">

<div class="product-badge">

NOVO

</div>

<div class="product-discount">

-${product.desconto}%

</div>

<div class="product-image">

<img

src="${product.imagem}"

loading="lazy"

alt="${product.nome}">

<div class="product-actions">

<button

onclick="toggleFavorite(${product.id})">

❤

</button>

<button>

👁

</button>

</div>

</div>

<div class="product-info">

<span class="product-category">

${product.categoria}

</span>

<h3 class="product-title">

${product.nome}

</h3>

<div class="product-rating">

${renderStars(product.avaliacao)}

</div>

<div class="product-old-price">

${currency(product.precoAntigo)}

</div>

<div class="product-price">

${currency(product.preco)}

</div>

<div class="product-installments">

ou 10x de ${currency(product.preco/10)}

</div>

<button

class="btn-primary"

onclick="addToCart(${product.id})">

Adicionar ao Carrinho

</button>

</div>

</article>

`;

}

/*==================================================
ESTRELAS
==================================================*/

function renderStars(total) {

    let stars = "";

    for (let i = 0; i < total; i++) {

        stars += "★";

    }

    return stars;

}

/*==================================================
CARRINHO
==================================================*/

function addToCart(productId) {

    const product = App.products.find(p => p.id === productId);

    if (!product) return;

    const item = App.cart.find(p => p.id === productId);

    if (item) {

        item.quantity++;

    } else {

        App.cart.push({

            ...product,

            quantity: 1

        });

    }

    saveStorage();

    updateCartCount();

    updateCart();

    showToast("Produto adicionado ao carrinho!");

}

/*==================================================
REMOVER ITEM
==================================================*/

function removeFromCart(id) {

    App.cart = App.cart.filter(item => item.id !== id);

    saveStorage();

    updateCart();

    updateCartCount();

    showToast("Produto removido.");

}

/*==================================================
ALTERAR QUANTIDADE
==================================================*/

function changeQuantity(id, value) {

    const item = App.cart.find(p => p.id === id);

    if (!item) return;

    item.quantity += value;

    if (item.quantity <= 0) {

        removeFromCart(id);

        return;

    }

    saveStorage();

    updateCart();

    updateCartCount();

}

/*==================================================
ATUALIZA CARRINHO
==================================================*/

function updateCart() {

    const container = document.querySelector(".cart-items");

    const totalElement = document.querySelector(".cart-total");

    if (!container) return;

    container.innerHTML = "";

    let total = 0;

    App.cart.forEach(item => {

        total += item.preco * item.quantity;

        container.innerHTML += `

<div class="cart-item">

    <img src="${item.imagem}" alt="${item.nome}">

    <div class="cart-info">

        <h4>${item.nome}</h4>

        <small>${currency(item.preco)}</small>

        <div class="cart-qty">

            <button onclick="changeQuantity(${item.id},-1)">−</button>

            <span>${item.quantity}</span>

            <button onclick="changeQuantity(${item.id},1)">+</button>

        </div>

    </div>

    <button

        class="remove"

        onclick="removeFromCart(${item.id})">

        ×

    </button>

</div>

`;

    });

    if (totalElement) {

        totalElement.textContent = currency(total);

    }

}

/*==================================================
CONTADOR
==================================================*/

function updateCartCount() {

    const badge = document.querySelector(".cart-count");

    if (!badge) return;

    const quantity = App.cart.reduce(

        (total, item) => total + item.quantity,

        0

    );

    badge.textContent = quantity;

}

/*==================================================
LIMPAR
==================================================*/

function clearCart() {

    App.cart = [];

    saveStorage();

    updateCart();

    updateCartCount();

}

/*==================================================
ABRIR MINI CART
==================================================*/

function toggleCart() {

    const cart = document.querySelector(".mini-cart");

    if (!cart) return;

    cart.classList.toggle("active");

}

/*==================================================
FECHAR CLICANDO FORA
==================================================*/

document.addEventListener("click", function(e){

    const cart = document.querySelector(".mini-cart");

    const button = document.querySelector(".cart-btn");

    if(!cart || !button) return;

    if(

        !cart.contains(e.target)

        &&

        !button.contains(e.target)

    ){

        cart.classList.remove("active");

    }

});

