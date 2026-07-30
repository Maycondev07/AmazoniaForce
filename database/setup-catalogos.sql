-- ==========================================================================
-- AMAZÔNIA FORCE — Catálogos para download (PDF)
-- Rode em: Supabase -> SQL Editor -> New query -> Run
-- Pré-requisito: já ter rodado database/setup-produtos.sql antes deste
-- (usa a função public.is_admin já criada nele).
-- ==========================================================================

create table if not exists public.catalogos (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    descricao text,
    marca text,
    arquivo_url text not null,   -- link do arquivo PDF
    capa_url text,               -- imagem de capa (opcional)
    tamanho_kb integer,          -- tamanho do PDF em KB (opcional, só pra exibir "2,4 MB")
    ordem integer not null default 0,
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

alter table public.catalogos enable row level security;

drop policy if exists "Catalogos ativos sao publicos" on public.catalogos;
create policy "Catalogos ativos sao publicos"
    on public.catalogos for select
    using (ativo = true or public.is_admin(auth.uid()));

drop policy if exists "Admins podem inserir catalogos" on public.catalogos;
create policy "Admins podem inserir catalogos"
    on public.catalogos for insert
    with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar catalogos" on public.catalogos;
create policy "Admins podem atualizar catalogos"
    on public.catalogos for update
    using (public.is_admin(auth.uid()));

drop policy if exists "Admins podem excluir catalogos" on public.catalogos;
create policy "Admins podem excluir catalogos"
    on public.catalogos for delete
    using (public.is_admin(auth.uid()));

-- Bucket de armazenamento para os PDFs e imagens de capa dos catálogos
insert into storage.buckets (id, name, public)
values ('catalogos', 'catalogos', true)
on conflict (id) do nothing;

drop policy if exists "Arquivos de catalogos sao publicos" on storage.objects;
create policy "Arquivos de catalogos sao publicos"
    on storage.objects for select
    using (bucket_id = 'catalogos');

drop policy if exists "Admins podem enviar arquivos de catalogos" on storage.objects;
create policy "Admins podem enviar arquivos de catalogos"
    on storage.objects for insert
    with check (bucket_id = 'catalogos' and public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar arquivos de catalogos" on storage.objects;
create policy "Admins podem atualizar arquivos de catalogos"
    on storage.objects for update
    using (bucket_id = 'catalogos' and public.is_admin(auth.uid()));

drop policy if exists "Admins podem excluir arquivos de catalogos" on storage.objects;
create policy "Admins podem excluir arquivos de catalogos"
    on storage.objects for delete
    using (bucket_id = 'catalogos' and public.is_admin(auth.uid()));

-- ==========================================================================
-- Pronto. Nenhuma ação manual extra necessária além de rodar este script.
-- ==========================================================================
