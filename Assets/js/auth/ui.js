/* ==========================================================
   AMAZONIA FORCE — VERSÃO DEMO
   UI REATIVA AO ESTADO DE LOGIN (genérica, local)
   Atualiza o botão "Entrar" do header e, quando presentes,
   os dados do usuário na página Minha Conta.
========================================================== */

(async () => {

    const user = await window.session.user();

    // Header: troca "Entrar" por "Minha Conta" quando logado
    const loginBtn = document.querySelector("#loginButton");
    const emRoutes = window.location.pathname.includes("/Routes/");

    if (loginBtn && user) {
        loginBtn.textContent = "Minha Conta";
        loginBtn.href = emRoutes ? "minha-conta.html" : "Routes/minha-conta.html";
    }

    // Barra de navegação inferior (mobile): mesmo destino do botão do cabeçalho
    const mobileNavAccount = document.querySelector("#mobileNavAccount");
    if (mobileNavAccount && user) {
        mobileNavAccount.href = emRoutes ? "minha-conta.html" : "Routes/minha-conta.html";
        const label = mobileNavAccount.querySelector("span:last-child");
        if (label) label.textContent = "Conta";
        mobileNavAccount.querySelector(".mobile-nav-icon").textContent = "👤";
    }

    // Links visíveis só para administradores (ex.: "Painel Admin" em Minha Conta)
    if (user && user.is_admin) {
        document.querySelectorAll(".admin-only-link").forEach(el => el.classList.add("visible"));
    }

    // Página Minha Conta: preenche nome e e-mail do usuário logado
    const nameEl = document.querySelector("#accountUserName");
    const emailEl = document.querySelector("#accountUserEmail");

    if (!user || (!nameEl && !emailEl)) return;

    if (emailEl) emailEl.textContent = user.email;

    if (nameEl) {
        const nome = user.user_metadata ? user.user_metadata.nome : null;
        nameEl.textContent = `Olá, ${nome || "Cliente"}`;
    }

})();
