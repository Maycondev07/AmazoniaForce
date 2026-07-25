# Sistema de Cadastro de Produtos — Amazônia Force

Este documento explica como colocar o sistema no ar. É só fazer uma vez.

## 1) Rodar os scripts do banco de dados

Na ordem, no **SQL Editor** do Supabase:

1. `database/setup-produtos.sql`
2. `database/setup-funcionalidades.sql`
3. `database/setup-perfil.sql`

(Se você já rodou os dois primeiros antes, só falta rodar o `setup-perfil.sql`.)

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

## O que já é 100% funcional

- **Carrinho**: persiste no banco por usuário logado, soma certo, sobrevive a recarregar a página. Frete é uma estimativa simples (não é integração real com transportadora) e cupom valida contra a tabela `cupons`.
- **Página de produto**: abre o produto certo pelo link (`produto.html?id=...`), com dados reais — sem avaliação fake, sem especificação inventada.
- **Filtros e busca** em Produtos/Categoria: categorias e marcas vêm dos produtos que existem de verdade; preço, ordenação e busca funcionam de verdade.
- **Minha Conta**: pedidos (lista real, vazia até o checkout existir), favoritos (adicionar/remover de verdade), endereços (cadastrar/editar/excluir de verdade), dados pessoais e troca de senha (reais), preferências de notificação (salvas de verdade). "Formas de pagamento" foi deixado como aviso honesto — cartão é inserido direto no checkout, não guardamos número de cartão em lugar nenhum (isso exigiria um gateway de pagamento de verdade).

## O que ainda falta

- **Checkout** — hoje ainda não gera pedido de verdade (é a próxima etapa).
- **Formulário de Contato** — ainda não envia a mensagem de verdade.
- Paginação em Produtos/Categoria ainda é só visual (não pagina de verdade — só relevante se o catálogo crescer muito).
