-- ==========================================================================
-- AMAZÔNIA FORCE — Variações de produto + botão "Em oferta"
-- Rode em: Supabase -> SQL Editor -> New query -> Run
-- Pré-requisito: já ter rodado setup-produtos.sql e setup-funcionalidades.sql
-- ==========================================================================

-- 1) Botão explícito "Em oferta" (independente de ter preço antigo cadastrado)
alter table public.produtos
    add column if not exists em_oferta boolean not null default false;

-- 2) Variações do produto (ex.: Bocal 1/2", Bocal 1/4" dentro do mesmo anúncio)
create table if not exists public.produto_variacoes (
    id uuid primary key default gen_random_uuid(),
    produto_id uuid not null references public.produtos(id) on delete cascade,
    nome text not null,              -- ex.: "1/2", "1/4", "Azul", "P"
    codigo text,                     -- SKU/código opcional da variação
    preco numeric(10,2),             -- se vazio, usa o preço do produto principal
    estoque integer not null default 0,
    imagem_url text,                 -- se vazia, usa a imagem do produto principal
    ordem integer not null default 0,
    criado_em timestamptz not null default now()
);

alter table public.produto_variacoes enable row level security;

drop policy if exists "Variacoes de produtos ativos sao publicas" on public.produto_variacoes;
create policy "Variacoes de produtos ativos sao publicas"
    on public.produto_variacoes for select
    using (
        public.is_admin(auth.uid())
        or exists (
            select 1 from public.produtos p
            where p.id = produto_id and p.ativo = true
        )
    );

drop policy if exists "Admins podem inserir variacoes" on public.produto_variacoes;
create policy "Admins podem inserir variacoes"
    on public.produto_variacoes for insert
    with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar variacoes" on public.produto_variacoes;
create policy "Admins podem atualizar variacoes"
    on public.produto_variacoes for update
    using (public.is_admin(auth.uid()));

drop policy if exists "Admins podem excluir variacoes" on public.produto_variacoes;
create policy "Admins podem excluir variacoes"
    on public.produto_variacoes for delete
    using (public.is_admin(auth.uid()));

-- 3) Carrinho passa a poder referenciar uma variação específica do produto
alter table public.carrinho_itens
    add column if not exists variacao_id uuid references public.produto_variacoes(id) on delete set null;

-- A regra antiga era "1 linha por produto por usuário". Agora passa a ser
-- "1 linha por produto+variação por usuário" (variações diferentes do
-- mesmo produto podem conviver no carrinho).
alter table public.carrinho_itens
    drop constraint if exists carrinho_itens_user_id_produto_id_key;

alter table public.carrinho_itens
    drop constraint if exists carrinho_itens_user_id_produto_id_variacao_id_key;

alter table public.carrinho_itens
    add constraint carrinho_itens_user_id_produto_id_variacao_id_key
    unique (user_id, produto_id, variacao_id);

-- 4) Itens de pedido também guardam qual variação foi comprada
--    (fica registrado o nome, mesmo que a variação seja excluída depois)
alter table public.itens_pedido
    add column if not exists variacao_id uuid references public.produto_variacoes(id) on delete set null;

alter table public.itens_pedido
    add column if not exists nome_variacao text;
