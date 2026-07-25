/* ==========================================================
   AMAZONIA FORCE
   PROTEÇÃO DE ROTAS ADMINISTRATIVAS
   Inclua este script (depois de session.js) em páginas que só
   administradores podem acessar, ex.: admin-produtos.html.
========================================================== */

(async () => {

    const user = await window.session.user();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

    const isAdmin = !error && data && data.is_admin === true;

    if (!isAdmin) {
        window.location.href = "minha-conta.html";
    }

})();
