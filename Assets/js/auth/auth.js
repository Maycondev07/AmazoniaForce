/* ==========================================================
   AMAZONIA FORCE
   AUTENTICAÇÃO (Supabase Auth) + PERFIL (tabela public.profiles)
   Requer supabase.js carregado antes deste arquivo.
========================================================== */

window.auth = {

    // Faz login com e-mail e senha
    async login(email, senha) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password: senha
        });

        if (error) {
            return { success: false, message: traduzirErro(error) };
        }

        // Garante que o perfil existe (cobre o caso de o insert do
        // cadastro não ter rolado por falta de sessão/confirmação de e-mail)
        await salvarPerfil(data.user);

        return { success: true, user: data.user };
    },

    // Cria uma conta nova (Pessoa Física usa CPF, Pessoa Jurídica usa CNPJ)
    async register({ nome, email, senha, telefone, documento, tipoPessoa, dataNascimento }) {
        const cpf = tipoPessoa === "juridica" ? null : documento;
        const cnpj = tipoPessoa === "juridica" ? documento : null;

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password: senha,
            options: {
                data: { nome, telefone, cpf, cnpj, tipo_pessoa: tipoPessoa, data_nascimento: dataNascimento }
            }
        });

        if (error) {
            return { success: false, message: traduzirErro(error) };
        }

        // Só existe sessão ativa aqui se a confirmação de e-mail
        // estiver desligada no projeto. Se não existir, o perfil
        // é salvo automaticamente no primeiro login (ver login() acima).
        if (data.session) {
            await salvarPerfil(data.user, { nome, telefone, cpf, cnpj, tipo_pessoa: tipoPessoa, data_nascimento: dataNascimento });
        }

        return { success: true, user: data.user };
    },

    // Login com Google via Supabase OAuth (precisa do provedor Google
    // habilitado em Supabase -> Authentication -> Providers)
    async loginWithGoogle() {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: urlPosLogin() }
        });

        if (error) {
            return { success: false, message: traduzirErro(error) };
        }

        return { success: true };
    },

    // Login com Facebook via Supabase OAuth (precisa do provedor Facebook
    // habilitado em Supabase -> Authentication -> Providers)
    async loginWithFacebook() {
        const { error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: "facebook",
            options: { redirectTo: urlPosLogin() }
        });

        if (error) {
            return { success: false, message: traduzirErro(error) };
        }

        return { success: true };
    },

    // Garante que o perfil existe em public.profiles para o usuário logado.
    // Chamado nas páginas gerais (ui.js) para cobrir também quem entrou
    // via Google/Facebook, já que o fluxo OAuth não passa por login()/register().
    async ensureProfile(user) {
        await salvarPerfil(user);
    },

    // Encerra a sessão atual
    async logout() {
        const { error } = await window.supabaseClient.auth.signOut();

        if (error) {
            console.error("Erro ao sair:", error);
        }

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

// Cria/atualiza a linha do usuário em public.profiles.
// Usa upsert para nunca duplicar (id é a chave, igual ao auth.users.id).
async function salvarPerfil(user, dadosExtras = {}) {
    if (!user) return;

    const meta = user.user_metadata || {};

    const perfil = {
        id: user.id,
        nome: dadosExtras.nome || meta.nome || meta.full_name || meta.name || null,
        telefone: dadosExtras.telefone || meta.telefone || null,
        cpf: dadosExtras.cpf || meta.cpf || null,
        cnpj: dadosExtras.cnpj || meta.cnpj || null,
        tipo_pessoa: dadosExtras.tipo_pessoa || meta.tipo_pessoa || "fisica",
        data_nascimento: dadosExtras.data_nascimento || meta.data_nascimento || null
    };

    const { error } = await window.supabaseClient
        .from("profiles")
        .upsert(perfil, { onConflict: "id" });

    if (error) {
        // Não trava o login/cadastro por causa disso, só avisa no console.
        // Se cair aqui sempre, o mais provável é a policy de INSERT/UPDATE
        // da tabela profiles não estar liberando para o dono do registro
        // (auth.uid() = id).
        console.error("Erro ao salvar perfil em profiles:", error);
    }
}

// Traduz as mensagens de erro mais comuns do Supabase Auth para PT-BR
function traduzirErro(error) {
    const msg = (error && error.message) ? error.message : "";

    if (msg.includes("Invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }
    if (msg.includes("User already registered")) {
        return "Este e-mail já possui uma conta.";
    }
    if (msg.includes("Password should be at least")) {
        return "A senha precisa ter no mínimo 8 caracteres.";
    }
    if (msg.includes("Unable to validate email address")) {
        return "E-mail inválido.";
    }

    return msg || "Ocorreu um erro. Tente novamente.";
}
