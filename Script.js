(() => {
  'use strict';

  // 17. Product Data Array
  const products = [
    { id: 1, name: 'Mangueira PU 8mm Vermelha 100m', oldPrice: 189.90, price: 159.90, discount: 15, image: 'Assets/mangueira_vermelha.png', category: 'mangueiras' },
    { id: 2, name: 'Mangueira PU 8mm Amarela 100m', oldPrice: 189.90, price: 159.90, discount: 15, image: 'Assets/mangueira_amarela.png', category: 'mangueiras' },
    { id: 3, name: 'Mangueira PU 8mm Azul 100m', oldPrice: 189.90, price: 159.90, discount: 15, image: 'Assets/mangueira_azul.png', category: 'mangueiras' },
    { id: 4, name: 'Engate Rápido 1/4" NPT', oldPrice: 34.90, price: 27.90, discount: 20, image: 'Assets/engate_rapido.png', category: 'engates' },
    { id: 5, name: 'Válvula Solenoide 5/2 Vias', oldPrice: 289.00, price: 245.00, discount: 15, image: 'Assets/valvula_solenoide.png', category: 'valvulas' },
    { id: 6, name: 'União Instantânea 8mm (10un)', oldPrice: 49.90, price: 39.90, discount: 20, image: null, category: 'conexoes' },
    { id: 7, name: 'Filtro Regulador de Ar 1/2"', oldPrice: 129.90, price: 109.90, discount: 15, image: null, category: 'reguladores' },
    { id: 8, name: 'Cilindro Pneumático 32x100', oldPrice: 199.90, price: 169.90, discount: 15, image: null, category: 'cilindros' }
  ];

  // 18. Number Formatting
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // 15. Cart State Management
  const cart = {
    items: [],
    addItem(product) {
      const existingItem = this.items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }
      this.save();
      updateCartBadge();
    },
    removeItem(id) {
      this.items = this.items.filter(item => item.id !== id);
      this.save();
      updateCartBadge();
    },
    getTotal() {
      return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    getCount() {
      return this.items.reduce((count, item) => count + item.quantity, 0);
    },
    save() {
      localStorage.setItem('af_cart', JSON.stringify(this.items));
    },
    load() {
      this.items = JSON.parse(localStorage.getItem('af_cart')) || [];
      updateCartBadge();
    }
  };

  // 16. Wishlist State Management
  const wishlist = {
    items: [],
    toggleItem(productId) {
      const index = this.items.indexOf(productId);
      if (index > -1) {
        this.items.splice(index, 1);
        showToast('Produto removido dos favoritos!', 'info');
      } else {
        this.items.push(productId);
        showToast('Produto adicionado aos favoritos!', 'success');
      }
      this.save();
    },
    hasItem(productId) {
      return this.items.includes(productId);
    },
    save() {
      localStorage.setItem('af_wishlist', JSON.stringify(this.items));
    },
    load() {
      this.items = JSON.parse(localStorage.getItem('af_wishlist')) || [];
    }
  };

  // Utility: Update Cart Badge Count
  const updateCartBadge = () => {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = cart.getCount();
      badge.style.display = cart.getCount() > 0 ? 'inline-flex' : 'none';
    });
  };

  // 8. Toast Notifications
  const showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast p-4 rounded shadow-lg text-white transform transition-all duration-300 translate-y-full opacity-0 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-full', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // 13. WhatsApp Integration
  const setupWhatsAppLinks = () => {
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os produtos pneumáticos.');
    const waUrl = `https://wa.me/5592999999999?text=${message}`;
    document.querySelectorAll('.wa-link').forEach(link => {
      link.href = waUrl;
      link.target = '_blank';
    });
  };

  // 2. Header Scroll Effect
  const initHeaderScroll = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled', 'bg-white/95', 'shadow-md', 'backdrop-blur-sm');
      } else {
        header.classList.remove('scrolled', 'bg-white/95', 'shadow-md', 'backdrop-blur-sm');
      }
    }, { passive: true });
  };

  // 4. Mobile Menu
  const initMobileMenu = () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.menu-overlay');

    if (!mobileMenuBtn || !mobileMenu) return;

    const toggleMenu = () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        mobileMenu.classList.remove('open', 'translate-x-0');
        mobileMenu.classList.add('-translate-x-full');
        if(overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('open', 'translate-x-0');
        mobileMenu.classList.remove('-translate-x-full');
        if(overlay) overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Body scroll lock
      }
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) toggleMenu();
      });
    });
  };

  // 5. Search Overlay
  const initSearch = () => {
    const searchBtn = document.querySelector('.search-btn');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchCloseBtn = document.querySelector('.search-close-btn');
    const searchInput = document.querySelector('.search-input');

    if (!searchBtn || !searchOverlay) return;

    const openSearch = () => {
      searchOverlay.classList.remove('hidden');
      setTimeout(() => searchInput && searchInput.focus(), 100);
    };

    const closeSearch = () => {
      searchOverlay.classList.add('hidden');
    };

    searchBtn.addEventListener('click', openSearch);
    if(searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        console.log('Search filtering for:', e.target.value);
        // Simple search logic could be implemented here
      });
    }

    // 20. Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !searchOverlay.classList.contains('hidden')) {
        closeSearch();
      }
    });
  };

  // 9. Scroll Animations
  const initScrollAnimations = () => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  };

  // 10. Hero Parallax
  const initHeroParallax = () => {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      hero.style.backgroundPositionY = `${scrolled * 0.4}px`;
    }, { passive: true });
  };

  // 11. Product Card Hover Effects
  const initProductHoverEffects = () => {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const tiltX = (y - centerY) / 20;
        const tiltY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.3s ease';
      });
    });
  };

  // 14. Smooth Scroll for Anchor Links
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = document.querySelector('.header')?.offsetHeight || 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // Event Delegation for Products and Wishlist
  const initProductInteractions = () => {
    document.addEventListener('click', (e) => {
      // 6. Add to Cart
      const buyBtn = e.target.closest('.btn-comprar');
      if (buyBtn) {
        const card = buyBtn.closest('.product-card');
        if (card) {
          const productId = parseInt(card.dataset.id);
          const product = products.find(p => p.id === productId);
          if (product) {
            cart.addItem(product);
            showToast('Produto adicionado ao carrinho!');
            
            // Button animation
            buyBtn.classList.add('scale-95', 'bg-green-700');
            setTimeout(() => {
              buyBtn.classList.remove('scale-95', 'bg-green-700');
            }, 200);
          }
        }
      }

      // 7. Wishlist Toggle
      const wishBtn = e.target.closest('.btn-wishlist');
      if (wishBtn) {
        const card = wishBtn.closest('.product-card');
        if (card) {
          const productId = parseInt(card.dataset.id);
          wishlist.toggleItem(productId);
          
          // Toggle icon visually
          const icon = wishBtn.querySelector('i');
          if (icon) {
            if (wishlist.hasItem(productId)) {
              icon.setAttribute('data-lucide', 'heart');
              icon.classList.add('fill-red-500', 'text-red-500');
            } else {
              icon.setAttribute('data-lucide', 'heart');
              icon.classList.remove('fill-red-500', 'text-red-500');
            }
            if (window.lucide) window.lucide.createIcons();
          }
        }
      }
    });
  };

  // 19. Lazy Loading Images
  const initLazyLoading = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    }
  };

  // 1. DOM Content Loaded Init
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    cart.load();
    wishlist.load();

    // Initialize UI features
    initHeaderScroll();
    initMobileMenu();
    initSearch();
    initScrollAnimations();
    initHeroParallax();
    initProductHoverEffects();
    initSmoothScroll();
    initProductInteractions();
    setupWhatsAppLinks();
    initLazyLoading();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      console.warn('Lucide icons library not found.');
    }
  });

})();
