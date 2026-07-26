-- ==========================================================================
-- AMAZÔNIA FORCE — Preço deixa de ser obrigatório
-- Rode em: Supabase -> SQL Editor -> New query -> Run
--
-- O site não mostra mais preços publicamente ("Consulte o valor com o
-- vendedor"). O campo continua existindo no painel Admin como anotação
-- interna opcional, então o banco não pode mais exigir esse valor.
-- ==========================================================================

alter table public.produtos
    alter column preco drop not null;

-- ==========================================================================
-- Pronto. Nenhuma ação manual extra necessária além de rodar este script.
-- ==========================================================================
