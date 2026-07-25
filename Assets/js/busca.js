/* ==========================================================
   AMAZONIA FORCE
   BUSCA GLOBAL (barra de pesquisa do header, presente em todo o site)

   - Em produtos.html / categoria.html: quem faz a busca de verdade é
     filtros.js (busca ao vivo, sem sair da página).
   - Em qualquer outra página: envia pra produtos.html?busca=termo
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");
    if (!form || !input) return;

    const emCatalogo = document.getElementById("productsGrid") || document.getElementById("categoryProducts");
    if (emCatalogo) return; // filtros.js cuida da busca aqui

    // Pré-preenche se a página já foi aberta com ?busca=
    const params = new URLSearchParams(window.location.search);
    const buscaAtual = params.get("busca");
    if (buscaAtual) input.value = buscaAtual;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const termo = input.value.trim();
        const destino = window.location.pathname.includes("/Routes/") ? "produtos.html" : "Routes/produtos.html";
        window.location.href = termo ? `${destino}?busca=${encodeURIComponent(termo)}` : destino;
    });

});
