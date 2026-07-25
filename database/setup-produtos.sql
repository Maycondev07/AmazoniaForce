-- ==========================================================================
-- AMAZÔNIA FORCE — Setup do sistema de produtos
-- Rode este script uma vez em: Supabase -> SQL Editor -> New query -> Run
-- ==========================================================================

-- 1) Sinalizador de administrador na tabela de perfis já existente
alter table public.profiles
    add column if not exists is_admin boolean not null default false;

-- 2) Função auxiliar para checar se um usuário é admin
--    (usada nas políticas de segurança abaixo)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
    select coalesce(
        (select is_admin from public.profiles where id = uid),
        false
    );
$$;

-- 3) Tabela de produtos
create table if not exists public.produtos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    descricao text,
    categoria text,
    marca text,
    codigo text,
    preco numeric(10,2) not null,
    preco_antigo numeric(10,2),
    estoque integer not null default 0,
    imagem_url text,
    destaque boolean not null default false,
    ativo boolean not null default true,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

-- Mantém "atualizado_em" sempre em dia
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$;

drop trigger if exists trg_produtos_touch on public.produtos;
create trigger trg_produtos_touch
    before update on public.produtos
    for each row execute function public.touch_atualizado_em();

-- 4) Segurança (RLS) da tabela de produtos
alter table public.produtos enable row level security;

drop policy if exists "Produtos ativos sao publicos" on public.produtos;
create policy "Produtos ativos sao publicos"
    on public.produtos for select
    using (ativo = true or public.is_admin(auth.uid()));

drop policy if exists "Admins podem inserir produtos" on public.produtos;
create policy "Admins podem inserir produtos"
    on public.produtos for insert
    with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar produtos" on public.produtos;
create policy "Admins podem atualizar produtos"
    on public.produtos for update
    using (public.is_admin(auth.uid()));

drop policy if exists "Admins podem excluir produtos" on public.produtos;
create policy "Admins podem excluir produtos"
    on public.produtos for delete
    using (public.is_admin(auth.uid()));

-- 5) Bucket de armazenamento para as imagens dos produtos
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "Imagens de produtos sao publicas" on storage.objects;
create policy "Imagens de produtos sao publicas"
    on storage.objects for select
    using (bucket_id = 'produtos');

drop policy if exists "Admins podem enviar imagens de produtos" on storage.objects;
create policy "Admins podem enviar imagens de produtos"
    on storage.objects for insert
    with check (bucket_id = 'produtos' and public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar imagens de produtos" on storage.objects;
create policy "Admins podem atualizar imagens de produtos"
    on storage.objects for update
    using (bucket_id = 'produtos' and public.is_admin(auth.uid()));

drop policy if exists "Admins podem excluir imagens de produtos" on storage.objects;
create policy "Admins podem excluir imagens de produtos"
    on storage.objects for delete
    using (bucket_id = 'produtos' and public.is_admin(auth.uid()));

-- ==========================================================================
-- 6) ÚLTIMO PASSO (faça manualmente, depois de já ter uma conta criada
--    pelo cadastro.html do site): torne seu usuário administrador.
--
--    a) Descubra seu ID: Supabase -> Authentication -> Users -> copie o UUID
--       do seu usuário.
--    b) Rode o comando abaixo substituindo o UUID:
--
-- update public.profiles set is_admin = true where id = 'COLE-O-UUID-AQUI';
--
--    Se sua conta ainda não apareceu em public.profiles (isso só é criado
--    no primeiro login), faça login uma vez no site e rode o comando depois.
-- ==========================================================================
