class Validator{

    static email(email){

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    }

    static password(password){

        return password.length>=8;

    }

    static required(value){

        return value.trim()!=="";

    }

    static phone(value){

        const digits=(value||"").replace(/\D/g,"");

        return digits.length>=10 && digits.length<=11;

    }

    static cpf(value){

        const cpf=(value||"").replace(/\D/g,"");

        if(cpf.length!==11 || /^(\d)\1{10}$/.test(cpf)) return false;

        let soma=0;
        for(let i=0;i<9;i++) soma+=parseInt(cpf.charAt(i))*(10-i);
        let resto=(soma*10)%11;
        if(resto===10||resto===11) resto=0;
        if(resto!==parseInt(cpf.charAt(9))) return false;

        soma=0;
        for(let i=0;i<10;i++) soma+=parseInt(cpf.charAt(i))*(11-i);
        resto=(soma*10)%11;
        if(resto===10||resto===11) resto=0;
        if(resto!==parseInt(cpf.charAt(10))) return false;

        return true;

    }

    static cnpj(value){

        const cnpj=(value||"").replace(/\D/g,"");

        if(cnpj.length!==14 || /^(\d)\1{13}$/.test(cnpj)) return false;

        let tamanho=cnpj.length-2;
        let numeros=cnpj.substring(0,tamanho);
        const digitos=cnpj.substring(tamanho);
        let soma=0;
        let pos=tamanho-7;

        for(let i=tamanho;i>=1;i--){
            soma+=parseInt(numeros.charAt(tamanho-i))*pos--;
            if(pos<2) pos=9;
        }

        let resultado=soma%11<2?0:11-(soma%11);
        if(resultado!==parseInt(digitos.charAt(0))) return false;

        tamanho+=1;
        numeros=cnpj.substring(0,tamanho);
        soma=0;
        pos=tamanho-7;

        for(let i=tamanho;i>=1;i--){
            soma+=parseInt(numeros.charAt(tamanho-i))*pos--;
            if(pos<2) pos=9;
        }

        resultado=soma%11<2?0:11-(soma%11);
        if(resultado!==parseInt(digitos.charAt(1))) return false;

        return true;

    }

    static documento(value,tipo){

        return tipo==="juridica" ? this.cnpj(value) : this.cpf(value);

    }

}

window.Validator=Validator;