/* ==========================================================
   AMAZONIA FORCE
   PAINEL ADMIN — CRUD de Catálogos (Supabase)
   Requer: supabase.js, session.js e admin-guard.js carregados
   antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("catalogoForm");
    if (!form) return;

    const db = window.supabaseClient;

    const els = {
        id: document.getElementById("catalogoId"),
        titulo: document.getElementById("catalogoTitulo"),
        marca: document.getElementById("catalogoMarca"),
        descricao: document.getElementById("catalogoDescricao"),
        capaInput: document.getElementById("catalogoCapa"),
        capaUrl: document.getElementById("catalogoCapaUrl"),
        capaPreview: document.getElementById("capaPreview"),
        pdfInput: document.getElementById("catalogoPdf"),
        pdfArquivoUrl: document.getElementById("catalogoArquivoUrl"),
        pdfBtnLabel: document.getElementById("pdfBtnLabel"),
        pdfArquivoAtual: document.getElementById("pdfArquivoAtual"),
        ativo: document.getElementById("catalogoAtivo"),
        ordem: document.getElementById("catalogoOrdem"),
        submitBtn: document.getElementById("catalogoSubmitBtn"),
        cancelBtn: document.getElementById("catalogoCancelBtn"),
        formTitle: document.getElementById("catalogoFormTitle"),
        search: document.getElementById("catalogoSearch"),
        tableBody: document.getElementById("catalogosTableBody"),
        count: document.getElementById("catalogosCount"),
        empty: document.getElementById("catalogosEmpty"),
    };

    let catalogos = [];
    let capaSelecionada = null;
    let pdfSelecionado = null;

    /* ---------------- CARREGAR LISTA ---------------- */
    async function carregarCatalogos() {
        const { data, error } = await db
            .from("catalogos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            Toast.show("Erro ao carregar catálogos: " + error.message, "error");
            return;
        }

        catalogos = data || [];
        renderizarTabela();
    }

    function formatarTamanho(kb) {
        if (!kb) return "—";
        if (kb < 1024) return `${kb} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    }

    function renderizarTabela() {
        const termo = (els.search.value || "").toLowerCase().trim();
        const filtrados = termo
            ? catalogos.filter(c => (c.titulo || "").toLowerCase().includes(termo) || (c.marca || "").toLowerCase().includes(termo))
            : catalogos;

        els.count.textContent = `${filtrados.length} catálogo${filtrados.length === 1 ? "" : "s"}`;

        if (!filtrados.length) {
            els.tableBody.innerHTML = "";
            els.empty.style.display = "block";
            return;
        }
        els.empty.style.display = "none";

        els.tableBody.innerHTML = filtrados.map(c => `
            <tr>
                <td><img class="admin-thumb" src="${c.capa_url || "../Assets/img/logo.png"}" alt=""></td>
                <td><strong>${escapeHtml(c.titulo)}</strong><br><span style="color:var(--af-steel); font-size:0.78rem;">${escapeHtml(c.marca || "—")}</span></td>
                <td>${formatarTamanho(c.tamanho_kb)}</td>
                <td><span class="admin-badge ${c.ativo ? "ativo" : "inativo"}">${c.ativo ? "Ativo" : "Inativo"}</span></td>
                <td>
                    <div class="admin-row-actions">
                        <button type="button" title="Editar" data-edit="${c.id}">✎</button>
                        <button type="button" title="Excluir" class="danger" data-delete="${c.id}">🗑</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    /* ---------------- PREVIEW DE CAPA ---------------- */
    els.capaInput.addEventListener("change", () => {
        const file = els.capaInput.files[0];
        if (!file) return;
        capaSelecionada = file;
        const reader = new FileReader();
        reader.onload = (e) => { els.capaPreview.innerHTML = `<img src="${e.target.result}" alt="Prévia">`; };
        reader.readAsDataURL(file);
    });

    /* ---------------- SELEÇÃO DE PDF ---------------- */
    els.pdfInput.addEventListener("change", () => {
        const file = els.pdfInput.files[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            Toast.show("Escolha um arquivo PDF.", "error");
            els.pdfInput.value = "";
            return;
        }
        pdfSelecionado = file;
        els.pdfBtnLabel.textContent = `📄 ${file.name}`;
    });

    async function uploadArquivo(bucketPath, file, extPadrao) {
        const ext = (file.name.split(".").pop() || extPadrao).toLowerCase();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error } = await db.storage
            .from("catalogos")
            .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) throw new Error("Falha ao enviar arquivo: " + error.message);

        const { data } = db.storage.from("catalogos").getPublicUrl(path);
        return data.publicUrl;
    }

    /* ---------------- SALVAR (CRIAR / EDITAR) ---------------- */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!Validator.required(els.titulo.value)) {
            Toast.show("Informe o título do catálogo.", "error");
            return;
        }
        if (!pdfSelecionado && !els.pdfArquivoUrl.value) {
            Toast.show("Escolha o arquivo PDF do catálogo.", "error");
            return;
        }

        Loading.start(els.submitBtn, "Salvando...");

        try {
            const capaUrl = capaSelecionada
                ? await uploadArquivo("catalogos", capaSelecionada, "png")
                : (els.capaUrl.value || null);

            let arquivoUrl = els.pdfArquivoUrl.value || null;
            let tamanhoKb = null;

            if (pdfSelecionado) {
                arquivoUrl = await uploadArquivo("catalogos", pdfSelecionado, "pdf");
                tamanhoKb = Math.round(pdfSelecionado.size / 1024);
            }

            const payload = {
                titulo: els.titulo.value.trim(),
                marca: els.marca.value.trim() || null,
                descricao: els.descricao.value.trim() || null,
                arquivo_url: arquivoUrl,
                capa_url: capaUrl,
                ordem: parseInt(els.ordem.value || "0", 10),
                ativo: els.ativo.checked,
            };

            if (tamanhoKb) payload.tamanho_kb = tamanhoKb;

            let error;
            if (els.id.value) {
                ({ error } = await db.from("catalogos").update(payload).eq("id", els.id.value));
            } else {
                ({ error } = await db.from("catalogos").insert(payload));
            }

            if (error) throw new Error(error.message);

            Toast.show(els.id.value ? "Catálogo atualizado!" : "Catálogo cadastrado!", "success");
            resetarFormulario();
            await carregarCatalogos();

        } catch (err) {
            Toast.show(err.message || "Erro ao salvar catálogo.", "error");
        } finally {
            Loading.stop(els.submitBtn);
        }
    });

    /* ---------------- EDITAR / EXCLUIR ---------------- */
    els.tableBody.addEventListener("click", async (e) => {
        const editBtn = e.target.closest("[data-edit]");
        const delBtn = e.target.closest("[data-delete]");

        if (editBtn) {
            const catalogo = catalogos.find(c => c.id === editBtn.dataset.edit);
            if (catalogo) preencherFormulario(catalogo);
        }

        if (delBtn) {
            const catalogo = catalogos.find(c => c.id === delBtn.dataset.delete);
            if (!catalogo) return;
            if (!confirm(`Excluir o catálogo "${catalogo.titulo}"? Essa ação não pode ser desfeita.`)) return;

            const { error } = await db.from("catalogos").delete().eq("id", catalogo.id);
            if (error) {
                Toast.show("Erro ao excluir: " + error.message, "error");
                return;
            }
            Toast.show("Catálogo excluído.", "success");
            if (els.id.value === catalogo.id) resetarFormulario();
            await carregarCatalogos();
        }
    });

    function preencherFormulario(c) {
        els.id.value = c.id;
        els.titulo.value = c.titulo || "";
        els.marca.value = c.marca || "";
        els.descricao.value = c.descricao || "";
        els.capaUrl.value = c.capa_url || "";
        els.pdfArquivoUrl.value = c.arquivo_url || "";
        els.ordem.value = c.ordem ?? 0;
        els.ativo.checked = c.ativo !== false;

        capaSelecionada = null;
        pdfSelecionado = null;
        els.capaPreview.innerHTML = c.capa_url ? `<img src="${c.capa_url}" alt="Prévia">` : "📄";
        els.pdfBtnLabel.textContent = "Escolher Arquivo PDF";
        els.pdfArquivoAtual.textContent = c.arquivo_url ? "PDF já cadastrado — escolha um novo arquivo só se quiser substituí-lo." : "";

        els.formTitle.textContent = "Editar Catálogo";
        els.submitBtn.textContent = "Salvar Alterações";
        els.cancelBtn.style.display = "inline-block";

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetarFormulario() {
        form.reset();
        els.id.value = "";
        els.capaUrl.value = "";
        els.pdfArquivoUrl.value = "";
        els.capaPreview.innerHTML = "📄";
        els.pdfBtnLabel.textContent = "Escolher Arquivo PDF";
        els.pdfArquivoAtual.textContent = "";
        capaSelecionada = null;
        pdfSelecionado = null;
        els.ativo.checked = true;
        els.formTitle.textContent = "Novo Catálogo";
        els.submitBtn.textContent = "Cadastrar Catálogo";
        els.cancelBtn.style.display = "none";
    }

    els.cancelBtn.addEventListener("click", resetarFormulario);
    els.search.addEventListener("input", renderizarTabela);

    resetarFormulario();
    carregarCatalogos();
});
