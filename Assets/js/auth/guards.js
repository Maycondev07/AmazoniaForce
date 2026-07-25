/* ==========================================================
   AMAZONIA FORCE
   PROTEÇÃO DE ROTAS
   Inclua este script em páginas que exigem login
   (ex.: minha-conta.html, checkout.html).
========================================================== */

(async () => {

    const logged = await window.session.logged();

    if (!logged) {
        window.location.href = "login.html";
    }

})();
