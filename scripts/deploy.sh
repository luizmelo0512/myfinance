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
# se o arquivo .env estiver na raiz do projeto:
if [ -f ".env" ]; then
    echo "⚙️ Carregando variáveis de ambiente do .env..."
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

echo "⏹️ Parando containers em execução..."
docker compose down

echo "🏗️ Construindo e subindo os novos containers em background..."
docker compose up -d --build

echo "🧹 Limpando imagens "dangling" (pendentes) para liberar espaço no servidor..."
docker image prune -af

echo "========================================"
echo "✅ Deploy finalizado com sucesso! Aplicação no ar."
echo "========================================"
