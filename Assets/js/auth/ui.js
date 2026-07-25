// Assets/js/auth/ui.js

(async()=>{

    const user = await window.session.user();

    const loginBtn = document.querySelector("#loginButton");

    if(!loginBtn) return;

    if(user){

        loginBtn.innerHTML="Minha Conta";

        loginBtn.href="minha-conta.html";

    }

})();