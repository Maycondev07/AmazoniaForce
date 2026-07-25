# Sistema de Cadastro de Produtos — Amazônia Force

Este documento explica como colocar o sistema no ar. É só fazer uma vez.

## 1) Rodar o script do banco de dados

1. Acesse o painel do seu projeto em https://supabase.com/dashboard
2. Vá em **SQL Editor** → **New query**
3. Abra o arquivo `database/setup-produtos.sql` (nesta pasta do projeto), copie todo o conteúdo e cole lá
4. Clique em **Run**

Isso cria:
- a tabela `produtos` (com política de segurança: qualquer visitante só vê produtos ativos; só admins podem criar/editar/excluir)
- o campo `is_admin` na tabela `profiles` que já existia (usada no login)
- um bucket de armazenamento chamado `produtos`, público, para as fotos

## 2) Criar sua conta e virar administrador

1. No site, cadastre uma conta normalmente pela página `Routes/cadastro.html`
2. No painel Supabase, vá em **Authentication → Users** e copie o **UUID** da sua conta
3. Volte no **SQL Editor** e rode (trocando o UUID):

```sql
update public.profiles set is_admin = true where id = 'COLE-O-UUID-AQUI';
```

Pronto — sua conta agora é administradora.

## 3) Usar o painel

1. Faça login no site normalmente
2. Vá em **Minha Conta** → vai aparecer um item extra no menu: **🛠 Painel Admin** (só aparece pra quem é admin)
3. Lá você:
   - cadastra produto novo (nome, categoria, marca, código, estoque, preço, preço antigo/de "antes", descrição, imagem, se é destaque, se fica visível)
   - edita ou exclui qualquer produto já cadastrado
   - a imagem é enviada direto pro Supabase Storage quando você escolhe o arquivo

A página é protegida: quem não é admin (ou não está logado) é redirecionado automaticamente para longe dela.

## 4) Onde os produtos aparecem no site

Depois de cadastrados, os produtos aparecem sozinhos, sem precisar editar HTML:

| Página | O que mostra |
|---|---|
| `index.html` (Home) | produtos marcados como **Destaque** |
| `Routes/produtos.html` | todos os produtos ativos |
| `Routes/categoria.html` | produtos cuja categoria bate com `?categoria=` da URL |
| `Routes/ofertas.html` | produtos que têm "Preço Antigo" preenchido (ou seja, em promoção) |
| `Routes/checkout.html` e `Routes/produto.html` | uma vitrine de destaques no rodapé da página |

## O que ainda é manual (próximos passos possíveis)

- **`Routes/produto.html`** (página de detalhe de um produto específico) ainda mostra um produto de exemplo fixo — ainda não busca o produto certo pelo `?id=` da URL. Consigo fazer isso a seguir se quiser.
- Os filtros da barra lateral em `produtos.html`/`categoria.html` (checkboxes de marca, faixa de preço) ainda são só visuais, não filtram de verdade — também dá pra ligar.
- O carrinho de compras continua "de mentira" (não salva nada, é só pra mostrar visualmente) — se quiser um carrinho de verdade que persiste, isso também precisaria do banco de dados.
