/* ==========================================================
   AMAZONIA FORCE — VERSÃO DEMO
   PROTEÇÃO DE ROTAS ADMINISTRATIVAS (genérica, local)
   Inclua este script (depois de session.js) em páginas que só
   administradores podem acessar, ex.: admin-produtos.html.
========================================================== */

(async () => {

    const user = await window.session.user();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (!user.is_admin) {
        window.location.href = "minha-conta.html";
    }

})();
