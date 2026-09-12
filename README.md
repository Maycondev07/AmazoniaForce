# 🛒 Loja Virtual — Projeto de Portfólio

> **🚧 Esta é uma versão de demonstração.** Todo o "backend" deste projeto roda localmente no seu navegador — não há nenhum servidor real por trás. Veja a seção [Sobre esta versão demo](#-sobre-esta-versão-demo) para entender como isso funciona.

## 📖 Sobre o projeto

Este é um projeto de **e-commerce completo**, desenvolvido para demonstrar a construção de uma plataforma de loja virtual do zero: catálogo de produtos com busca e filtros, carrinho de compras, lista de favoritos, área do cliente (pedidos, endereços, dados pessoais), autenticação de usuários e um painel administrativo para gestão do catálogo.

A ideia por trás do projeto não está presa a um nicho específico — a estrutura (produtos, categorias, marcas, variações, carrinho, pedidos, painel admin) serve como base para qualquer loja virtual, independentemente do que está sendo vendido.

## ⚠️ Sobre esta versão demo

Na versão original deste projeto, todos os dados (produtos, contas, pedidos, carrinho etc.) ficam salvos em um banco de dados real. Nesta versão pública/demo, esse backend foi substituído por um **banco de dados simulado dentro do próprio navegador** (usando `localStorage`), para que qualquer pessoa possa clonar o repositório e testar o site funcionando de ponta a ponta sem precisar configurar nenhum servidor, chave de API ou banco de dados.

Isso significa que:
- Cada visitante tem os **seus próprios dados** — nada é compartilhado entre pessoas diferentes acessando a demo;
- Ao limpar os dados do navegador (ou usar uma aba anônima), tudo volta ao estado inicial;
- Criar uma conta, fazer login, montar um carrinho ou usar o painel admin **não envia nada para nenhum servidor real** — é só para fins de demonstração.

Para reconectar o projeto a um backend real (Supabase ou outro), basta substituir a lógica do arquivo `Assets/js/auth/supabase.js` pelas credenciais e chamadas do seu próprio banco de dados.

## 🔑 Contas de demonstração

Para explorar o site sem precisar criar uma conta do zero, já existem duas contas prontas para uso:

| Perfil | E-mail | Senha |
|---|---|---|
| 👤 Cliente | `cliente@demo.com` | `demo1234` |
| 🛠️ Administrador | `admin@demo.com` | `demo1234` |

- Entre com a conta de **cliente** para ver a área "Minha Conta" já com pedidos, endereço e favoritos de exemplo.
- Entre com a conta de **administrador** para acessar o **Painel Admin** (cadastro/edição/exclusão de produtos e catálogos).

Você também pode criar sua própria conta pelo formulário de cadastro normalmente — ela ficará salva apenas no seu navegador.

## ✨ Funcionalidades

- **Catálogo de produtos** com busca, filtros por categoria/marca e ordenação
- **Página de ofertas** com produtos em promoção
- **Página de produto** com variações, estoque e especificações
- **Carrinho de compras** persistente por usuário
- **Lista de favoritos**
- **Autenticação de usuários** (cadastro, login, login social simulado)
- **Área do cliente**: dados pessoais, troca de senha, pedidos, endereços e favoritos
- **Painel administrativo**: CRUD completo de produtos (com variações e upload de imagem) e de catálogos em PDF
- Páginas institucionais (sobre, contato, políticas de privacidade/troca/envio/pagamento/cookies, termos de uso)

## 🛠️ Tecnologias utilizadas

- HTML5, CSS3 e JavaScript puro (sem frameworks)
- `localStorage` como camada de persistência simulada (nesta versão demo)
- Estrutura pensada para se conectar facilmente a um backend real (ex.: Supabase) quando necessário

## 🚀 Como rodar localmente

Por ser um projeto 100% front-end, não é necessário instalar nada:

1. Clone o repositório
   ```bash
   git clone <url-do-repositorio>
   ```
2. Abra a pasta do projeto e inicie um servidor local (recomendado, para evitar problemas de caminho de arquivos), por exemplo com a extensão **Live Server** do VS Code, ou:
   ```bash
   npx serve .
   ```
3. Acesse `index.html` no navegador e explore à vontade — use as [contas de demonstração](#-contas-de-demonstração) acima para testar as áreas de cliente e admin.

## 📁 Estrutura do projeto

```
├── index.html              # Página inicial
├── Routes/                 # Demais páginas do site (produtos, carrinho, conta, admin, institucionais...)
├── Assets/
│   ├── css/                 # Estilos
│   ├── js/
│   │   ├── auth/             # Autenticação e "banco de dados" simulado (supabase.js)
│   │   ├── admin/             # Lógica do painel administrativo
│   │   └── ...                # Carregamento de produtos, carrinho, favoritos, busca, filtros...
│   ├── components/           # Componentes reutilizáveis (validações, etc.)
│   └── img/                  # Imagens do projeto
├── Legal/                   # Documentos institucionais
└── database/                # Scripts SQL de referência do modelo de dados original
```

## 📄 Licença

Projeto desenvolvido para fins de portfólio/demonstração.
