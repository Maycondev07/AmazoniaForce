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

}

window.Validator=Validator;