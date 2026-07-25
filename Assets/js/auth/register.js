document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("registerForm");

if(!form) return;

const radiosTipo=document.querySelectorAll('input[name="tipo"]');
const labelDocumento=document.getElementById("labelDocumento");
const labelNome=document.getElementById("labelNome");
const inputDocumento=document.getElementById("documento");

function tipoSelecionado(){
    const marcado=document.querySelector('input[name="tipo"]:checked');
    return marcado ? marcado.value : "fisica";
}

function atualizarCamposPorTipo(){

    const tipo=tipoSelecionado();

    if(tipo==="juridica"){
        labelDocumento.textContent="CNPJ";
        inputDocumento.placeholder="00.000.000/0000-00";
        labelNome.textContent="Razão Social";
    }else{
        labelDocumento.textContent="CPF";
        inputDocumento.placeholder="000.000.000-00";
        labelNome.textContent="Nome Completo";
    }

    inputDocumento.value="";

}

radiosTipo.forEach((radio)=>radio.addEventListener("change",atualizarCamposPorTipo));

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const btn=form.querySelector("button[type=submit]");

Loading.start(btn,"Criando conta...");

const tipoPessoa=tipoSelecionado();

const nome=document.getElementById("nome").value.trim();

const email=document.getElementById("email").value.trim();

const senha=document.getElementById("senha").value;

const telefone=document.getElementById("telefone").value.trim();

const documento=document.getElementById("documento").value.trim();

const dataNascimento=document.getElementById("dataNascimento").value;

if(!Validator.required(nome)){

Loading.stop(btn);

Toast.show(tipoPessoa==="juridica" ? "Informe a razão social." : "Informe seu nome completo.","error");

return;

}

if(!Validator.email(email)){

Loading.stop(btn);

Toast.show("E-mail inválido","error");

return;

}

if(!Validator.documento(documento,tipoPessoa)){

Loading.stop(btn);

Toast.show(tipoPessoa==="juridica" ? "CNPJ inválido." : "CPF inválido.","error");

return;

}

if(!Validator.phone(telefone)){

Loading.stop(btn);

Toast.show("Telefone inválido.","error");

return;

}

if(!dataNascimento){

Loading.stop(btn);

Toast.show("Informe a data de nascimento.","error");

return;

}

if(!Validator.password(senha)){

Loading.stop(btn);

Toast.show("Senha deve possuir no mínimo 8 caracteres.","error");

return;

}

const result=await auth.register({

nome,

email,

senha,

telefone,

documento,

tipoPessoa,

dataNascimento

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
