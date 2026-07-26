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
        oferta: document.getElementById("produtoOferta"),
        ativo: document.getElementById("produtoAtivo"),
        submitBtn: document.getElementById("produtoSubmitBtn"),
        cancelBtn: document.getElementById("produtoCancelBtn"),
        formTitle: document.getElementById("produtoFormTitle"),
        search: document.getElementById("produtoSearch"),
        tableBody: document.getElementById("produtosTableBody"),
        count: document.getElementById("produtosCount"),
        empty: document.getElementById("produtosEmpty"),
        variacoesLista: document.getElementById("variacoesLista"),
        addVariacaoBtn: document.getElementById("addVariacaoBtn"),
        variacaoTemplate: document.getElementById("variacaoRowTemplate"),
    };

    let produtos = [];
    let arquivoSelecionado = null;
    let variacoesPorProduto = {};   // { produtoId: quantidade de variações }
    let variacoesOriginais = [];    // ids das variações carregadas ao editar um produto

    /* ---------------- CARREGAR LISTA ---------------- */
    async function carregarProdutos() {
        const [{ data, error }, contagemVariacoes] = await Promise.all([
            db.from("produtos").select("*").order("criado_em", { ascending: false }),
            carregarContagemVariacoes(),
        ]);

        if (error) {
            Toast.show("Erro ao carregar produtos: " + error.message, "error");
            return;
        }

        variacoesPorProduto = contagemVariacoes;
        produtos = data || [];
        renderizarTabela();
    }

    async function carregarContagemVariacoes() {
        const { data, error } = await db.from("produto_variacoes").select("produto_id");

        if (error) {
            console.error("Erro ao carregar variações:", error.message);
            return {};
        }

        const contagem = {};
        (data || []).forEach((v) => {
            contagem[v.produto_id] = (contagem[v.produto_id] || 0) + 1;
        });
        return contagem;
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

        els.tableBody.innerHTML = filtrados.map(p => {
            const qtdVariacoes = variacoesPorProduto[p.id] || 0;
            return `
            <tr>
                <td><img class="admin-thumb" src="${p.imagem_url || "../Assets/img/logo.png"}" alt=""></td>
                <td>
                    <strong>${escapeHtml(p.nome)}</strong><br>
                    <span style="color:var(--af-steel); font-size:0.78rem;">${escapeHtml(p.categoria || "—")}</span>
                    ${qtdVariacoes ? `<br><span class="admin-badge variacoes">${qtdVariacoes} variação${qtdVariacoes === 1 ? "" : "ões"}</span>` : ""}
                </td>
                <td>${p.preco != null ? "R$ " + Number(p.preco).toFixed(2).replace(".", ",") : "—"}</td>
                <td>${p.estoque ?? 0}</td>
                <td>
                    <span class="admin-badge ${p.ativo ? "ativo" : "inativo"}">${p.ativo ? "Ativo" : "Inativo"}</span>
                    ${p.destaque ? '<span class="admin-badge destaque">Destaque</span>' : ""}
                    ${p.em_oferta ? '<span class="admin-badge oferta">Oferta</span>' : ""}
                </td>
                <td>
                    <div class="admin-row-actions">
                        <button type="button" title="Editar" data-edit="${p.id}">✎</button>
                        <button type="button" title="Excluir" class="danger" data-delete="${p.id}">🗑</button>
                    </div>
                </td>
            </tr>
        `;
        }).join("");
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    /* ---------------- VARIAÇÕES DO PRODUTO ---------------- */
    function novaLinhaVariacao(v = {}) {
        const frag = els.variacaoTemplate.content.cloneNode(true);
        const row = frag.querySelector(".variacao-row");

        row.dataset.id = v.id || "";
        row.querySelector(".variacao-nome").value = v.nome || "";
        row.querySelector(".variacao-codigo").value = v.codigo || "";
        row.querySelector(".variacao-preco").value = v.preco ?? "";
        row.querySelector(".variacao-estoque").value = v.estoque ?? 0;

        row.querySelector(".variacao-remover").addEventListener("click", () => row.remove());

        els.variacoesLista.appendChild(row);
    }

    els.addVariacaoBtn.addEventListener("click", () => novaLinhaVariacao());

    function limparVariacoes() {
        els.variacoesLista.innerHTML = "";
        variacoesOriginais = [];
    }

    async function carregarVariacoesDoProduto(produtoId) {
        limparVariacoes();

        const { data, error } = await db
            .from("produto_variacoes")
            .select("*")
            .eq("produto_id", produtoId)
            .order("ordem", { ascending: true });

        if (error) {
            Toast.show("Erro ao carregar variações: " + error.message, "error");
            return;
        }

        (data || []).forEach((v) => novaLinhaVariacao(v));
        variacoesOriginais = (data || []).map(v => v.id);
    }

    function lerVariacoesDoFormulario() {
        return Array.from(els.variacoesLista.querySelectorAll(".variacao-row"))
            .map((row, index) => ({
                id: row.dataset.id || null,
                nome: row.querySelector(".variacao-nome").value.trim(),
                codigo: row.querySelector(".variacao-codigo").value.trim() || null,
                preco: row.querySelector(".variacao-preco").value
                    ? parseFloat(row.querySelector(".variacao-preco").value)
                    : null,
                estoque: parseInt(row.querySelector(".variacao-estoque").value || "0", 10),
                ordem: index,
            }))
            .filter(v => v.nome !== "");
    }

    async function salvarVariacoes(produtoId) {
        const atuais = lerVariacoesDoFormulario();
        const idsAtuais = atuais.filter(v => v.id).map(v => v.id);

        const idsParaExcluir = variacoesOriginais.filter(id => !idsAtuais.includes(id));

        if (idsParaExcluir.length) {
            const { error } = await db.from("produto_variacoes").delete().in("id", idsParaExcluir);
            if (error) throw new Error("Falha ao remover variações: " + error.message);
        }

        const novas = atuais.filter(v => !v.id).map(({ id, ...resto }) => ({ ...resto, produto_id: produtoId }));
        const existentes = atuais.filter(v => v.id);

        if (novas.length) {
            const { error } = await db.from("produto_variacoes").insert(novas);
            if (error) throw new Error("Falha ao criar variações: " + error.message);
        }

        for (const v of existentes) {
            const { id, ...resto } = v;
            const { error } = await db.from("produto_variacoes").update(resto).eq("id", id);
            if (error) throw new Error("Falha ao atualizar variação: " + error.message);
        }
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

        Loading.start(els.submitBtn, "Salvando...");

        try {
            const imagemUrl = await uploadImagemSeNecessario();

            const payload = {
                nome: els.nome.value.trim(),
                categoria: els.categoria.value.trim() || null,
                marca: els.marca.value.trim() || null,
                codigo: els.codigo.value.trim() || null,
                estoque: parseInt(els.estoque.value || "0", 10),
                preco: els.preco.value ? parseFloat(els.preco.value) : null,
                preco_antigo: els.precoAntigo.value ? parseFloat(els.precoAntigo.value) : null,
                descricao: els.descricao.value.trim() || null,
                imagem_url: imagemUrl,
                destaque: els.destaque.checked,
                em_oferta: els.oferta.checked,
                ativo: els.ativo.checked,
            };

            let produtoId = els.id.value || null;
            let error;

            if (produtoId) {
                ({ error } = await db.from("produtos").update(payload).eq("id", produtoId));
            } else {
                const resposta = await db.from("produtos").insert(payload).select("id").single();
                error = resposta.error;
                produtoId = resposta.data ? resposta.data.id : null;
            }

            if (error) throw new Error(error.message);

            if (produtoId) {
                await salvarVariacoes(produtoId);
            }

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
            if (produto) await preencherFormulario(produto);
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

    async function preencherFormulario(p) {
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
        els.oferta.checked = !!p.em_oferta;
        els.ativo.checked = p.ativo !== false;
        arquivoSelecionado = null;
        els.imagemPreview.innerHTML = p.imagem_url ? `<img src="${p.imagem_url}" alt="Prévia">` : "📦";

        await carregarVariacoesDoProduto(p.id);

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
        limparVariacoes();
        els.formTitle.textContent = "Novo Produto";
        els.submitBtn.textContent = "Cadastrar Produto";
        els.cancelBtn.style.display = "none";
    }

    els.cancelBtn.addEventListener("click", resetarFormulario);
    els.search.addEventListener("input", renderizarTabela);

    resetarFormulario();
    carregarProdutos();
});
