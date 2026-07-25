(async () => {

    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    console.log("Supabase conectado ✔");

    console.log(data);

})();