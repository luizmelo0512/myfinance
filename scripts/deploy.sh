#!/bin/bash

# Encerra o script imediatamente se algum comando falhar
set -e

echo "========================================"
echo "🚀 Iniciando o deploy automático..."
echo "📅 Data/Hora: $(date)"
echo "========================================"

# Diretório base da aplicação (pode ser ajustado conforme o caminho no servidor)
# O script assume que está na pasta 'scripts' e vai um nível acima para a raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📂 Navegando para o diretório do projeto: $PROJECT_ROOT"
cd "$PROJECT_ROOT" || exit 1

# Passo opcional caso o repositório seja atualizado via Git diretamente no servidor:
# echo "📥 Atualizando código fonte..."
# git pull origin main

# Carrega variáveis de ambiente, se necessário
# o arquivo .env agora está dentro do mf-backend
if [ -f "mf-backend/.env" ]; then
    echo "⚙️ Carregando variáveis de ambiente do mf-backend/.env..."
    export $(cat mf-backend/.env | grep -v '#' | awk '/=/ {print $1}')
fi
echo "⏹️ Parando containers em execução..."
docker compose down

echo "📦 Construindo o backend (Quarkus) com Maven usando Docker..."
if [ -d "mf-backend" ]; then
    # Usa uma imagem do Maven com Java 21 para compilar o projeto sem precisar ter Java instalado
    docker run --rm \
      -v "$(pwd)/mf-backend:/usr/src/app" \
      -v "$HOME/.m2:/root/.m2" \
      -w /usr/src/app \
      maven:3.9-eclipse-temurin-21 \
      mvn clean package -DskipTests
else
    echo "⚠️ Diretório mf-backend não encontrado. Pulando build do Maven."
fi

echo "📦 Construindo o frontend (Next.js) usando Docker..."
if [ -d "mf-frontend" ]; then
    # Usa uma imagem Node para instalar dependências e fazer o build
    docker run --rm \
      -v "$(pwd)/mf-frontend:/app" \
      -w /app \
      node:20 \
      sh -c "npm install && npm run build"
else
    echo "⚠️ Diretório mf-frontend não encontrado. Pulando build do Next.js."
fi


echo "🏗️ Construindo e subindo os novos containers em background..."
docker compose up -d --build

echo "🧹 Limpando imagens "dangling" (pendentes) para liberar espaço no servidor..."
docker image prune -af

echo "========================================"
echo "✅ Deploy finalizado com sucesso! Aplicação no ar."
echo "========================================"
