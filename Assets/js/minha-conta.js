/* ==========================================================
   AMAZONIA FORCE
   MINHA CONTA — pedidos, favoritos, endereços e dados reais
   Requer: supabase.js, session.js, toast.js, cart.js antes deste arquivo.
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const content = document.querySelector(".account-content");
    if (!content) return; // não estamos em minha-conta.html

    const db = window.supabaseClient;
    const user = await window.session.user();
    if (!user) return; // guards.js já cuida do redirecionamento

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
    function formatarData(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString("pt-BR");
    }

    /* ---------------- ABAS DO MENU LATERAL ---------------- */
    const menuLinks = document.querySelectorAll(".account-menu a[href^='#']:not([data-logout])");
    const secoes = document.querySelectorAll(".account-content > section[id]");

    function ativarAba(hash) {
        const alvo = hash && document.getElementById(hash) ? hash : "dashboard";

        secoes.forEach(s => { s.style.display = s.id === alvo ? "" : "none"; });

        menuLinks.forEach(a => {
            a.parentElement.classList.toggle("active", a.getAttribute("href") === `#${alvo}`);
        });
    }

    menuLinks.forEach(a => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            const hash = a.getAttribute("href").replace("#", "");
            history.replaceState(null, "", `#${hash}`);
            ativarAba(hash);
        });
    });

    ativarAba(window.location.hash.replace("#", ""));

    /* ---------------- DADOS PESSOAIS ---------------- */
    const { data: perfil } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

    const profileNome = document.getElementById("profileNome");
    const profileEmail = document.getElementById("profileEmail");
    const profileTelefone = document.getElementById("profileTelefone");
    const profileCpf = document.getElementById("profileCpf");
    const profileSaveBtn = document.getElementById("profileSaveBtn");

    if (profileEmail) profileEmail.value = user.email || "";
    if (profileNome) profileNome.value = perfil?.nome || "";
    if (profileTelefone) profileTelefone.value = perfil?.telefone || "";
    if (profileCpf) profileCpf.value = perfil?.cpf || "";

    if (profileSaveBtn) {
        profileSaveBtn.addEventListener("click", async () => {
            Loading.start(profileSaveBtn, "Salvando...");
            const { error } = await db.from("profiles").upsert({
                id: user.id,
                nome: profileNome.value.trim() || null,
                telefone: profileTelefone.value.trim() || null,
                cpf: profileCpf.value.trim() || null,
            }, { onConflict: "id" });
            Loading.stop(profileSaveBtn);

            if (error) { Toast.show("Erro ao salvar dados: " + error.message, "error"); return; }
            Toast.show("Dados atualizados!", "success");

            const nameEl = document.querySelector("#accountUserName");
            if (nameEl && profileNome.value.trim()) nameEl.textContent = `Olá, ${profileNome.value.trim()}`;
        });
    }

    /* ---------------- SEGURANÇA (troca de senha) ---------------- */
    const securityBtn = document.getElementById("securitySaveBtn");
    if (securityBtn) {
        securityBtn.addEventListener("click", async () => {
            const atual = document.getElementById("senhaAtual").value;
            const nova = document.getElementById("novaSenha").value;
            const confirmar = document.getElementById("confirmarNovaSenha").value;

            if (!atual || !nova || !confirmar) {
                Toast.show("Preencha todos os campos de senha.", "error");
                return;
            }
            if (nova.length < 8) {
                Toast.show("A nova senha precisa ter no mínimo 8 caracteres.", "error");
                return;
            }
            if (nova !== confirmar) {
                Toast.show("As senhas não coincidem.", "error");
                return;
            }

            Loading.start(securityBtn, "Atualizando...");

            // Confirma a senha atual reautenticando antes de trocar
            const { error: erroLogin } = await db.auth.signInWithPassword({ email: user.email, password: atual });
            if (erroLogin) {
                Loading.stop(securityBtn);
                Toast.show("Senha atual incorreta.", "error");
                return;
            }

            const { error: erroUpdate } = await db.auth.updateUser({ password: nova });
            Loading.stop(securityBtn);

            if (erroUpdate) { Toast.show("Erro ao atualizar senha: " + erroUpdate.message, "error"); return; }

            Toast.show("Senha atualizada com sucesso!", "success");
            document.getElementById("senhaAtual").value = "";
            document.getElementById("novaSenha").value = "";
            document.getElementById("confirmarNovaSenha").value = "";
        });
    }

    /* ---------------- NOTIFICAÇÕES ---------------- */
    const notifOfertas = document.getElementById("notifOfertas");
    const notifPedidos = document.getElementById("notifPedidos");

    if (notifOfertas) notifOfertas.checked = perfil?.receber_ofertas !== false;
    if (notifPedidos) notifPedidos.checked = perfil?.receber_atualizacoes_pedido !== false;

    async function salvarPreferencia(campo, valor) {
        const { error } = await db.from("profiles").update({ [campo]: valor }).eq("id", user.id);
        if (error) { Toast.show("Erro ao salvar preferência.", "error"); return; }
        Toast.show("Preferência salva.", "success");
    }
    if (notifOfertas) notifOfertas.addEventListener("change", () => salvarPreferencia("receber_ofertas", notifOfertas.checked));
    if (notifPedidos) notifPedidos.addEventListener("change", () => salvarPreferencia("receber_atualizacoes_pedido", notifPedidos.checked));

    /* ---------------- PEDIDOS ---------------- */
    const ordersBody = document.getElementById("ordersTableBody");
    const ordersEmpty = document.getElementById("ordersEmpty");
    const statPedidos = document.getElementById("statPedidos");

    const { data: pedidos } = await db
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .order("criado_em", { ascending: false });

    if (statPedidos) statPedidos.textContent = (pedidos || []).length;

    if (ordersBody) {
        if (!pedidos || !pedidos.length) {
            ordersBody.innerHTML = "";
            if (ordersEmpty) ordersEmpty.style.display = "block";
        } else {
            if (ordersEmpty) ordersEmpty.style.display = "none";
            const statusLabel = { pendente: "Pendente", pago: "Pago", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
            const statusClasse = { entregue: "delivered", enviado: "shipping" };
            ordersBody.innerHTML = pedidos.map(p => `
                <tr>
                    <td>#${p.id.slice(0, 8).toUpperCase()}</td>
                    <td>${formatarData(p.criado_em)}</td>
                    <td><span class="status ${statusClasse[p.status] || ""}">${statusLabel[p.status] || p.status}</span></td>
                </tr>
            `).join("");
        }
    }

    /* ---------------- FAVORITOS ---------------- */
    const favGrid = document.getElementById("favoritesGrid");
    const favEmpty = document.getElementById("favoritesEmpty");
    const statFavoritos = document.getElementById("statFavoritos");

    async function carregarFavoritos() {
        const { data: favoritos } = await db
            .from("favoritos")
            .select("id, produto_id, produtos(*)")
            .eq("user_id", user.id)
            .order("criado_em", { ascending: false });

        if (statFavoritos) statFavoritos.textContent = (favoritos || []).length;
        if (!favGrid) return;

        if (!favoritos || !favoritos.length) {
            favGrid.innerHTML = "";
            if (favEmpty) favEmpty.style.display = "block";
            return;
        }
        if (favEmpty) favEmpty.style.display = "none";

        favGrid.innerHTML = favoritos.map(f => {
            const p = f.produtos;
            if (!p) return "";
            return `
                <article class="product-card" data-id="${p.id}" data-name="${escapeHtml(p.nome)}">
                    <a href="produto.html?id=${p.id}" class="product-img">
                        <img src="${p.imagem_url || '../Assets/img/logo.png'}" alt="${escapeHtml(p.nome)}" loading="lazy">
                    </a>
                    <div class="product-info">
                        <h3><a href="produto.html?id=${p.id}" style="text-decoration:none; color:inherit;">${escapeHtml(p.nome)}</a></h3>
                        <div class="price-row">
                            <span class="price price-consult">Consulte o valor com o vendedor</span>
                            <button class="btn-add-cart" aria-label="Adicionar ao Carrinho">🛒</button>
                        </div>
                        <button type="button" class="btn-outline" data-remove-fav="${p.id}" style="width:100%; margin-top:0.8rem;">Remover dos Favoritos</button>
                    </div>
                </article>
            `;
        }).join("");
    }

    if (favGrid) {
        favGrid.addEventListener("click", async (e) => {
            const btn = e.target.closest("[data-remove-fav]");
            if (!btn) return;
            await db.from("favoritos").delete().eq("user_id", user.id).eq("produto_id", btn.dataset.removeFav);
            Toast.show("Removido dos favoritos.", "success");
            if (window.Favoritos) window.Favoritos.refresh();
            carregarFavoritos();
        });
    }

    await carregarFavoritos();

    /* ---------------- ENDEREÇOS ---------------- */
    const addressesList = document.getElementById("addressesList");
    const addressesEmpty = document.getElementById("addressesEmpty");
    const statEnderecos = document.getElementById("statEnderecos");
    const addressForm = document.getElementById("addressForm");
    const addAddressBtn = document.getElementById("addAddressBtn");
    const addressCancelBtn = document.getElementById("addressCancelBtn");

    const addrEls = {
        id: document.getElementById("addressId"),
        apelido: document.getElementById("addressApelido"),
        destinatario: document.getElementById("addressDestinatario"),
        cep: document.getElementById("addressCep"),
        rua: document.getElementById("addressRua"),
        numero: document.getElementById("addressNumero"),
        complemento: document.getElementById("addressComplemento"),
        bairro: document.getElementById("addressBairro"),
        cidade: document.getElementById("addressCidade"),
        estado: document.getElementById("addressEstado"),
        padrao: document.getElementById("addressPadrao"),
    };

    async function carregarEnderecos() {
        const { data: enderecos } = await db
            .from("enderecos")
            .select("*")
            .eq("user_id", user.id)
            .order("padrao", { ascending: false })
            .order("criado_em", { ascending: true });

        if (statEnderecos) statEnderecos.textContent = (enderecos || []).length;
        if (!addressesList) return;

        if (!enderecos || !enderecos.length) {
            addressesList.innerHTML = "";
            if (addressesEmpty) addressesEmpty.style.display = "block";
            return;
        }
        if (addressesEmpty) addressesEmpty.style.display = "none";

        addressesList.innerHTML = enderecos.map(e => `
            <div class="address-card">
                <strong>${escapeHtml(e.apelido || "Endereço")}${e.padrao ? " • Padrão" : ""}</strong>
                <p>${escapeHtml(e.rua || "")}, ${escapeHtml(e.numero || "s/n")}${e.complemento ? " — " + escapeHtml(e.complemento) : ""}</p>
                <p>${escapeHtml(e.bairro || "")} • ${escapeHtml(e.cidade || "")}${e.estado ? "/" + escapeHtml(e.estado) : ""}</p>
                <p>CEP: ${escapeHtml(e.cep || "—")}</p>
                <div style="display:flex; gap:0.6rem;">
                    <button class="btn-outline" data-edit-addr="${e.id}">Editar</button>
                    <button class="btn-outline" data-del-addr="${e.id}">Excluir</button>
                </div>
            </div>
        `).join("");

        addressesList.dataset.cache = JSON.stringify(enderecos);
    }

    function abrirFormulario(dados) {
        addrEls.id.value = dados?.id || "";
        addrEls.apelido.value = dados?.apelido || "";
        addrEls.destinatario.value = dados?.destinatario || "";
        addrEls.cep.value = dados?.cep || "";
        addrEls.rua.value = dados?.rua || "";
        addrEls.numero.value = dados?.numero || "";
        addrEls.complemento.value = dados?.complemento || "";
        addrEls.bairro.value = dados?.bairro || "";
        addrEls.cidade.value = dados?.cidade || "";
        addrEls.estado.value = dados?.estado || "";
        addrEls.padrao.checked = !!dados?.padrao;
        addressForm.style.display = "block";
        addressForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (addAddressBtn) addAddressBtn.addEventListener("click", () => abrirFormulario(null));
    if (addressCancelBtn) addressCancelBtn.addEventListener("click", () => { addressForm.style.display = "none"; });

    if (addressesList) {
        addressesList.addEventListener("click", async (e) => {
            const editBtn = e.target.closest("[data-edit-addr]");
            const delBtn = e.target.closest("[data-del-addr]");

            if (editBtn) {
                const cache = JSON.parse(addressesList.dataset.cache || "[]");
                const alvo = cache.find(x => x.id === editBtn.dataset.editAddr);
                if (alvo) abrirFormulario(alvo);
            }

            if (delBtn) {
                if (!confirm("Excluir este endereço?")) return;
                await db.from("enderecos").delete().eq("id", delBtn.dataset.delAddr).eq("user_id", user.id);
                Toast.show("Endereço removido.", "success");
                carregarEnderecos();
            }
        });
    }

    if (addressForm) {
        addressForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!addrEls.rua.value.trim() || !addrEls.cidade.value.trim()) {
                Toast.show("Preencha ao menos rua e cidade.", "error");
                return;
            }

            const payload = {
                user_id: user.id,
                apelido: addrEls.apelido.value.trim() || null,
                destinatario: addrEls.destinatario.value.trim() || null,
                cep: addrEls.cep.value.trim() || null,
                rua: addrEls.rua.value.trim() || null,
                numero: addrEls.numero.value.trim() || null,
                complemento: addrEls.complemento.value.trim() || null,
                bairro: addrEls.bairro.value.trim() || null,
                cidade: addrEls.cidade.value.trim() || null,
                estado: addrEls.estado.value.trim().toUpperCase() || null,
                padrao: addrEls.padrao.checked,
            };

            const saveBtn = document.getElementById("addressSaveBtn");
            Loading.start(saveBtn, "Salvando...");

            let error;
            if (addrEls.id.value) {
                ({ error } = await db.from("enderecos").update(payload).eq("id", addrEls.id.value));
            } else {
                ({ error } = await db.from("enderecos").insert(payload));
            }

            Loading.stop(saveBtn);

            if (error) { Toast.show("Erro ao salvar endereço: " + error.message, "error"); return; }

            Toast.show("Endereço salvo!", "success");
            addressForm.reset();
            addressForm.style.display = "none";
            carregarEnderecos();
        });
    }

    await carregarEnderecos();

    /* ---------------- ITENS NO CARRINHO (card do dashboard) ---------------- */
    const statCarrinho = document.getElementById("statCarrinho");
    if (statCarrinho) {
        const { data: itensCarrinho } = await db.from("carrinho_itens").select("quantidade").eq("user_id", user.id);
        const total = (itensCarrinho || []).reduce((acc, i) => acc + i.quantidade, 0);
        statCarrinho.textContent = total;
    }

});
