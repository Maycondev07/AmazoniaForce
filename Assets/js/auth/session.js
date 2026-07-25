/* ==========================================================
   AMAZONIA FORCE
   SESSÃO DO USUÁRIO (via Supabase Auth)
   Requer supabase.js carregado antes deste arquivo.
========================================================== */

window.session = {

    // Retorna a sessão ativa do Supabase (ou null)
    async get() {
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) {
            console.error("Erro ao obter sessão:", error);
            return null;
        }
        return data.session;
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
