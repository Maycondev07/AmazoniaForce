// Assets/js/auth/guards.js

(async()=>{

    const logged = await window.session.logged();

    if(!logged){

        window.location.href="login.html";

    }

})();