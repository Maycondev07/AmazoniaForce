// ================================
// AMAZONIA FORCE AUTH SYSTEM
// ================================

const auth = {

    async register(userData){

        try{

            const {
                nome,
                email,
                senha,
                telefone,
                cpf
            } = userData;

            const { data, error } =
            await window.supabaseClient.auth.signUp({

                email,
                password: senha

            });

            if(error)
                throw error;

            const user = data.user;

            if(!user)
                throw new Error("Usuário não criado.");

            const { error:profileError } =
            await window.supabaseClient

            .from("profiles")

            .insert({

                id:user.id,

                nome,

                telefone,

                cpf

            });

            if(profileError)
                throw profileError;

            return {

                success:true,

                user

            };

        }

        catch(err){

            return{

                success:false,

                message:err.message

            };

        }

    },

    async login(email,password){

        try{

            const {data,error} =

            await window.supabaseClient.auth.signInWithPassword({

                email,

                password

            });

            if(error)
                throw error;

            return{

                success:true,

                user:data.user

            };

        }

        catch(err){

            return{

                success:false,

                message:err.message

            };

        }

    },

    async logout(){

        await window.supabaseClient.auth.signOut();

        window.location.href="/";

    },

    async currentUser(){

        const {

            data:{user}

        }=await window.supabaseClient.auth.getUser();

        return user;

    }

}

window.auth=auth;