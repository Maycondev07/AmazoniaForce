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

    // Cria uma conta nova
    async register({ nome, email, senha, telefone, cpf }) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password: senha,
            options: {
                data: { nome, telefone, cpf }
            }
        });

        if (error) {
            return { success: false, message: traduzirErro(error) };
        }

        // Só existe sessão ativa aqui se a confirmação de e-mail
        // estiver desligada no projeto. Se não existir, o perfil
        // é salvo automaticamente no primeiro login (ver login() acima).
        if (data.session) {
            await salvarPerfil(data.user, { nome, telefone, cpf });
        }

        return { success: true, user: data.user };
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

// Cria/atualiza a linha do usuário em public.profiles.
// Usa upsert para nunca duplicar (id é a chave, igual ao auth.users.id).
async function salvarPerfil(user, dadosExtras = {}) {
    if (!user) return;

    const meta = user.user_metadata || {};

    const perfil = {
        id: user.id,
        nome: dadosExtras.nome || meta.nome || null,
        telefone: dadosExtras.telefone || meta.telefone || null,
        cpf: dadosExtras.cpf || meta.cpf || null
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
