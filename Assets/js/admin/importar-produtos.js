/* ==========================================================
   AMAZONIA FORCE
   PAINEL ADMIN — Importação de Produtos em Massa via Planilha
   Requer: supabase.js, session.js, admin-guard.js, toast.js,
           loading.js e a biblioteca SheetJS (xlsx.full.min.js)
           carregados antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const baixarModeloBtn = document.getElementById("baixarModeloBtn");
    const dropzone = document.getElementById("importDropzone");
    const fileInput = document.getElementById("importFileInput");
    const previewWrap = document.getElementById("importPreviewWrap");
    const previewBody = document.getElementById("importPreviewBody");
    const summaryEl = document.getElementById("importSummary");
    const confirmBtn = document.getElementById("importConfirmBtn");
    const cancelBtn = document.getElementById("importCancelBtn");

    if (!baixarModeloBtn || !fileInput) return; // não estamos nesta página

    const db = window.supabaseClient;
    let linhasProcessadas = []; // [{ linha, dados: payload, valido, erro }]

    /* ==================================================================
       1) BAIXAR PLANILHA MODELO
       ================================================================== */
    const CABECALHOS = [
        "Nome do Produto*",
        "Categoria",
        "Marca",
        "Código",
        "Descrição",
        "Preço (R$)",
        "Preço Antigo (R$)",
        "Estoque",
        "URL da Imagem",
        "Destaque (sim/não)",
        "Em Oferta (sim/não)",
        "Ativo (sim/não)",
    ];

    const EXEMPLOS = [
        [
            "Mangueira Pneumática PU 8mm", "Mangueiras", "SMC", "MP-8MM-50",
            "Rolo de 50 metros, poliuretano flexível para redes de ar comprimido.",
            145.90, "", 30, "", "sim", "não", "sim",
        ],
        [
            "Cilindro Pneumático ISO 50x100", "Cilindros", "Festo", "CIL-50-100",
            "Cilindro de dupla ação, curso de 100mm.",
            389.00, 459.00, 8, "", "não", "sim", "sim",
        ],
    ];

    async function baixarModelo() {
        Loading.start(baixarModeloBtn, "Gerando...");
        try {
            const wb = XLSX.utils.book_new();

            // --- Aba 1: Produtos (é essa que o site vai ler de volta) ---
            const wsProdutos = XLSX.utils.aoa_to_sheet([CABECALHOS, ...EXEMPLOS]);
            wsProdutos["!cols"] = [
                { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 40 },
                { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
            ];
            XLSX.utils.book_append_sheet(wb, wsProdutos, "Produtos");

            // --- Aba 2: Instruções ---
            const instrucoes = [
                ["Como preencher esta planilha"],
                [""],
                ["1. Apague as 2 linhas de exemplo antes de importar de verdade (ou apenas edite-as)."],
                ["2. A única coluna obrigatória é \"Nome do Produto*\". Todas as outras podem ficar em branco."],
                ["3. Preço e Preço Antigo: use vírgula ou ponto decimal (ex.: 145,90 ou 145.90). Esses valores são só para uso interno — não aparecem no site público."],
                ["4. Estoque: apenas números inteiros. Se deixar em branco, o site usa 0."],
                ["5. URL da Imagem: cole um link direto de imagem (https://...), se já tiver uma. Se deixar em branco, você pode enviar a foto depois, editando o produto no painel."],
                ["6. Destaque / Em Oferta / Ativo: escreva \"sim\" ou \"não\". Se deixar em branco, o site assume \"não\" para Destaque/Oferta e \"sim\" para Ativo."],
                ["7. Categoria e Marca: use nomes parecidos com os que você já usa, pra não espalhar categorias repetidas com nomes diferentes (veja a aba \"Referência\")."],
                ["8. Depois de preencher, salve o arquivo e volte ao painel: clique em \"Selecionar planilha\", confira a prévia e clique em \"Importar\"."],
            ];
            const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
            wsInstrucoes["!cols"] = [{ wch: 100 }];
            XLSX.utils.book_append_sheet(wb, wsInstrucoes, "Instruções");

            // --- Aba 3: Referência (categorias/marcas já usadas hoje) ---
            const { data: existentes } = await db.from("produtos").select("categoria, marca");
            const categorias = [...new Set((existentes || []).map(p => p.categoria).filter(Boolean))].sort();
            const marcas = [...new Set((existentes || []).map(p => p.marca).filter(Boolean))].sort();
            const maxLen = Math.max(categorias.length, marcas.length, 1);
            const linhasRef = [["Categorias já usadas", "Marcas já usadas"]];
            for (let i = 0; i < maxLen; i++) {
                linhasRef.push([categorias[i] || "", marcas[i] || ""]);
            }
            const wsRef = XLSX.utils.aoa_to_sheet(linhasRef);
            wsRef["!cols"] = [{ wch: 28 }, { wch: 28 }];
            XLSX.utils.book_append_sheet(wb, wsRef, "Referência");

            XLSX.writeFile(wb, "modelo-produtos-amazonia-force.xlsx");
        } catch (err) {
            Toast.show("Erro ao gerar planilha: " + err.message, "error");
        } finally {
            Loading.stop(baixarModeloBtn);
        }
    }

    baixarModeloBtn.addEventListener("click", baixarModelo);

    /* ==================================================================
       2) LER E VALIDAR A PLANILHA PREENCHIDA
       ================================================================== */

    // Suporta cabeçalhos levemente diferentes do modelo (sem acento, maiúsculo, sem o *, etc.)
    function normalizarCabecalho(str) {
        return String(str || "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    const ALIASES = {
        nomedoproduto: "nome", nome: "nome", produto: "nome",
        categoria: "categoria",
        marca: "marca",
        codigo: "codigo", sku: "codigo", cod: "codigo",
        descricao: "descricao", desc: "descricao",
        precor: "preco", preco: "preco", precoreais: "preco",
        precoantigor: "preco_antigo", precoantigo: "preco_antigo", precoantigoreais: "preco_antigo", precodeantes: "preco_antigo",
        estoque: "estoque", quantidade: "estoque", qtd: "estoque",
        urldaimagem: "imagem_url", imagemurl: "imagem_url", urlimagem: "imagem_url", imagem: "imagem_url", foto: "imagem_url",
        destaquesimnao: "destaque", destaque: "destaque",
        emofertasimnao: "em_oferta", emoferta: "em_oferta", oferta: "em_oferta",
        ativosimnao: "ativo", ativo: "ativo", visivel: "ativo",
    };

    function paraBooleano(valor, padrao) {
        if (valor === undefined || valor === null || String(valor).trim() === "") return padrao;
        const v = String(valor).trim().toLowerCase();
        return ["sim", "s", "true", "verdadeiro", "1", "x", "yes", "y"].includes(v);
    }

    function paraNumero(valor) {
        if (valor === undefined || valor === null || String(valor).trim() === "") return { ok: true, valor: null };
        if (typeof valor === "number") return { ok: true, valor };
        const limpo = String(valor).trim().replace(/[^\d,.-]/g, "");
        if (!limpo) return { ok: true, valor: null };
        let normalizado;
        if (limpo.includes(",") && limpo.includes(".")) {
            normalizado = limpo.replace(/\./g, "").replace(",", ".");
        } else if (limpo.includes(",")) {
            normalizado = limpo.replace(",", ".");
        } else {
            normalizado = limpo;
        }
        const n = parseFloat(normalizado);
        return isNaN(n) ? { ok: false, valor: null } : { ok: true, valor: n };
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function processarLinha(objBruto, numeroLinha) {
        // Remapeia as chaves do jeito que vieram no arquivo pros nomes internos
        const campos = {};
        Object.keys(objBruto).forEach(chaveOriginal => {
            const chave = ALIASES[normalizarCabecalho(chaveOriginal)];
            if (chave) campos[chave] = objBruto[chaveOriginal];
        });

        const erros = [];

        const nome = String(campos.nome || "").trim();
        if (!nome) erros.push("Nome é obrigatório");

        const preco = paraNumero(campos.preco);
        if (!preco.ok) erros.push("Preço inválido");

        const precoAntigo = paraNumero(campos.preco_antigo);
        if (!precoAntigo.ok) erros.push("Preço Antigo inválido");

        const estoqueBruto = campos.estoque;
        let estoque = 0;
        if (estoqueBruto !== undefined && String(estoqueBruto).trim() !== "") {
            const n = parseInt(String(estoqueBruto).replace(/[^\d-]/g, ""), 10);
            if (isNaN(n)) erros.push("Estoque inválido");
            else estoque = n;
        }

        const payload = {
            nome,
            categoria: String(campos.categoria || "").trim() || null,
            marca: String(campos.marca || "").trim() || null,
            codigo: String(campos.codigo || "").trim() || null,
            descricao: String(campos.descricao || "").trim() || null,
            preco: preco.valor,
            preco_antigo: precoAntigo.valor,
            estoque,
            imagem_url: String(campos.imagem_url || "").trim() || null,
            destaque: paraBooleano(campos.destaque, false),
            em_oferta: paraBooleano(campos.em_oferta, false),
            ativo: paraBooleano(campos.ativo, true),
        };

        return {
            linha: numeroLinha,
            dados: payload,
            valido: erros.length === 0,
            erro: erros.join("; "),
        };
    }

    function renderizarPreview() {
        const validos = linhasProcessadas.filter(l => l.valido).length;
        const invalidos = linhasProcessadas.length - validos;

        summaryEl.textContent = `${linhasProcessadas.length} linha${linhasProcessadas.length === 1 ? "" : "s"} encontrada${linhasProcessadas.length === 1 ? "" : "s"} — ${validos} pronta${validos === 1 ? "" : "s"} para importar${invalidos ? `, ${invalidos} com erro` : ""}`;

        previewBody.innerHTML = linhasProcessadas.map(l => `
            <tr>
                <td>${l.linha}</td>
                <td>${escapeHtml(l.dados.nome || "—")}</td>
                <td>${escapeHtml(l.dados.categoria || "—")}</td>
                <td>${l.dados.preco != null ? "R$ " + l.dados.preco.toFixed(2).replace(".", ",") : "—"}</td>
                <td>${l.dados.estoque ?? 0}</td>
                <td>
                    ${l.valido
                        ? '<span class="admin-badge ativo">✓ Válido</span>'
                        : `<span class="admin-badge inativo" title="${escapeHtml(l.erro)}">✗ ${escapeHtml(l.erro)}</span>`}
                </td>
            </tr>
        `).join("");

        confirmBtn.disabled = validos === 0;
        confirmBtn.textContent = validos
            ? `Importar ${validos} Produto${validos === 1 ? "" : "s"} Válido${validos === 1 ? "" : "s"}`
            : "Nenhum produto válido";

        previewWrap.style.display = "block";
    }

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array" });
            const primeiraAba = wb.SheetNames.includes("Produtos") ? "Produtos" : wb.SheetNames[0];
            const linhas = XLSX.utils.sheet_to_json(wb.Sheets[primeiraAba], { defval: "" });

            if (!linhas.length) {
                Toast.show("A planilha está vazia.", "error");
                return;
            }

            linhasProcessadas = linhas.map((linha, i) => processarLinha(linha, i + 2)); // +2 = pula o cabeçalho, planilha começa na linha 1
            renderizarPreview();

        } catch (err) {
            Toast.show("Não foi possível ler essa planilha. Confira o formato do arquivo.", "error");
            console.error(err);
        }
    });

    /* ==================================================================
       3) CONFIRMAR IMPORTAÇÃO (grava no Supabase em lotes)
       ================================================================== */
    confirmBtn.addEventListener("click", async () => {
        const validos = linhasProcessadas.filter(l => l.valido).map(l => l.dados);
        if (!validos.length) return;

        Loading.start(confirmBtn, "Importando...");

        const TAMANHO_LOTE = 200;
        let sucesso = 0;
        let falhas = 0;

        for (let i = 0; i < validos.length; i += TAMANHO_LOTE) {
            const lote = validos.slice(i, i + TAMANHO_LOTE);
            const { error } = await db.from("produtos").insert(lote);
            if (error) {
                console.error("Erro ao importar lote:", error.message);
                falhas += lote.length;
            } else {
                sucesso += lote.length;
            }
        }

        Loading.stop(confirmBtn);

        if (sucesso) Toast.show(`${sucesso} produto${sucesso === 1 ? "" : "s"} importado${sucesso === 1 ? "" : "s"} com sucesso!`, "success");
        if (falhas) Toast.show(`${falhas} produto${falhas === 1 ? "" : "s"} não pôde${falhas === 1 ? "" : "ram"} ser importado${falhas === 1 ? "" : "s"}.`, "error");

        cancelarImportacao();
        if (window.recarregarProdutosAdmin) window.recarregarProdutosAdmin();
    });

    function cancelarImportacao() {
        linhasProcessadas = [];
        fileInput.value = "";
        previewWrap.style.display = "none";
        previewBody.innerHTML = "";
    }

    cancelBtn.addEventListener("click", cancelarImportacao);

    // Arrastar e soltar o arquivo na área de upload
    ["dragover", "dragenter"].forEach(evt => {
        dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("active"); });
    });
    ["dragleave", "drop"].forEach(evt => {
        dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("active"); });
    });
    dropzone.addEventListener("drop", (e) => {
        const arquivo = e.dataTransfer.files[0];
        if (!arquivo) return;
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change"));
    });

});
