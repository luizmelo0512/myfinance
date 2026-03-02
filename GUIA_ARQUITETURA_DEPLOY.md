# 🚀 Guia Definitivo: Arquitetura, Infraestrutura e Deploy do My Finance

Este documento é a "Bíblia" do que foi construído em nossa jornada. Ele explica detalhadamente cada escolha arquitetural, os problemas que enfrentamos, por que eles aconteceram e exatamente como nós os resolvemos. O objetivo é que você compreenda 100% da sua infraestrutura e não dependa de IA para mantê-la ou replicá-la no futuro.

---

## 🏗️ 1. O Monorepo
Antes, tínhamos o `mf-frontend` e o `mf-backend` como dois repositórios isolados (Multirepo). Ao invés disso, nós removemos as pastas ocultas `.git` dentro deles e rodamos um `git init` na pasta principal `my-finance`.

**Por que fizemos isso?**
Porque nossa estratégia de Deploy envolve usar o **Docker Compose**. Com ambos os projetos vivendo debaixo da mesma raiz no Git, nós ganhamos a habilidade de:
1. Ter um único `docker-compose.yml` que sobe o Front e o Back juntos na mesma rede interna do Docker (`app-network`).
2. Fazer versionamento unificado: Uma alteração no backend que afeta o frontend é "commitada" junta.
3. Facilitar o CI/CD do GitLab, que baixa a pasta `my-finance` inteira pra montar o ecossistema de uma vez.

---

## ⚙️ 2. A Estratégia de Deploy (GitLab CI/CD)
Criamos o arquivo `.gitlab-ci.yml` para automatizar a entrega. 

**O Desafio da Memória RAM:** Sua máquina no Google Cloud (GCP) possui 1GB de RAM. Rodar `npm run build` do Next.js consome gigantescos picos de memória e faria sua VM travar e derrubar a sua produção.

**A Solução (Modelo Push):** Mudamos o processamento pesado para as máquinas robustas do próprio GitLab Runner.
1. O GitLab baixa o seu código.
2. Faz o build bruto do Frontend (`Output: standalone`).
3. Comprime tudo o que importa num arquivo pequeno chamado `deploy.tar.gz`.
4. Ele transfere só esse arquivo já mastigado pro seu Google Cloud, descompacta, levanta o Docker local e apaga o ZIP.

---

## 🔑 3. O Cofre do Google Cloud (SSH e Permissões)
Para fazer o GitLab enviar arquivos pro Google sem você precisar estar lá, usamos chaves SSH.

**O que fizemos:**
Geramos uma chave Ed25519 e copiamos o texto dela pro Google Cloud na aba **Metadados > SSH Keys**. 
Nós dissemos pro Google que essa chave pertencia ao usuário `gitlab-deploy`.

**A Armadilha do OS Login (sudo-rs):**
No Google Cloud, usuários normais (como o seu `luizpwmelo`) não ganham acesso automático às chaves uns dos outros nem podem rodar determinados comandos como `.env` num bloqueio rígido do Linux moderno.

A conta do `gitlab-deploy`, criada pelos Metadados do Google, morava isolada na pasta `/home/gitlab-deploy` com permissões `700` (nenhum outro humano entra).

A pipeline do GitLab engasgava porque caracteres como as quebras de linha (`\n` e `\r` do Windows/Mac) corrompiam a chave secreta quando usávamos variáveis do tipo String no painel.

**Como resolvemos:**
1. Trocamos o tipo da variável no GitLab para **"File"**. Assim o próprio GitLab cria a chave fisicamente no sistema blindada de corrupções de texto.
2. Definimos a variável `SSH_USER` exatamente como `gitlab-deploy`.
3. Passamos a passar o caminho inteiro da pasta na extração (`/home/gitlab-deploy/my-finance`) para o bash não se perder com atalhos como `~`.

---

## 🔒 4. Segredos e Banco de Dados (O Arquivo .env)
Você aprendeu que arquivos `.env` jamais vão para o Github/GitLab. Por isso as variáveis chegam invisíveis no servidor e o Docker quebrava sem elas.

**A Batalha das Permissões:**
Precisávamos criar esse `.env` no servidor, mas seu usuário `luizpwmelo` foi bloqueado pelo `sudo-rs` até para abrir o Bloco de Notas (Nano) como Root.

**A Solução:**
- Logamos pelo nosso terminal Mac DIRETAMENTE na conta robô usando a nossa chave: `ssh -i ~/.ssh/gcp_gitlab_key gitlab-deploy@ip`.
- Instalamos o Nano (`sudo apt update && sudo apt install nano`).
- Criamos o arquivo garantindo que o dono do cofre (`gitlab-deploy`) é quem estava escrevendo o `.env` para o Docker dele.

