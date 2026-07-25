document.addEventListener("click", (e) => {

    const btn = e.target.closest("[data-logout]");

    if (!btn) return;

    e.preventDefault();

    if (window.auth) {
        window.auth.logout();
    }

});