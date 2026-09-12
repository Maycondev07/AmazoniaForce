/* ==========================================================
   AMAZONIA FORCE — VERSÃO DEMO
   SESSÃO DO USUÁRIO (genérica, local)
   Requer demoStore (supabase.js) carregado antes deste arquivo.
========================================================== */

function usuarioParaSessao(usuario) {
    if (!usuario) return null;

    // Formato parecido com o de um usuário autenticado, para que o
    // restante do site (ui.js, admin-guard.js etc.) continue
    // funcionando sem precisar saber que a conta é local/demo.
    return {
        id: usuario.id,
        email: usuario.email,
        is_admin: !!usuario.isAdmin,
        user_metadata: {
            nome: usuario.nome,
            telefone: usuario.telefone,
            cpf: usuario.tipoPessoa === "juridica" ? null : usuario.documento,
            cnpj: usuario.tipoPessoa === "juridica" ? usuario.documento : null,
            tipo_pessoa: usuario.tipoPessoa,
            data_nascimento: usuario.dataNascimento
        }
    };
}

window.session = {

    // Retorna a sessão ativa (ou null)
    async get() {
        const id = window.demoStore.obterSessaoId();
        if (!id) return null;

        const usuario = window.demoStore.buscarPorId(id);
        if (!usuario) return null;

        return { user: usuarioParaSessao(usuario) };
    },

    // Retorna o usuário logado (ou null)
    async user() {
        const currentSession = await this.get();
        return currentSession ? currentSession.user : null;
    },

    // true/false: existe usuário logado?
    async logged() {
        const currentSession = await this.get();
        return currentSession !== null;
    }

};
