# Sistema de Gerenciamento Escolar

Este é um sistema web de gerenciamento escolar desenvolvido com Next.js, TypeScript e MySQL.

## Funcionalidades

- Autenticação de usuários
- Gerenciamento de alunos
- Gerenciamento de escolas
- Gerenciamento de monitores
- Dashboard com estatísticas
- Interface responsiva e moderna

## Tecnologias Utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- MySQL
- JWT para autenticação

## Requisitos

- Node.js 18 ou superior
- MySQL 8.0 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/neozmmv/GestaoEscolarWeb.git
cd GestaoEscolarWeb
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
JWT_SECRET=sua_chave_secreta
```

4. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

5. Acesse o projeto em [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
src/
  ├── app/              # Rotas e páginas da aplicação
  ├── components/       # Componentes reutilizáveis
  ├── lib/             # Utilitários e configurações
  └── types/           # Definições de tipos TypeScript
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter


## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
