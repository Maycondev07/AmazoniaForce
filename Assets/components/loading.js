class Loading{

    static start(button,text="Carregando..."){

        button.dataset.original=button.innerHTML;

        button.disabled=true;

        button.classList.add("loading");

        button.innerHTML=`
        <span class="loading-spinner"></span>
        ${text}
        `;

    }

    static stop(button){

        button.disabled=false;

        button.classList.remove("loading");

        button.innerHTML=button.dataset.original;

    }

}

window.Loading=Loading;