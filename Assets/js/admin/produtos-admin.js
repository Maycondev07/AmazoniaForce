/* ==========================================================
   AMAZONIA FORCE
   PAINEL ADMIN — CRUD de Produtos (Supabase)
   Requer: supabase.js, session.js e admin-guard.js carregados
   antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("produtoForm");
    if (!form) return;

    const db = window.supabaseClient;

    const els = {
        id: document.getElementById("produtoId"),
        nome: document.getElementById("produtoNome"),
        categoria: document.getElementById("produtoCategoria"),
        marca: document.getElementById("produtoMarca"),
        codigo: document.getElementById("produtoCodigo"),
        estoque: document.getElementById("produtoEstoque"),
        preco: document.getElementById("produtoPreco"),
        precoAntigo: document.getElementById("produtoPrecoAntigo"),
        descricao: document.getElementById("produtoDescricao"),
        imagemInput: document.getElementById("produtoImagem"),
        imagemUrl: document.getElementById("produtoImagemUrl"),
        imagemPreview: document.getElementById("imagemPreview"),
        destaque: document.getElementById("produtoDestaque"),
        ativo: document.getElementById("produtoAtivo"),
        submitBtn: document.getElementById("produtoSubmitBtn"),
        cancelBtn: document.getElementById("produtoCancelBtn"),
        formTitle: document.getElementById("produtoFormTitle"),
        search: document.getElementById("produtoSearch"),
        tableBody: document.getElementById("produtosTableBody"),
        count: document.getElementById("produtosCount"),
        empty: document.getElementById("produtosEmpty"),
    };

    let produtos = [];
    let arquivoSelecionado = null;

    /* ---------------- CARREGAR LISTA ---------------- */
    async function carregarProdutos() {
        const { data, error } = await db
            .from("produtos")
            .select("*")
            .order("criado_em", { ascending: false });

        if (error) {
            Toast.show("Erro ao carregar produtos: " + error.message, "error");
            return;
        }

        produtos = data || [];
        renderizarTabela();
    }

    function renderizarTabela() {
        const termo = (els.search.value || "").toLowerCase().trim();
        const filtrados = termo
            ? produtos.filter(p => (p.nome || "").toLowerCase().includes(termo) || (p.categoria || "").toLowerCase().includes(termo))
            : produtos;

        els.count.textContent = `${filtrados.length} produto${filtrados.length === 1 ? "" : "s"}`;

        if (!filtrados.length) {
            els.tableBody.innerHTML = "";
            els.empty.style.display = "block";
            return;
        }
        els.empty.style.display = "none";

        els.tableBody.innerHTML = filtrados.map(p => `
            <tr>
                <td><img class="admin-thumb" src="${p.imagem_url || "../Assets/img/logo.png"}" alt=""></td>
                <td><strong>${escapeHtml(p.nome)}</strong><br><span style="color:var(--af-steel); font-size:0.78rem;">${escapeHtml(p.categoria || "—")}</span></td>
                <td>R$ ${Number(p.preco).toFixed(2).replace(".", ",")}</td>
                <td>${p.estoque ?? 0}</td>
                <td>
                    <span class="admin-badge ${p.ativo ? "ativo" : "inativo"}">${p.ativo ? "Ativo" : "Inativo"}</span>
                    ${p.destaque ? '<span class="admin-badge destaque">Destaque</span>' : ""}
                </td>
                <td>
                    <div class="admin-row-actions">
                        <button type="button" title="Editar" data-edit="${p.id}">✎</button>
                        <button type="button" title="Excluir" class="danger" data-delete="${p.id}">🗑</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    /* ---------------- PREVIEW DE IMAGEM ---------------- */
    els.imagemInput.addEventListener("change", () => {
        const file = els.imagemInput.files[0];
        if (!file) return;
        arquivoSelecionado = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            els.imagemPreview.innerHTML = `<img src="${e.target.result}" alt="Prévia">`;
        };
        reader.readAsDataURL(file);
    });

    async function uploadImagemSeNecessario() {
        if (!arquivoSelecionado) return els.imagemUrl.value || null;

        const ext = arquivoSelecionado.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: erroUpload } = await db.storage
            .from("produtos")
            .upload(path, arquivoSelecionado, { cacheControl: "3600", upsert: false });

        if (erroUpload) {
            throw new Error("Falha ao enviar imagem: " + erroUpload.message);
        }

        const { data } = db.storage.from("produtos").getPublicUrl(path);
        return data.publicUrl;
    }

    /* ---------------- SALVAR (CRIAR / EDITAR) ---------------- */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!Validator.required(els.nome.value)) {
            Toast.show("Informe o nome do produto.", "error");
            return;
        }
        if (!els.preco.value || Number(els.preco.value) <= 0) {
            Toast.show("Informe um preço válido.", "error");
            return;
        }

        Loading.start(els.submitBtn, "Salvando...");

        try {
            const imagemUrl = await uploadImagemSeNecessario();

            const payload = {
                nome: els.nome.value.trim(),
                categoria: els.categoria.value.trim() || null,
                marca: els.marca.value.trim() || null,
                codigo: els.codigo.value.trim() || null,
                estoque: parseInt(els.estoque.value || "0", 10),
                preco: parseFloat(els.preco.value),
                preco_antigo: els.precoAntigo.value ? parseFloat(els.precoAntigo.value) : null,
                descricao: els.descricao.value.trim() || null,
                imagem_url: imagemUrl,
                destaque: els.destaque.checked,
                ativo: els.ativo.checked,
            };

            let error;
            if (els.id.value) {
                ({ error } = await db.from("produtos").update(payload).eq("id", els.id.value));
            } else {
                ({ error } = await db.from("produtos").insert(payload));
            }

            if (error) throw new Error(error.message);

            Toast.show(els.id.value ? "Produto atualizado!" : "Produto cadastrado!", "success");
            resetarFormulario();
            await carregarProdutos();

        } catch (err) {
            Toast.show(err.message || "Erro ao salvar produto.", "error");
        } finally {
            Loading.stop(els.submitBtn);
        }
    });

    /* ---------------- EDITAR / EXCLUIR (delegação de eventos) ---------------- */
    els.tableBody.addEventListener("click", async (e) => {
        const editBtn = e.target.closest("[data-edit]");
        const delBtn = e.target.closest("[data-delete]");

        if (editBtn) {
            const produto = produtos.find(p => p.id === editBtn.dataset.edit);
            if (produto) preencherFormulario(produto);
        }

        if (delBtn) {
            const produto = produtos.find(p => p.id === delBtn.dataset.delete);
            if (!produto) return;
            if (!confirm(`Excluir o produto "${produto.nome}"? Essa ação não pode ser desfeita.`)) return;

            const { error } = await db.from("produtos").delete().eq("id", produto.id);
            if (error) {
                Toast.show("Erro ao excluir: " + error.message, "error");
                return;
            }
            Toast.show("Produto excluído.", "success");
            if (els.id.value === produto.id) resetarFormulario();
            await carregarProdutos();
        }
    });

    function preencherFormulario(p) {
        els.id.value = p.id;
        els.nome.value = p.nome || "";
        els.categoria.value = p.categoria || "";
        els.marca.value = p.marca || "";
        els.codigo.value = p.codigo || "";
        els.estoque.value = p.estoque ?? 0;
        els.preco.value = p.preco ?? "";
        els.precoAntigo.value = p.preco_antigo ?? "";
        els.descricao.value = p.descricao || "";
        els.imagemUrl.value = p.imagem_url || "";
        els.destaque.checked = !!p.destaque;
        els.ativo.checked = p.ativo !== false;
        arquivoSelecionado = null;
        els.imagemPreview.innerHTML = p.imagem_url ? `<img src="${p.imagem_url}" alt="Prévia">` : "📦";

        els.formTitle.textContent = "Editar Produto";
        els.submitBtn.textContent = "Salvar Alterações";
        els.cancelBtn.style.display = "inline-block";

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetarFormulario() {
        form.reset();
        els.id.value = "";
        els.imagemUrl.value = "";
        els.imagemPreview.innerHTML = "📦";
        arquivoSelecionado = null;
        els.ativo.checked = true;
        els.formTitle.textContent = "Novo Produto";
        els.submitBtn.textContent = "Cadastrar Produto";
        els.cancelBtn.style.display = "none";
    }

    els.cancelBtn.addEventListener("click", resetarFormulario);
    els.search.addEventListener("input", renderizarTabela);

    resetarFormulario();
    carregarProdutos();
});
