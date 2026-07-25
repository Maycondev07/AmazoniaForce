document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("registerForm");

if(!form) return;

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const btn=form.querySelector("button[type=submit]");

Loading.start(btn,"Criando conta...");

const nome=document.getElementById("nome").value.trim();

const email=document.getElementById("email").value.trim();

const senha=document.getElementById("senha").value;

const confirmar=document.getElementById("confirmarSenha").value;

const telefone=document.getElementById("telefone").value.trim();

const cpf=document.getElementById("cpf").value.trim();

if(!Validator.email(email)){

Loading.stop(btn);

Toast.show("E-mail inválido","error");

return;

}

if(!Validator.password(senha)){

Loading.stop(btn);

Toast.show("Senha deve possuir no mínimo 8 caracteres.","error");

return;

}

if(senha!==confirmar){

Loading.stop(btn);

Toast.show("As senhas não coincidem.","error");

return;

}

const result=await auth.register({

nome,

email,

senha,

telefone,

cpf

});

Loading.stop(btn);

if(!result.success){

Toast.show(result.message,"error");

return;

}

Toast.show("Conta criada com sucesso!","success");

setTimeout(()=>{

window.location.href="login.html";

},1500);

});

});