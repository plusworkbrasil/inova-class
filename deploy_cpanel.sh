#!/bin/bash

# Script de Deploy para cPanel
# Execute este script localmente antes do upload

echo "🚀 Preparando deploy para cPanel..."

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Verificar se o projeto está configurado
if [ ! -f "package.json" ]; then
    echo "❌ Arquivo package.json não encontrado."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Fazer build do projeto
echo "🔨 Construindo projeto..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Build falhou. Pasta 'dist' não encontrada."
    exit 1
fi

# Criar pasta de deploy
echo "📁 Preparando arquivos para upload..."
rm -rf deploy_cpanel
mkdir -p deploy_cpanel

# Copiar arquivos do build
cp -r dist/* deploy_cpanel/

# Copiar API
cp -r api deploy_cpanel/

# Copiar arquivos de configuração
cp schema.sql deploy_cpanel/
cp install_cpanel.php deploy_cpanel/

# Copiar .htaccess se existir
if [ -f "public/.htaccess" ]; then
    cp public/.htaccess deploy_cpanel/
fi

# Criar arquivo de instruções
cat > deploy_cpanel/LEIA_PRIMEIRO.txt << 'EOF'
INSTRUÇÕES DE UPLOAD PARA CPANEL
================================

1. Faça upload de TODOS os arquivos desta pasta para public_html/

2. Estrutura final no servidor:
   public_html/
   ├── index.html (e outros arquivos do build)
   ├── api/ (pasta completa)
   ├── schema.sql
   ├── install_cpanel.php
   └── .htaccess

3. Acesse: https://seudominio.com.br/install_cpanel.php

4. Siga o assistente de instalação

5. Delete install_cpanel.php após conclusão

IMPORTANTE:
- Configure seu banco de dados no cPanel primeiro
- Certifique-se que PHP 7.4+ está ativo
- Permissões: pastas 755, arquivos 644

EOF

echo "✅ Deploy preparado com sucesso!"
echo "📂 Todos os arquivos estão na pasta: deploy_cpanel/"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload da pasta deploy_cpanel/* para public_html/"
echo "2. Acesse https://seudominio.com.br/install_cpanel.php"
echo "3. Siga o assistente de instalação"
echo ""
echo "💡 Dica: Use FileZilla ou o File Manager do cPanel para upload"