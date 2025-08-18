# Guia de Instalação no cPanel

Este guia explica como instalar e configurar o sistema escolar completo no cPanel usando MySQL e APIs PHP.

## Pré-requisitos

- Hospedagem cPanel
- MySQL/MariaDB
- PHP 7.4+
- Suporte a mod_rewrite

## 1. Configuração do Banco de Dados

### 1.1 Criar Banco de Dados
1. Acesse o cPanel
2. Vá em "MySQL Databases"
3. Crie um banco chamado `escola_db`
4. Crie um usuário e atribua ao banco

### 1.2 Importar Schema
1. Abra o phpMyAdmin
2. Selecione o banco `escola_db`
3. Importe o arquivo `schema.sql`

## 2. Upload dos Arquivos

### 2.1 Estrutura de Arquivos
```
public_html/
├── api/
│   ├── config/
│   │   ├── database.php
│   │   └── cors.php
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── crud/
│   │   ├── profiles.php
│   │   ├── classes.php
│   │   ├── subjects.php
│   │   ├── grades.php
│   │   ├── attendance.php
│   │   ├── communications.php
│   │   ├── declarations.php
│   │   └── evasions.php
│   ├── utils/
│   │   └── jwt.php
│   └── vendor/ (biblioteca JWT)
├── assets/
├── index.html
├── *.js
├── *.css
└── .htaccess
```

### 2.2 Upload da API
1. Faça upload da pasta `api/` para `public_html/api/`
2. Configure permissões:
   - Pastas: 755
   - Arquivos PHP: 644

## 3. Configuração

### 3.1 Configurar Banco de Dados
Edite `api/config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'seu_usuario_escola_db'; // Nome do banco no cPanel
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### 3.2 Configurar JWT
Edite `api/utils/jwt.php`:
```php
private static $secret_key = "SUA_CHAVE_SECRETA_SUPER_FORTE_AQUI";
```

### 3.3 Configurar URL da API
Edite `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'https://seudominio.com.br/api';
```

## 4. Instalar JWT Library

### 4.1 Via Composer (Recomendado)
Se seu cPanel tem Composer:
```bash
cd public_html/api
composer require firebase/php-jwt
```

### 4.2 Download Manual
1. Baixe: https://github.com/firebase/php-jwt/releases
2. Extraia em `public_html/api/vendor/firebase/php-jwt/`

## 5. Build do Frontend

1. No seu computador local:
```bash
npm run build
```

2. Upload do conteúdo da pasta `dist/` para `public_html/`

## 6. Configurar .htaccess

Crie/edite `public_html/.htaccess`:
```apache
# Roteamento SPA
RewriteEngine On

# API routes - não redirecionar
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^.*$ - [L]

# Arquivos estáticos
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^.*$ - [L]

# SPA - redirecionar tudo para index.html
RewriteRule ^.*$ index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache estático
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Compressão
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# HTTPS redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Credenciais Padrão
- Email: admin@escola.com
- Senha: admin123

**Importante:** Altere a senha padrão após primeiro acesso!