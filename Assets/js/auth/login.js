document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("loginForm");

if(!form) return;

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const btn=form.querySelector("button[type=submit]");

Loading.start(btn,"Entrando...");

const email=document.getElementById("email").value.trim();

const senha=document.getElementById("senha").value;

const result=await auth.login(email,senha);

Loading.stop(btn);

if(!result.success){

Toast.show(result.message,"error");

return;

}

Toast.show("Login realizado.","success");

let destino = "minha-conta.html";
try {
    const salvo = localStorage.getItem("redirectAfterLogin");
    if (salvo) {
        destino = salvo;
        localStorage.removeItem("redirectAfterLogin");
    }
} catch (e) { /* ignore */ }

setTimeout(()=>{

window.location.href=destino;

},1200);

});

});