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

setTimeout(()=>{

window.location.href="minha-conta.html";

},1200);

});

});