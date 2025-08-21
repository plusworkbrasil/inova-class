@echo off
title Instalador - Sistema de Gestão Escolar
color 0A

echo.
echo =====================================
echo  INSTALADOR - SISTEMA GESTAO ESCOLAR
echo =====================================
echo.

:: Verificar se está na pasta correta
if not exist "api" (
    echo [ERRO] Pasta 'api' nao encontrada!
    echo Execute este arquivo na raiz do projeto escola-app
    echo.
    pause
    exit /b 1
)

:: Verificar se XAMPP está instalado
if not exist "C:\xampp\apache\bin\httpd.exe" (
    echo [ERRO] XAMPP nao encontrado em C:\xampp\
    echo.
    echo Por favor, instale o XAMPP primeiro:
    echo https://www.apachefriends.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] XAMPP encontrado!

:: Verificar se Apache está rodando
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Apache rodando
) else (
    echo [AVISO] Apache nao esta rodando
    echo Inicie o Apache no painel do XAMPP
)

:: Verificar se MySQL está rodando
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL rodando
) else (
    echo [AVISO] MySQL nao esta rodando
    echo Inicie o MySQL no painel do XAMPP
)

echo.
echo =====================================
echo  INSTALACAO AUTOMATICA
echo =====================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: 
node --version

:: Verificar se npm está disponível
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)

echo [OK] npm encontrado: 
npm --version

echo.
echo [INFO] Instalando dependencias do frontend...
echo.

:: Instalar dependências
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [OK] Dependencias instaladas com sucesso!

:: Verificar se Composer está disponível
echo.
echo [INFO] Verificando Composer para JWT...
composer --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Composer nao encontrado
    echo Voce precisara instalar JWT manualmente
    echo Veja as instrucoes no instalador web
) else (
    echo [OK] Composer encontrado
    echo [INFO] Instalando Firebase JWT...
    cd api
    composer require firebase/php-jwt
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar JWT
    ) else (
        echo [OK] JWT instalado!
    )
    cd ..
)

echo.
echo =====================================
echo  INSTALACAO CONCLUIDA
echo =====================================
echo.
echo Proximos passos:
echo.
echo 1. Abra o navegador e acesse:
echo    http://localhost/escola-app/install.php
echo.
echo 2. Siga o instalador web para:
echo    - Criar banco de dados
echo    - Importar tabelas
echo    - Configurar seguranca
echo.
echo 3. Apos o instalador web, execute:
echo    npm run dev
echo.
echo 4. Acesse o sistema em:
echo    http://localhost:5173
echo.
echo =====================================

set /p choice="Deseja abrir o instalador web agora? (s/n): "
if /i "%choice%"=="s" (
    start http://localhost/escola-app/install.php
)

set /p choice="Deseja iniciar o servidor de desenvolvimento? (s/n): "
if /i "%choice%"=="s" (
    echo.
    echo [INFO] Iniciando servidor de desenvolvimento...
    echo Pressione Ctrl+C para parar
    echo.
    npm run dev
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul