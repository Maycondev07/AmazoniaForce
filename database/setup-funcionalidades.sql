-- ==========================================================================
-- AMAZÔNIA FORCE — Setup das funcionalidades do site (Etapa 2)
-- Rode em: Supabase -> SQL Editor -> New query -> Run
-- Pré-requisito: já ter rodado database/setup-produtos.sql antes deste.
-- ==========================================================================

-- 1) CARRINHO (persistente, por usuário logado) --------------------------
create table if not exists public.carrinho_itens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    produto_id uuid not null references public.produtos(id) on delete cascade,
    quantidade integer not null default 1 check (quantidade > 0),
    criado_em timestamptz not null default now(),
    unique (user_id, produto_id)
);

alter table public.carrinho_itens enable row level security;

drop policy if exists "usuario ve seu carrinho" on public.carrinho_itens;
create policy "usuario ve seu carrinho"
    on public.carrinho_itens for select
    using (auth.uid() = user_id);

drop policy if exists "usuario insere no seu carrinho" on public.carrinho_itens;
create policy "usuario insere no seu carrinho"
    on public.carrinho_itens for insert
    with check (auth.uid() = user_id);

drop policy if exists "usuario atualiza seu carrinho" on public.carrinho_itens;
create policy "usuario atualiza seu carrinho"
    on public.carrinho_itens for update
    using (auth.uid() = user_id);

drop policy if exists "usuario remove do seu carrinho" on public.carrinho_itens;
create policy "usuario remove do seu carrinho"
    on public.carrinho_itens for delete
    using (auth.uid() = user_id);

-- 2) FAVORITOS -------------------------------------------------------------
create table if not exists public.favoritos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    produto_id uuid not null references public.produtos(id) on delete cascade,
    criado_em timestamptz not null default now(),
    unique (user_id, produto_id)
);

alter table public.favoritos enable row level security;

drop policy if exists "usuario ve seus favoritos" on public.favoritos;
create policy "usuario ve seus favoritos"
    on public.favoritos for select
    using (auth.uid() = user_id);

drop policy if exists "usuario adiciona favorito" on public.favoritos;
create policy "usuario adiciona favorito"
    on public.favoritos for insert
    with check (auth.uid() = user_id);

drop policy if exists "usuario remove favorito" on public.favoritos;
create policy "usuario remove favorito"
    on public.favoritos for delete
    using (auth.uid() = user_id);

-- 3) ENDEREÇOS ---------------------------------------------------------------
create table if not exists public.enderecos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    apelido text,
    destinatario text,
    cep text,
    rua text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    estado text,
    padrao boolean not null default false,
    criado_em timestamptz not null default now()
);

alter table public.enderecos enable row level security;

drop policy if exists "usuario ve seus enderecos" on public.enderecos;
create policy "usuario ve seus enderecos"
    on public.enderecos for select
    using (auth.uid() = user_id);

drop policy if exists "usuario insere endereco" on public.enderecos;
create policy "usuario insere endereco"
    on public.enderecos for insert
    with check (auth.uid() = user_id);

drop policy if exists "usuario atualiza endereco" on public.enderecos;
create policy "usuario atualiza endereco"
    on public.enderecos for update
    using (auth.uid() = user_id);

drop policy if exists "usuario remove endereco" on public.enderecos;
create policy "usuario remove endereco"
    on public.enderecos for delete
    using (auth.uid() = user_id);

-- 4) PEDIDOS -----------------------------------------------------------------
create table if not exists public.pedidos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pendente', -- pendente | pago | enviado | entregue | cancelado
    subtotal numeric(10,2) not null,
    frete numeric(10,2) not null default 0,
    total numeric(10,2) not null,
    forma_pagamento text,
    endereco_entrega jsonb,
    criado_em timestamptz not null default now()
);

alter table public.pedidos enable row level security;

drop policy if exists "usuario ve seus pedidos" on public.pedidos;
create policy "usuario ve seus pedidos"
    on public.pedidos for select
    using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "usuario cria pedido" on public.pedidos;
create policy "usuario cria pedido"
    on public.pedidos for insert
    with check (auth.uid() = user_id);

drop policy if exists "admin atualiza pedido" on public.pedidos;
create policy "admin atualiza pedido"
    on public.pedidos for update
    using (public.is_admin(auth.uid()));

create table if not exists public.itens_pedido (
    id uuid primary key default gen_random_uuid(),
    pedido_id uuid not null references public.pedidos(id) on delete cascade,
    produto_id uuid references public.produtos(id) on delete set null,
    nome_produto text not null,
    preco_unitario numeric(10,2) not null,
    quantidade integer not null default 1
);

alter table public.itens_pedido enable row level security;

drop policy if exists "usuario ve itens dos seus pedidos" on public.itens_pedido;
create policy "usuario ve itens dos seus pedidos"
    on public.itens_pedido for select
    using (
        exists (
            select 1 from public.pedidos p
            where p.id = pedido_id
              and (p.user_id = auth.uid() or public.is_admin(auth.uid()))
        )
    );

drop policy if exists "usuario insere itens em seus pedidos" on public.itens_pedido;
create policy "usuario insere itens em seus pedidos"
    on public.itens_pedido for insert
    with check (
        exists (
            select 1 from public.pedidos p
            where p.id = pedido_id and p.user_id = auth.uid()
        )
    );

-- 5) MENSAGENS DE CONTATO -----------------------------------------------------
create table if not exists public.mensagens_contato (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text not null,
    telefone text,
    assunto text,
    mensagem text not null,
    lida boolean not null default false,
    criado_em timestamptz not null default now()
);

alter table public.mensagens_contato enable row level security;

drop policy if exists "qualquer um pode enviar mensagem" on public.mensagens_contato;
create policy "qualquer um pode enviar mensagem"
    on public.mensagens_contato for insert
    with check (true);

drop policy if exists "admin ve mensagens" on public.mensagens_contato;
create policy "admin ve mensagens"
    on public.mensagens_contato for select
    using (public.is_admin(auth.uid()));

drop policy if exists "admin atualiza mensagens" on public.mensagens_contato;
create policy "admin atualiza mensagens"
    on public.mensagens_contato for update
    using (public.is_admin(auth.uid()));

-- 6) CUPONS DE DESCONTO ----------------------------------------------------
create table if not exists public.cupons (
    id uuid primary key default gen_random_uuid(),
    codigo text not null unique,
    percentual numeric(5,2) not null check (percentual > 0 and percentual <= 100),
    ativo boolean not null default true,
    validade date,
    criado_em timestamptz not null default now()
);

alter table public.cupons enable row level security;

drop policy if exists "cupons ativos sao publicos" on public.cupons;
create policy "cupons ativos sao publicos"
    on public.cupons for select
    using (ativo = true or public.is_admin(auth.uid()));

drop policy if exists "admin gerencia cupons" on public.cupons;
create policy "admin gerencia cupons insert"
    on public.cupons for insert
    with check (public.is_admin(auth.uid()));
create policy "admin gerencia cupons update"
    on public.cupons for update
    using (public.is_admin(auth.uid()));
create policy "admin gerencia cupons delete"
    on public.cupons for delete
    using (public.is_admin(auth.uid()));

-- Cupom de exemplo pra já testar (10% off) — apague ou edite à vontade
insert into public.cupons (codigo, percentual)
values ('BEMVINDO10', 10)
on conflict (codigo) do nothing;

-- ==========================================================================
-- Pronto. Nenhuma ação manual extra necessária além de rodar este script.
-- ==========================================================================
