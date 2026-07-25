// Assets/js/auth/session.js

const session = {

    async user(){

        const {

            data:{user}

        } = await window.supabaseClient.auth.getUser();

        return user;

    },

    async logged(){

        const user = await this.user();

        return user !== null;

    }

};

window.session = session;