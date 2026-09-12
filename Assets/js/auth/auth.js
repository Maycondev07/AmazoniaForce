/* ==========================================================
   AMAZONIA FORCE — VERSÃO DEMO
   AUTENTICAÇÃO GENÉRICA (100% local, sem backend real)
   Nenhuma conta criada aqui é enviada para qualquer servidor —
   tudo fica salvo no localStorage do próprio navegador, apenas
   para fins de demonstração do fluxo de login/cadastro.
   Requer supabase.js (demoStore) carregado antes deste arquivo.
========================================================== */

window.auth = {

    // Faz login com e-mail e senha
    async login(email, senha) {
        const usuario = window.demoStore.buscarPorEmail(email);

        if (!usuario || usuario.senha !== senha) {
            return { success: false, message: "E-mail ou senha incorretos." };
        }

        window.demoStore.definirSessaoId(usuario.id);

        const sessao = await window.session.get();
        return { success: true, user: sessao.user };
    },

    // Cria uma conta de demonstração nova (Pessoa Física usa CPF,
    // Pessoa Jurídica usa CNPJ) — fica salva só neste navegador.
    async register({ nome, email, senha, telefone, documento, tipoPessoa, dataNascimento }) {
        if (window.demoStore.buscarPorEmail(email)) {
            return { success: false, message: "Este e-mail já possui uma conta." };
        }

        if (!senha || senha.length < 8) {
            return { success: false, message: "A senha precisa ter no mínimo 8 caracteres." };
        }

        const novoUsuario = {
            id: window.demoStore.gerarId(),
            email,
            senha,
            nome,
            telefone,
            documento,
            tipoPessoa,
            dataNascimento,
            isAdmin: false
        };

        window.demoStore.adicionarUsuario(novoUsuario);

        return { success: true, user: usuarioParaSessaoPublico(novoUsuario) };
    },

    // Login social simulado — como este é um site de demonstração, não
    // há integração real com Google/Facebook. Entra com uma conta de
    // demonstração genérica só para mostrar o fluxo funcionando.
    async loginWithGoogle() {
        return loginSocialDemo("Visitante (Google Demo)", "visitante-google@demo.com");
    },

    async loginWithFacebook() {
        return loginSocialDemo("Visitante (Facebook Demo)", "visitante-facebook@demo.com");
    },

    // Mantido por compatibilidade com páginas que chamam isso após
    // login social — na versão demo não há nada extra para garantir.
    async ensureProfile() {
        return;
    },

    // Encerra a sessão atual
    async logout() {
        window.demoStore.limparSessao();

        const emRoutes = window.location.pathname.includes("/Routes/");
        window.location.href = emRoutes ? "login.html" : "Routes/login.html";
    }

};

// Monta a URL de destino após login (inclusive login social), respeitando
// se a página atual está dentro de /Routes/ ou na raiz do site.
function urlPosLogin() {
    const emRoutes = window.location.pathname.includes("/Routes/");
    const caminho = emRoutes ? "minha-conta.html" : "Routes/minha-conta.html";
    return new URL(caminho, window.location.href).href;
}

function usuarioParaSessaoPublico(usuario) {
    return {
        id: usuario.id,
        email: usuario.email,
        is_admin: !!usuario.isAdmin,
        user_metadata: { nome: usuario.nome, telefone: usuario.telefone }
    };
}

async function loginSocialDemo(nomeExibicao, emailDemo) {
    let usuario = window.demoStore.buscarPorEmail(emailDemo);

    if (!usuario) {
        usuario = {
            id: window.demoStore.gerarId(),
            email: emailDemo,
            senha: null,
            nome: nomeExibicao,
            telefone: "",
            documento: "",
            tipoPessoa: "fisica",
            dataNascimento: "",
            isAdmin: false
        };
        window.demoStore.adicionarUsuario(usuario);
    }

    window.demoStore.definirSessaoId(usuario.id);

    setTimeout(() => {
        window.location.href = urlPosLogin();
    }, 600);

    return { success: true };
}
