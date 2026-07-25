-- ==========================================================================
-- AMAZÔNIA FORCE — Cadastro simplificado (PF/PJ) + login social
-- Rode em: Supabase -> SQL Editor -> New query -> Run
-- Pré-requisito: já ter rodado setup-produtos.sql, setup-funcionalidades.sql
--                e setup-perfil.sql (tabela public.profiles já deve existir)
-- ==========================================================================

-- CNPJ, usado quando o cadastro é de Pessoa Jurídica
alter table public.profiles
    add column if not exists cnpj text;

-- Tipo de conta: 'fisica' (usa cpf) ou 'juridica' (usa cnpj)
alter table public.profiles
    add column if not exists tipo_pessoa text not null default 'fisica';

alter table public.profiles
    drop constraint if exists profiles_tipo_pessoa_check;

alter table public.profiles
    add constraint profiles_tipo_pessoa_check check (tipo_pessoa in ('fisica','juridica'));

-- Data de nascimento (agora obrigatória no formulário simplificado)
alter table public.profiles
    add column if not exists data_nascimento date;

-- CPF e CNPJ passam a ser opcionais na tabela (cada conta preenche só um
-- dos dois, dependendo de tipo_pessoa), então garantimos que a coluna cpf
-- aceite nulo caso tenha sido criada como NOT NULL em algum setup anterior.
alter table public.profiles
    alter column cpf drop not null;

-- ==========================================================================
-- Login social (Google / Facebook)
-- Este script NÃO habilita os provedores — isso é feito manualmente em:
-- Supabase -> Authentication -> Sign In / Providers -> Google / Facebook
-- Você vai precisar, para cada provedor:
--   1) Criar um app OAuth no Google Cloud Console / Meta for Developers
--   2) Copiar o Client ID e o Client Secret para o Supabase
--   3) Adicionar a "Redirect URL" que o Supabase mostra na tela do provedor
--      às origens autorizadas do app OAuth (Google/Facebook)
-- Sem isso, os botões "Entrar/Cadastrar com Google/Facebook" do site vão
-- redirecionar, mas o provedor vai recusar o login.
-- ==========================================================================
