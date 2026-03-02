# mf-backend

API REST do My Finance, construida com NestJS + TypeORM + PostgreSQL (Neon).

## Tecnologias

- **NestJS 11** - Framework HTTP
- **TypeORM** - ORM para PostgreSQL
- **Better Auth** - Autenticacao (email/senha, sessoes via cookie)
- **Swagger** - Documentacao da API em `/api/docs`

## Variaveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SECRET_KEY=sua-chave-secreta
BASE_URL=http://localhost
PORT=80
TRUSTED_ORIGINS=http://localhost:3000
```

## Rodando Localmente (sem Docker)

```bash
npm install
npm run dev
```

A API estara disponivel em `http://localhost:80`.
Swagger em `http://localhost:80/api/docs`.

## Rodando com Docker

Consulte o `README.md` na raiz do projeto para instrucoes com Docker Compose.

## Scripts Disponiveis

| Comando | Descricao |
|---|---|
| `npm run dev` | Modo desenvolvimento com watch |
| `npm run build` | Compilar para producao |
| `npm run start:prod` | Rodar build compilado |
| `npm run lint` | Rodar ESLint |
| `npm run test` | Rodar testes unitarios |
| `npm run test:e2e` | Rodar testes end-to-end |

## Endpoints Principais

| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Criar conta |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/users/me` | Perfil do usuario logado |
| GET | `/api/ledger` | Listar dividas |
| POST | `/api/ledger` | Criar divida |
| GET | `/api/ledger/:id` | Detalhes de uma divida |
| POST | `/api/transactions` | Criar transacao |
