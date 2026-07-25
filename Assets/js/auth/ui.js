/* ==========================================================
   AMAZONIA FORCE
   UI REATIVA AO ESTADO DE LOGIN
   Atualiza o botão "Entrar" do header e, quando presentes,
   os dados do usuário na página Minha Conta (via public.profiles).
========================================================== */

(async () => {

    const user = await window.session.user();

    // Header: troca "Entrar" por "Minha Conta" quando logado
    const loginBtn = document.querySelector("#loginButton");
    if (loginBtn && user) {
        loginBtn.textContent = "Minha Conta";
        loginBtn.href = loginBtn.getAttribute("href").includes("/Routes/")
            ? "Routes/minha-conta.html"
            : "minha-conta.html";
    }

    // Página Minha Conta: preenche nome e e-mail do usuário logado
    const nameEl = document.querySelector("#accountUserName");
    const emailEl = document.querySelector("#accountUserEmail");

    if (!user || (!nameEl && !emailEl)) return;

    if (emailEl) emailEl.textContent = user.email;

    if (nameEl) {
        // Tenta a tabela profiles primeiro (fonte da verdade);
        // se não achar, cai pro metadata salvo no cadastro.
        let nome = user.user_metadata ? user.user_metadata.nome : null;

        const { data, error } = await window.supabaseClient
            .from("profiles")
            .select("nome")
            .eq("id", user.id)
            .maybeSingle();

        if (!error && data && data.nome) {
            nome = data.nome;
        }

        nameEl.textContent = `Olá, ${nome || "Cliente"}`;
    }

})();
