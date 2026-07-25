/* ==========================================================
   AMAZONIA FORCE
   BOTÕES DE LOGIN SOCIAL (Google / Facebook)
   Usado em login.html e cadastro.html.
   Requer auth.js carregado antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const googleBtns = document.querySelectorAll(".social-btn.google");
    const facebookBtns = document.querySelectorAll(".social-btn.facebook");

    googleBtns.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            Loading.start(btn, "Redirecionando...");

            const result = await window.auth.loginWithGoogle();

            if (!result.success) {
                Loading.stop(btn);
                Toast.show(result.message, "error");
            }
            // Em caso de sucesso o navegador é redirecionado ao Google,
            // então não há mais nada a fazer aqui.
        });
    });

    facebookBtns.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            Loading.start(btn, "Redirecionando...");

            const result = await window.auth.loginWithFacebook();

            if (!result.success) {
                Loading.stop(btn);
                Toast.show(result.message, "error");
            }
        });
    });

});