---

## 🚦 5. A Arquitetura de Rede (Portas, Firewalls e Cloudflare)
Depois da aplicação subir no `docker-compose`, nós enfrentamos os bloqueios de rotas. O fluxo de visitantes precisava ser limpo, seguro e performático.

### Passo A: O Escudo do Google (Firewall)
Criamos uma Regra Genérica no Google Cloud liberando Tráfego de Entrada para os ranges `0.0.0.0/0` nas nossas duas portas fundamentais:
- Porta `80` (A porta universal da internet)
- Porta `8080` (Em caso de falha, para debug direto)

### Passo B: As Portas do Docker
Quando quisemos implementar o servidor profissional Nginx, notamos um conflito: não podem existir dois programas tentando ouvir a porta `80` ao mesmo tempo. 
Nós então "escondemos" nossos containers para trás do palco no `docker-compose.yml`:
- Frontend foi da `80` para `3000`
- Backend foi da `8080` para `3001`
Elas ficaram rodando no submundo do Linux, fora da vista do público.

### Passo C: O Nginx (O Grande Maestro Proxy Reverso)
Com as portas externas livres, instalamos o Nginx para ouvir a rua (Porta `80`) e agir como telefonista.
- **Requisições de `myfinance.lhmtech.online`** chegam na porta `80`. O Nginx atende, sabe que é o Front, e repassa pra porta oculta `3000`.
- **Requisições de `myfinanceapi.lhmtech.online`** chegam na porta `80`. O Nginx atende e repassa pra `3001`.

O que mais nós colocamos no script Mestre do Nginx (`myfinance.conf`):
- `gzip on`: Ele amassa e comprime o CSS/JS do Next.js antes de enviar pra rua, aumentando a velocidade do site.
- `client_max_body_size 20M`: Para aceitar anexos e imagens nas rotas de despesas, prevenindo o temido Erro *413 Payload Too Large*.
- Headers de WebSockets (`Upgrade` / `Connection`): Permitindo o Frontend vivo do React se comunicar em tempo real e atualizar o Service Worker PWA (Push/Notificações) com perfeição sem cair.
- Passagem de IPs Reais: Repassando Headers do provedor de origem pra sua aplicação não achar que todo mundo tá logando do IP `127.0.0.1`.

### Passo D: A Criptografia do Cloudflare
Colocamos o DNS sob nuvem Laranja e o SSL em "Flexible". Isso significa: 
Usuário -> `HTTPS` Cadeado Verde -> **Cloudflare** -> `HTTP (80)` Porta aberta pelo escuto -> **Nginx** -> Roteamento para as Portas `3000` / `3001`.

---

## 🔐 6. Segurança "Better Auth" e a Magia do Next.js Proxy
A última peça, que costuma dar muita dor de cabeça em Microsserviços, o erro `INVALID_ORIGIN` no login.

**Por que a arquitetura do Next.js é especial?**
Você notou que as requisições do seu projeto pro banco não saíam com o Domínio da API... elas iam mascaradas!
O Next.js usa o Next.js Rewrites (`/api/*`). Ele mascara a API para parecer que o próprio frontend está resolvendo. O navegador do usuário e os cookies acham que estão mandando POST de Login pro próprio servidor Web do Frontend.

**O Conflito:**
O Backend (`Better Auth`) recebeu a conexão do Nginx com a URL mascarada do Frontend. O `Better Auth` leu seu `.env` que dizia: *"Minha casa oficial é `https://myfinanceapi...`"*. Mas o cabeçalho que chegou dizia: *"Quem pede entrada é o Next.js Proxy em `https://myfinance...`"*. Ele travou, chamou de Origem Inválida e rejeitou (proteção clássica de CORS).

**A Correção Final:**
Entendemos a topologia reversa: dissemos pro `auth.ts` do backend que a "CASA BASE" dele agora é exatamente o endereço do Frontend Proxy, por onde a porta de dados de transição roda:
```env
BASE_URL="https://myfinance.lhmtech.online"
TRUSTED_ORIGINS="https://myfinance.lhmtech.online,http://localhost"
```

## 🎉 Acabou!
Essas foram as batalhas e as razões por trás da sua Arquitetura. Agora, basta rodar código (NPM run dev), se preocupar e inovar somente na lógica do MyFinance Typescript, jogar a tag no Gitlab (`git push ` / `git tag`), e assistir o espetáculo da nuvem desdoblar suas engrenagens. 

Bons estudos!
