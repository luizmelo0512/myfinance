# mf-frontend

Interface web do My Finance, construida com Next.js (App Router) + shadcn/ui.

## Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **shadcn/ui** - Componentes (estilo New York)
- **Tailwind CSS v4** - Estilizacao
- **React Hook Form + Zod** - Formularios e validacao

## Variaveis de Ambiente

Crie um `.env` na raiz do frontend:

```env
BACKEND_URL=http://localhost:80
ORIGIN_URL=http://localhost:3000
```

## Rodando Localmente (sem Docker)

```bash
npm install
npm run dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

## Rodando com Docker

Consulte o `README.md` na raiz do projeto para instrucoes com Docker Compose.

## Scripts Disponiveis

| Comando | Descricao |
|---|---|
| `npm run dev` | Modo desenvolvimento |
| `npm run build` | Build de producao |
| `npm run start` | Rodar build de producao |
| `npm run lint` | Rodar ESLint |

## Rotas da Aplicacao

| Rota | Descricao |
|---|---|
| `/login` | Tela de login |
| `/sing-up` | Tela de cadastro |
| `/dashboard` | Dashboard principal |
| `/ledgers` | Lista de dividas |
| `/ledgers/:id` | Detalhe de uma divida |

## Proxy de API

Todas as chamadas para `/api/*` sao automaticamente redirecionadas para o backend via `next.config.ts` rewrites. Em Docker, o frontend se comunica com o backend pela rede interna usando o hostname `backend`.
