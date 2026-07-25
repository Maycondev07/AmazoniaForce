-- ==========================================================================
-- AMAZÔNIA FORCE — Setup do perfil (Etapa 3)
-- Rode em: Supabase -> SQL Editor -> New query -> Run
-- Pré-requisito: já ter rodado setup-produtos.sql e setup-funcionalidades.sql
-- ==========================================================================

alter table public.profiles
    add column if not exists receber_ofertas boolean not null default true;

alter table public.profiles
    add column if not exists receber_atualizacoes_pedido boolean not null default true;

-- ==========================================================================
-- Pronto. Nenhuma ação manual extra necessária além de rodar este script.
-- ==========================================================================
