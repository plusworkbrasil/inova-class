@echo off
echo 🚀 Preparando deploy para cPanel...

REM Verificar se npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ NPM não encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se o projeto está configurado
if not exist "package.json" (
    echo ❌ Arquivo package.json não encontrado.
    pause
    exit /b 1
)

REM Instalar dependências
echo 📦 Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências.
    pause
    exit /b 1
)

REM Fazer build do projeto
echo 🔨 Construindo projeto...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro no build do projeto.
    pause
    exit /b 1
)

REM Verificar se o build foi criado
if not exist "dist" (
    echo ❌ Build falhou. Pasta 'dist' não encontrada.
    pause
    exit /b 1
)

REM Criar pasta de deploy
echo 📁 Preparando arquivos para upload...
if exist "deploy_cpanel" rmdir /s /q "deploy_cpanel"
mkdir "deploy_cpanel"

REM Copiar arquivos do build
xcopy "dist\*" "deploy_cpanel\" /e /i /y

REM Copiar API
xcopy "api" "deploy_cpanel\api\" /e /i /y

REM Copiar arquivos de configuração
copy "schema.sql" "deploy_cpanel\"
copy "install_cpanel.php" "deploy_cpanel\"

REM Copiar .htaccess se existir
if exist "public\.htaccess" copy "public\.htaccess" "deploy_cpanel\"

REM Criar arquivo de instruções
echo INSTRUÇÕES DE UPLOAD PARA CPANEL > "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo ================================ >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo 1. Faça upload de TODOS os arquivos desta pasta para public_html/ >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo 2. Estrutura final no servidor: >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    public_html/ >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    ├── index.html (e outros arquivos do build) >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    ├── api/ (pasta completa) >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    ├── schema.sql >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    ├── install_cpanel.php >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo    └── .htaccess >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo 3. Acesse: https://seudominio.com.br/install_cpanel.php >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo 4. Siga o assistente de instalação >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo 5. Delete install_cpanel.php após conclusão >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo. >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo IMPORTANTE: >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo - Configure seu banco de dados no cPanel primeiro >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo - Certifique-se que PHP 7.4+ está ativo >> "deploy_cpanel\LEIA_PRIMEIRO.txt"
echo - Permissões: pastas 755, arquivos 644 >> "deploy_cpanel\LEIA_PRIMEIRO.txt"

echo.
echo ✅ Deploy preparado com sucesso!
echo 📂 Todos os arquivos estão na pasta: deploy_cpanel/
echo.
echo 📋 Próximos passos:
echo 1. Faça upload da pasta deploy_cpanel/* para public_html/
echo 2. Acesse https://seudominio.com.br/install_cpanel.php
echo 3. Siga o assistente de instalação
echo.
echo 💡 Dica: Use FileZilla ou o File Manager do cPanel para upload
echo.
pause