/* ==========================================================
   AMAZONIA FORCE
   CATÁLOGOS — carrega os catálogos reais cadastrados no Painel Admin
   Requer: supabase.js carregado antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const grid = document.getElementById("catalogosGrid");
    if (!grid) return; // não estamos em catalogos.html

    const db = window.supabaseClient;
    const countEl = document.getElementById("catalogosCountNumber");
    const vazioEl = document.getElementById("catalogosVazio");

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function formatarTamanho(kb) {
        if (!kb) return "";
        if (kb < 1024) return `${kb} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    }

    function cardHtml(c) {
        const tamanho = formatarTamanho(c.tamanho_kb);
        return `
            <article class="catalogo-card">
                <div class="catalogo-capa">
                    ${c.capa_url
                        ? `<img src="${c.capa_url}" alt="Capa do catálogo ${escapeHtml(c.titulo)}" loading="lazy">`
                        : `<span class="catalogo-capa-fallback">📄</span>`}
                </div>
                <div class="catalogo-info">
                    ${c.marca ? `<span class="catalogo-marca">${escapeHtml(c.marca)}</span>` : ""}
                    <h3>${escapeHtml(c.titulo)}</h3>
                    ${c.descricao ? `<p>${escapeHtml(c.descricao)}</p>` : ""}
                    ${tamanho ? `<span class="catalogo-meta">📄 PDF · ${tamanho}</span>` : ""}
                    <a class="btn-primary" href="${c.arquivo_url}" target="_blank" rel="noopener" download>⬇ Baixar PDF</a>
                </div>
            </article>
        `;
    }

    const { data, error } = await db
        .from("catalogos")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

    if (error) {
        console.error("Erro ao carregar catálogos:", error);
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--af-steel); padding:2rem 0;">Não foi possível carregar os catálogos agora. Tente novamente em instantes.</p>`;
        return;
    }

    const catalogos = data || [];

    if (countEl) countEl.textContent = catalogos.length;

    if (!catalogos.length) {
        grid.style.display = "none";
        if (vazioEl) vazioEl.style.display = "block";
        return;
    }

    grid.innerHTML = catalogos.map(cardHtml).join("");
});
