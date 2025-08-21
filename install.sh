#!/bin/bash

# Instalador - Sistema de Gestão Escolar
# Para sistemas Unix/Linux/macOS

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "====================================="
echo " INSTALADOR - SISTEMA GESTÃO ESCOLAR"
echo "====================================="
echo -e "${NC}"

# Verificar se está na pasta correta
if [ ! -d "api" ]; then
    echo -e "${RED}[ERRO]${NC} Pasta 'api' não encontrada!"
    echo "Execute este script na raiz do projeto escola-app"
    exit 1
fi

echo -e "${GREEN}[INFO]${NC} Verificando dependências..."

# Verificar PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}[ERRO]${NC} PHP não encontrado!"
    echo "Instale o PHP primeiro (versão 7.4 ou superior)"
    exit 1
fi

PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}[OK]${NC} PHP encontrado: $PHP_VERSION"

# Verificar se extensões PHP necessárias estão instaladas
echo -e "${GREEN}[INFO]${NC} Verificando extensões PHP..."

REQUIRED_EXTENSIONS=("pdo" "pdo_mysql" "json" "openssl")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if ! php -m | grep -q "^$ext$"; then
        MISSING_EXTENSIONS+=("$ext")
    fi
done

if [ ${#MISSING_EXTENSIONS[@]} -gt 0 ]; then
    echo -e "${RED}[ERRO]${NC} Extensões PHP faltando:"
    printf ' - %s\n' "${MISSING_EXTENSIONS[@]}"
    echo "Instale as extensões necessárias primeiro"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Todas as extensões PHP necessárias estão instaladas"

# Verificar MySQL/MariaDB
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}[AVISO]${NC} MySQL não encontrado no PATH"
    echo "Certifique-se de que MySQL/MariaDB está instalado e rodando"
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERRO]${NC} Node.js não encontrado!"
    echo "Instale o Node.js primeiro: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}[OK]${NC} Node.js encontrado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERRO]${NC} npm não encontrado!"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}[OK]${NC} npm encontrado: $NPM_VERSION"

echo -e "${BLUE}[INFO]${NC} Instalando dependências do frontend..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} Dependências instaladas com sucesso!"
else
    echo -e "${RED}[ERRO]${NC} Falha ao instalar dependências!"
    exit 1
fi

# Verificar Composer
echo -e "${BLUE}[INFO]${NC} Verificando Composer para JWT..."
if command -v composer &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Composer encontrado"
    echo -e "${BLUE}[INFO]${NC} Instalando Firebase JWT..."
    cd api
    composer require firebase/php-jwt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK]${NC} JWT instalado!"
    else
        echo -e "${RED}[ERRO]${NC} Falha ao instalar JWT"
    fi
    cd ..
else
    echo -e "${YELLOW}[AVISO]${NC} Composer não encontrado"
    echo "Você precisará instalar JWT manualmente"
    echo "Veja as instruções no instalador web"
fi

# Verificar permissões de escrita
echo -e "${BLUE}[INFO]${NC} Verificando permissões..."
if [ ! -w "api/utils/jwt.php" ]; then
    echo -e "${YELLOW}[AVISO]${NC} Arquivo JWT pode não ter permissão de escrita"
    echo "Execute: chmod 664 api/utils/jwt.php"
fi

echo -e "${BLUE}"
echo "====================================="
echo " INSTALAÇÃO CONCLUÍDA"
echo "====================================="
echo -e "${NC}"

echo "Próximos passos:"
echo ""
echo "1. Inicie seu servidor web (Apache/Nginx) e MySQL"
echo ""
echo "2. Abra o navegador e acesse:"
echo "   http://localhost/escola-app/install.php"
echo "   (ajuste o caminho conforme sua configuração)"
echo ""
echo "3. Siga o instalador web para:"
echo "   - Criar banco de dados"
echo "   - Importar tabelas"
echo "   - Configurar segurança"
echo ""
echo "4. Após o instalador web, execute:"
echo "   npm run dev"
echo ""
echo "5. Acesse o sistema em:"
echo "   http://localhost:5173"
echo ""
echo "====================================="

# Perguntar se quer iniciar o servidor de desenvolvimento
read -p "Deseja iniciar o servidor de desenvolvimento agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}[INFO]${NC} Iniciando servidor de desenvolvimento..."
    echo "Pressione Ctrl+C para parar"
    echo ""
    npm run dev
fi