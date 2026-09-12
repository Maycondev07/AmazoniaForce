/* ==========================================================
   AMAZONIA FORCE — VERSÃO DEMO
   "BACKEND" LOCAL E GENÉRICO (sem servidor real)
   ------------------------------------------------------------
   As credenciais de um projeto Supabase real que existiam aqui
   foram removidas por segurança/privacidade.

   Em vez disso, este arquivo cria um "banco de dados" genérico
   dentro do próprio navegador (localStorage) que imita, apenas
   com o que este site usa, a mesma forma de consulta do Supabase
   (.from().select().eq()...), então nenhum outro arquivo do site
   precisou saber que não existe mais um servidor de verdade por
   trás — tudo (produtos, carrinho, favoritos, pedidos, painel
   admin, contas) funciona 100% localmente, só para demonstração.
========================================================== */

(function () {

    /* ==================================================================
       PARTE 1 — CONTAS (autenticação genérica, local)
    ================================================================== */

    const CHAVE_USUARIOS = "af_demo_usuarios";
    const CHAVE_SESSAO = "af_demo_sessao";

    function lerUsuarios() {
        try { return JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || []; }
        catch (e) { return []; }
    }
    function salvarUsuarios(lista) {
        localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
    }
    function gerarId(prefixo) {
        return `${prefixo || "demo"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    window.demoStore = {
        gerarId,
        listarUsuarios: lerUsuarios,
        salvarUsuarios,
        buscarPorEmail(email) {
            return lerUsuarios().find(u => u.email.toLowerCase() === String(email || "").toLowerCase()) || null;
        },
        buscarPorId(id) {
            return lerUsuarios().find(u => u.id === id) || null;
        },
        adicionarUsuario(usuario) {
            const usuarios = lerUsuarios();
            usuarios.push(usuario);
            salvarUsuarios(usuarios);
            window.demoStore.criarPerfilPadrao(usuario);
        },
        obterSessaoId() { return localStorage.getItem(CHAVE_SESSAO); },
        definirSessaoId(id) { localStorage.setItem(CHAVE_SESSAO, id); },
        limparSessao() { localStorage.removeItem(CHAVE_SESSAO); },

        // Cria a linha correspondente na tabela "profiles" para que o
        // dashboard de Minha Conta encontre nome/telefone/documento.
        criarPerfilPadrao(usuario) {
            const perfis = MockDB.getTable("profiles");
            if (perfis.some(p => p.id === usuario.id)) return;
            perfis.push({
                id: usuario.id,
                nome: usuario.nome || "",
                telefone: usuario.telefone || "",
                cpf: usuario.tipoPessoa === "juridica" ? "" : (usuario.documento || ""),
                receber_ofertas: true,
                receber_atualizacoes_pedido: true,
            });
            MockDB.setTable("profiles", perfis);
        }
    };

    /* ==================================================================
       PARTE 2 — "BANCO DE DADOS" GENÉRICO (produtos, carrinho, etc.)
    ================================================================== */

    const PREFIXO_TABELA = "af_mockdb_";

    // Tabelas que, num backend real, só mostrariam/aceitariam linhas do
    // próprio usuário logado (regra de segurança do tipo RLS). Aqui a
    // gente reproduz esse comportamento na mão.
    const TABELAS_DO_USUARIO = ["carrinho_itens", "favoritos", "pedidos", "enderecos"];

    // Relação "nome da junção" → coluna de chave estrangeira, usada para
    // resolver seleções como "produtos(*)" dentro de outra tabela
    // (ex.: carrinho_itens.select("..., produtos(*)")).
    const JUNCOES = { produtos: "produto_id", produto_variacoes: "variacao_id" };

    const MockDB = {
        getTable(nome) {
            try { return JSON.parse(localStorage.getItem(PREFIXO_TABELA + nome)) || []; }
            catch (e) { return []; }
        },
        setTable(nome, linhas) {
            localStorage.setItem(PREFIXO_TABELA + nome, JSON.stringify(linhas));
        },
        seedSeVazio(nome, linhas) {
            if (!localStorage.getItem(PREFIXO_TABELA + nome)) this.setTable(nome, linhas);
        },
        currentUserId() { return window.demoStore.obterSessaoId(); },
    };

    class MockQuery {
        constructor(tabela) {
            this.tabela = tabela;
            this.filtros = [];
            this.orders = [];
            this.selectCols = "*";
            this.countOpts = null;
            this.limiteN = null;
            this.op = null; // { tipo: 'insert'|'update'|'delete', valor }
        }

        select(cols, opts) {
            this.selectCols = cols || "*";
            if (opts && opts.count) this.countOpts = opts;
            return this;
        }
        eq(col, val) { this.filtros.push({ tipo: "eq", col, val }); return this; }
        ilike(col, padrao) { this.filtros.push({ tipo: "ilike", col, padrao }); return this; }
        in(col, arr) { this.filtros.push({ tipo: "in", col, arr }); return this; }
        or(expr) { this.filtros.push({ tipo: "or", expr }); return this; }
        order(col, opts) { this.orders.push({ col, ascending: !opts || opts.ascending !== false }); return this; }
        limit(n) { this.limiteN = n; return this; }

        insert(valor) { this.op = { tipo: "insert", valor }; return this; }
        update(valor) { this.op = { tipo: "update", valor }; return this; }
        delete() { this.op = { tipo: "delete" }; return this; }

        // Torna a própria query "aguardável" (await query), igual ao
        // comportamento real do cliente Supabase.
        then(onResolve, onReject) {
            return this._rodar().then(onResolve, onReject);
        }

        async maybeSingle() {
            const { data, error } = await this._rodar();
            const linha = Array.isArray(data) ? (data[0] || null) : (data || null);
            return { data: linha, error };
        }
        async single() {
            const { data, error } = await this._rodar();
            const linha = Array.isArray(data) ? (data[0] || null) : (data || null);
            if (!linha) return { data: null, error: error || { message: "Registro não encontrado." } };
            return { data: linha, error: null };
        }

        _rodar() { return this.op ? this._executarEscrita() : this._executarLeitura(); }

        _combinaFiltro(linha, f) {
            if (f.tipo === "eq") return linha[f.col] === f.val;
            if (f.tipo === "ilike") {
                const termo = f.padrao.replace(/%/g, "").toLowerCase();
                return String(linha[f.col] ?? "").toLowerCase().includes(termo);
            }
            if (f.tipo === "in") return f.arr.includes(linha[f.col]);
            if (f.tipo === "or") {
                return f.expr.split(",").some(clausula => {
                    const m = clausula.match(/^([^.]+)\.([^.]+)\.(.*)$/);
                    if (!m) return false;
                    const [, col, , valor] = m;
                    const termo = valor.replace(/%/g, "").toLowerCase();
                    return String(linha[col] ?? "").toLowerCase().includes(termo);
                });
            }
            return true;
        }

        _linhasEscopadas() {
            let linhas = MockDB.getTable(this.tabela);

            if (TABELAS_DO_USUARIO.includes(this.tabela)) {
                const uid = MockDB.currentUserId();
                if (!uid) return [];
                const jaFiltraUsuario = this.filtros.some(f => f.tipo === "eq" && f.col === "user_id");
                if (!jaFiltraUsuario) linhas = linhas.filter(l => l.user_id === uid);
            }

            return linhas.filter(l => this.filtros.every(f => this._combinaFiltro(l, f)));
        }

        _aplicarJuncoes(linhas) {
            if (typeof this.selectCols !== "string") return linhas;
            const juncoesAtivas = Object.keys(JUNCOES).filter(nome => this.selectCols.includes(nome + "("));
            if (!juncoesAtivas.length) return linhas;

            return linhas.map(linha => {
                const copia = { ...linha };
                juncoesAtivas.forEach(nomeJuncao => {
                    const fk = JUNCOES[nomeJuncao];
                    const valorFk = linha[fk];
                    copia[nomeJuncao] = valorFk
                        ? (MockDB.getTable(nomeJuncao).find(r => r.id === valorFk) || null)
                        : null;
                });
                return copia;
            });
        }

        async _executarLeitura() {
            let linhas = this._linhasEscopadas();

            if (this.countOpts) return { data: null, error: null, count: linhas.length };

            if (this.orders.length) {
                linhas = [...linhas].sort((a, b) => {
                    for (const o of this.orders) {
                        const av = a[o.col], bv = b[o.col];
                        if (av === bv) continue;
                        if (av == null) return 1;
                        if (bv == null) return -1;
                        const cmp = av < bv ? -1 : 1;
                        return o.ascending ? cmp : -cmp;
                    }
                    return 0;
                });
            }

            if (this.limiteN) linhas = linhas.slice(0, this.limiteN);

            linhas = this._aplicarJuncoes(linhas);

            return { data: linhas, error: null };
        }

        async _executarEscrita() {
            let linhas = MockDB.getTable(this.tabela);

            if (this.op.tipo === "insert") {
                const objetos = Array.isArray(this.op.valor) ? this.op.valor : [this.op.valor];
                const inseridos = objetos.map(o => {
                    const base = { id: gerarId(this.tabela), criado_em: new Date().toISOString() };
                    const linha = { ...base, ...o };
                    if (TABELAS_DO_USUARIO.includes(this.tabela) && !linha.user_id) {
                        linha.user_id = MockDB.currentUserId();
                    }
                    return linha;
                });
                linhas = linhas.concat(inseridos);
                MockDB.setTable(this.tabela, linhas);
                return { data: inseridos, error: null };
            }

            if (this.op.tipo === "update") {
                const alvo = this._linhasEscopadas();
                const idsAlvo = new Set(alvo.map(l => l.id));
                const atualizados = [];
                linhas = linhas.map(l => {
                    if (!idsAlvo.has(l.id)) return l;
                    const nova = { ...l, ...this.op.valor };
                    atualizados.push(nova);
                    return nova;
                });
                MockDB.setTable(this.tabela, linhas);
                return { data: atualizados, error: null };
            }

            if (this.op.tipo === "delete") {
                const alvo = this._linhasEscopadas();
                const idsAlvo = new Set(alvo.map(l => l.id));
                linhas = linhas.filter(l => !idsAlvo.has(l.id));
                MockDB.setTable(this.tabela, linhas);
                return { data: alvo, error: null };
            }
        }
    }

    /* ---------------- ARMAZENAMENTO DE ARQUIVOS (imagens/PDFs) ---------------- */
    // Guarda o arquivo como Data URL — só para a demo funcionar sem um
    // servidor de arquivos de verdade. Fica salvo junto do registro
    // (ex.: produtos.imagem_url) quando o formulário é enviado.
    function arquivoParaDataUrl(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve(leitor.result);
            leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
            leitor.readAsDataURL(arquivo);
        });
    }

    const urlsPendentes = new Map();

    const mockStorage = {
        from(bucket) {
            return {
                async upload(path, arquivo, _opts) {
                    try {
                        const dataUrl = await arquivoParaDataUrl(arquivo);
                        urlsPendentes.set(`${bucket}/${path}`, dataUrl);
                        return { data: { path }, error: null };
                    } catch (e) {
                        return { data: null, error: { message: e.message } };
                    }
                },
                getPublicUrl(path) {
                    return { data: { publicUrl: urlsPendentes.get(`${bucket}/${path}`) || "" } };
                }
            };
        }
    };

    /* ---------------- AUTENTICAÇÃO USADA DIRETO PELO "db.auth" ---------------- */
    // Usado só pela troca de senha em Minha Conta > Segurança.
    const mockAuth = {
        async signInWithPassword({ email, password }) {
            const usuario = window.demoStore.buscarPorEmail(email);
            if (!usuario || usuario.senha !== password) {
                return { data: null, error: { message: "Credenciais inválidas." } };
            }
            return { data: { user: usuario }, error: null };
        },
        async updateUser({ password }) {
            const uid = MockDB.currentUserId();
            const usuarios = window.demoStore.listarUsuarios();
            const idx = usuarios.findIndex(u => u.id === uid);
            if (idx === -1) return { error: { message: "Usuário não encontrado." } };
            usuarios[idx] = { ...usuarios[idx], senha: password };
            window.demoStore.salvarUsuarios(usuarios);
            return { error: null };
        }
    };

    window.supabaseClient = {
        from(tabela) { return new MockQuery(tabela); },
        storage: mockStorage,
        auth: mockAuth,
    };

    /* ==================================================================
       PARTE 3 — DADOS INICIAIS DE DEMONSTRAÇÃO
    ================================================================== */

    const IMG = [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1591588582259-91a4239b8a1a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1620912189866-a4d5b5f7c1c4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    ];

    function diasAtras(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString();
    }

    MockDB.seedSeVazio("produtos", [
        { id: "prod-01", nome: "Cilindro Pneumático ISO 15552", categoria: "Cilindros", marca: "SMC", codigo: "CIL-1001", estoque: 24, preco: 289.90, preco_antigo: 359.90, descricao: "Cilindro pneumático de dupla ação, corpo em alumínio anodizado, ideal para automação industrial.", imagem_url: IMG[0], destaque: true, em_oferta: true, ativo: true, criado_em: diasAtras(2) },
        { id: "prod-02", nome: "Mangueira Pneumática Poliuretano 8mm", categoria: "Mangueiras", marca: "Festo", codigo: "MNG-2001", estoque: 60, preco: 39.90, preco_antigo: null, descricao: "Rolo de 50m, alta resistência à abrasão e flexibilidade em baixas temperaturas.", imagem_url: IMG[1], destaque: true, em_oferta: false, ativo: true, criado_em: diasAtras(5) },
        { id: "prod-03", nome: "Parafusadeira de Impacto 20V", categoria: "Ferramentas", marca: "Vonder", codigo: "FER-3001", estoque: 15, preco: 549.00, preco_antigo: 649.00, descricao: "Bateria de lítio, torque de até 180Nm, acompanha maleta e 2 baterias.", imagem_url: IMG[2], destaque: true, em_oferta: true, ativo: true, criado_em: diasAtras(1) },
        { id: "prod-04", nome: "Conector Rápido Pneumático 1/4\"", categoria: "Conexões", marca: "SMC", codigo: "CNX-4001", estoque: 200, preco: 12.50, preco_antigo: null, descricao: "Engate rápido em latão niquelado, rosca BSP 1/4 polegada.", imagem_url: IMG[3], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(10) },
        { id: "prod-05", nome: "Placa de Drywall Standard 12,5mm", categoria: "Drywall", marca: "Knauf", codigo: "DRY-5001", estoque: 80, preco: 45.90, preco_antigo: null, descricao: "Placa 1,20 x 1,80m para uso interno, acabamento liso.", imagem_url: IMG[4], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(8) },
        { id: "prod-06", nome: "Cilindro Pneumático Compacto", categoria: "Cilindros", marca: "Festo", codigo: "CIL-1002", estoque: 18, preco: 199.90, preco_antigo: 249.90, descricao: "Curso curto, ideal para espaços reduzidos em linhas de montagem.", imagem_url: IMG[1], destaque: false, em_oferta: true, ativo: true, criado_em: diasAtras(15) },
        { id: "prod-07", nome: "Mangueira de Alta Pressão 3/8\"", categoria: "Mangueiras", marca: "Vonder", codigo: "MNG-2002", estoque: 40, preco: 68.00, preco_antigo: null, descricao: "Reforçada com trama de poliéster, suporta até 20 bar.", imagem_url: IMG[2], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(20) },
        { id: "prod-08", nome: "Furadeira de Impacto 750W", categoria: "Ferramentas", marca: "Tramontina", codigo: "FER-3002", estoque: 22, preco: 329.00, preco_antigo: 389.00, descricao: "Mandril de 13mm, velocidade variável, reversível.", imagem_url: IMG[3], destaque: true, em_oferta: false, ativo: true, criado_em: diasAtras(3) },
        { id: "prod-09", nome: "Conector T Pneumático 6mm", categoria: "Conexões", marca: "Festo", codigo: "CNX-4002", estoque: 150, preco: 9.90, preco_antigo: null, descricao: "Derivação em T para tubos de 6mm, corpo em nylon.", imagem_url: IMG[4], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(12) },
        { id: "prod-10", nome: "Perfil de Aço para Drywall 70mm", categoria: "Drywall", marca: "Knauf", codigo: "DRY-5002", estoque: 100, preco: 22.50, preco_antigo: null, descricao: "Barra de 3m, galvanizado, para estruturas de parede.", imagem_url: IMG[0], destaque: false, em_oferta: true, ativo: true, criado_em: diasAtras(6) },
        { id: "prod-11", nome: "Chave de Impacto Pneumática 1/2\"", categoria: "Ferramentas", marca: "SMC", codigo: "FER-3003", estoque: 10, preco: 459.00, preco_antigo: null, descricao: "Torque máximo de 950Nm, uso profissional em oficinas.", imagem_url: IMG[1], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(25) },
        { id: "prod-12", nome: "Cilindro Guiado Compacto", categoria: "Cilindros", marca: "SMC", codigo: "CIL-1003", estoque: 12, preco: 415.00, preco_antigo: 470.00, descricao: "Com guia antigiro, ideal para posicionamento de peças.", imagem_url: IMG[2], destaque: false, em_oferta: true, ativo: true, criado_em: diasAtras(4) },
        { id: "prod-13", nome: "Mangueira Espiral Poliuretano", categoria: "Mangueiras", marca: "Festo", codigo: "MNG-2003", estoque: 35, preco: 54.90, preco_antigo: null, descricao: "Formato espiral que recolhe sozinha, 8x12mm, 10m de extensão.", imagem_url: IMG[3], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(18) },
        { id: "prod-14", nome: "Conector União Pneumática 10mm", categoria: "Conexões", marca: "Vonder", codigo: "CNX-4003", estoque: 180, preco: 11.20, preco_antigo: null, descricao: "Une dois tubos de 10mm, corpo niquelado.", imagem_url: IMG[4], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(14) },
        { id: "prod-15", nome: "Massa para Rejunte de Drywall 28kg", categoria: "Drywall", marca: "Knauf", codigo: "DRY-5003", estoque: 50, preco: 89.90, preco_antigo: null, descricao: "Pronta para uso, acabamento fino entre placas.", imagem_url: IMG[0], destaque: false, em_oferta: false, ativo: true, criado_em: diasAtras(9) },
        { id: "prod-16", nome: "Esmerilhadeira Angular 4.1/2\"", categoria: "Ferramentas", marca: "Tramontina", codigo: "FER-3004", estoque: 28, preco: 259.00, preco_antigo: 299.00, descricao: "850W, disco de 115mm, empunhadura antivibração.", imagem_url: IMG[1], destaque: true, em_oferta: true, ativo: true, criado_em: diasAtras(7) },
    ]);

    MockDB.seedSeVazio("produto_variacoes", [
        { id: "var-01", produto_id: "prod-04", nome: "1/4\"", codigo: "CNX-4001-14", preco: 12.50, estoque: 200, ordem: 0 },
        { id: "var-02", produto_id: "prod-04", nome: "1/2\"", codigo: "CNX-4001-12", preco: 15.90, estoque: 120, ordem: 1 },
    ]);

    MockDB.seedSeVazio("catalogos", []);
    MockDB.seedSeVazio("profiles", []);
    MockDB.seedSeVazio("enderecos", []);
    MockDB.seedSeVazio("favoritos", []);
    MockDB.seedSeVazio("carrinho_itens", []);
    MockDB.seedSeVazio("pedidos", []);

    /* ---------------- CONTAS DE DEMONSTRAÇÃO PRONTAS PARA USO ---------------- */
    function garantirContasDemo() {
        const usuarios = lerUsuarios();

        function existe(email) { return usuarios.some(u => u.email === email); }

        if (!existe("cliente@demo.com")) {
            const cliente = {
                id: "usr-cliente-demo",
                email: "cliente@demo.com",
                senha: "demo1234",
                nome: "Cliente Demonstração",
                telefone: "(00) 00000-0000",
                documento: "000.000.000-00",
                tipoPessoa: "fisica",
                dataNascimento: "2000-01-01",
                isAdmin: false,
            };
            usuarios.push(cliente);

            // Pedidos e endereço de exemplo, só para o dashboard não ficar vazio.
            MockDB.setTable("pedidos", MockDB.getTable("pedidos").concat([
                { id: gerarId("pedido"), user_id: cliente.id, status: "entregue", criado_em: diasAtras(30) },
                { id: gerarId("pedido"), user_id: cliente.id, status: "enviado", criado_em: diasAtras(4) },
            ]));
            MockDB.setTable("enderecos", MockDB.getTable("enderecos").concat([
                { id: gerarId("endereco"), user_id: cliente.id, apelido: "Casa", destinatario: cliente.nome, cep: "00000-000", rua: "Rua Exemplo", numero: "123", complemento: "", bairro: "Bairro Central", cidade: "Cidade", estado: "UF", padrao: true, criado_em: diasAtras(30) },
            ]));
        }

        if (!existe("admin@demo.com")) {
            usuarios.push({
                id: "usr-admin-demo",
                email: "admin@demo.com",
                senha: "demo1234",
                nome: "Administrador Demonstração",
                telefone: "(00) 00000-0000",
                documento: "00.000.000/0001-00",
                tipoPessoa: "juridica",
                dataNascimento: "2000-01-01",
                isAdmin: true,
            });
        }

        salvarUsuarios(usuarios);
        usuarios.forEach(u => window.demoStore.criarPerfilPadrao(u));
    }

    garantirContasDemo();

})();
