/* ==========================================================
   AMAZONIA FORCE
   FAVORITOS (❤) — botão do cabeçalho + coração nos cards de produto

   - Cabeçalho: mostra a contagem real de favoritos do usuário logado
     no badge ".favorite-count" e leva pra lista de favoritos ao clicar.
   - Cards de produto (".card-favorite-btn"): curte/descurte o produto
     direto na vitrine, sem precisar abrir a página do produto.
   - Expõe window.Favoritos.refresh() para que outras páginas
     (ex.: produto-detalhe.js, ao curtir/descurtir um produto)
     atualizem o contador do cabeçalho na hora, sem precisar recarregar.

   Requer: supabase.js e session.js carregados antes deste arquivo.
   O coração dos cards também usa window.ProdutosLoader (produtos-loader.js)
   quando presente, mas funciona mesmo sem ele.
========================================================== */

(function () {

    async function atualizarContador() {
        const db = window.supabaseClient;
        const btns = document.querySelectorAll(".favorite-btn");
        if (!btns.length || !db || !window.session) return;

        const user = await window.session.user();
        let total = 0;

        if (user) {
            const { count, error } = await db
                .from("favoritos")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id);

            if (!error) total = count || 0;
        }

        document.querySelectorAll(".favorite-count").forEach(el => { el.textContent = total; });
    }

    function linkFavoritos() {
        const emRoutes = window.location.pathname.includes("/Routes/");
        return `${emRoutes ? "" : "Routes/"}minha-conta.html#favorites`;
    }

    function linkLogin() {
        const emRoutes = window.location.pathname.includes("/Routes/");
        return `${emRoutes ? "" : "Routes/"}login.html`;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btns = document.querySelectorAll(".favorite-btn");
        if (!btns.length) return;

        btns.forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.preventDefault();

                const user = window.session ? await window.session.user() : null;

                if (!user) {
                    if (window.Toast) Toast.show("Faça login para ver seus favoritos.", "info");
                    try { localStorage.setItem("redirectAfterLogin", linkFavoritos()); } catch (err) { /* ignore */ }
                    setTimeout(() => { window.location.href = linkLogin(); }, 900);
                    return;
                }

                window.location.href = linkFavoritos();
            });
        });

        atualizarContador();
    });

    /* ---------------- CORAÇÃO NOS CARDS DE PRODUTO (grades/vitrines) ----------------
       Delegado no document porque os cards são recriados dinamicamente
       (produtos-loader.js / filtros.js / ofertas.js). */
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".card-favorite-btn");
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const db = window.supabaseClient;
        if (!db || !window.session) return;

        const produtoId = btn.dataset.produtoId;
        const user = await window.session.user();

        if (!user) {
            Toast.show("Faça login para favoritar produtos.", "info");
            try { localStorage.setItem("redirectAfterLogin", window.location.href); } catch (err) { /* ignore */ }
            setTimeout(() => { window.location.href = linkLogin(); }, 900);
            return;
        }

        const estavaAtivo = btn.classList.contains("active");
        btn.disabled = true;

        if (estavaAtivo) {
            const { error } = await db.from("favoritos").delete().eq("user_id", user.id).eq("produto_id", produtoId);
            if (!error) Toast.show("Removido dos favoritos.", "success");
        } else {
            const { error } = await db.from("favoritos").insert({ user_id: user.id, produto_id: produtoId });
            if (!error) Toast.show("Adicionado aos favoritos!", "success");
        }

        btn.disabled = false;

        if (window.ProdutosLoader) {
            window.ProdutosLoader.setFavoritoState(produtoId, !estavaAtivo);
        } else {
            btn.classList.toggle("active", !estavaAtivo);
            btn.textContent = !estavaAtivo ? "❤" : "🤍";
        }

        atualizarContador();
    });

    window.Favoritos = { refresh: atualizarContador };

})();
