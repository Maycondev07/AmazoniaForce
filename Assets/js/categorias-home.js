/* ==========================================================
   AMAZONIA FORCE
   CATEGORIAS DA HOME (dados reais)

   Substitui os cards fixos de categoria da home pelas categorias
   que realmente existem em produtos ativos, usando como imagem
   do card a foto de um produto aleatório daquela categoria.

   Requer: supabase.js carregado antes deste arquivo.
   Se a consulta falhar ou não houver produtos, os cards fixos do
   HTML permanecem como estão (fallback).
========================================================== */

(function () {

    const FALLBACK_IMG = "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=300&q=80";
    const MAX_CATEGORIAS = 8;

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function escolherAleatorio(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    async function montarCategorias() {
        const grid = document.getElementById("categoriesGrid");
        const db = window.supabaseClient;
        if (!grid || !db) return;

        const { data, error } = await db
            .from("produtos")
            .select("categoria, imagem_url")
            .eq("ativo", true);

        if (error || !data || !data.length) {
            console.error("Não foi possível sincronizar as categorias da home:", error);
            return; // mantém os cards fixos do HTML como último recurso
        }

        const imagensPorCategoria = new Map();
        data.forEach(p => {
            if (!p.categoria) return;
            if (!imagensPorCategoria.has(p.categoria)) imagensPorCategoria.set(p.categoria, []);
            if (p.imagem_url) imagensPorCategoria.get(p.categoria).push(p.imagem_url);
        });

        const categorias = [...imagensPorCategoria.keys()].sort().slice(0, MAX_CATEGORIAS);
        if (!categorias.length) return;

        grid.innerHTML = categorias.map(categoria => {
            const imagens = imagensPorCategoria.get(categoria) || [];
            const imagem = imagens.length ? escolherAleatorio(imagens) : FALLBACK_IMG;
            return `
                <a href="Routes/categoria.html?categoria=${encodeURIComponent(categoria)}" class="category-card">
                    <img src="${imagem}" alt="${escapeHtml(categoria)}" loading="lazy">
                    <h3>${escapeHtml(categoria)}</h3>
                </a>
            `;
        }).join("");
    }

    document.addEventListener("DOMContentLoaded", montarCategorias);

})();
