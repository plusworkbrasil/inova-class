# Guia de Instalação no cPanel

Este guia explica como instalar e configurar o sistema escolar completo no cPanel usando MySQL e APIs PHP.

## 🚀 Instalação Automática (Recomendado)

1. Faça upload de todos os arquivos para `public_html/`
2. Acesse: `https://seudominio.com.br/install_cpanel.php`
3. Siga o assistente de instalação
4. Delete o arquivo `install_cpanel.php` após a conclusão

## Pré-requisitos

- Hospedagem cPanel
- MySQL/MariaDB
- PHP 7.4+
- Suporte a mod_rewrite
- Biblioteca Firebase JWT (instalada automaticamente)

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

### 3.1 Configurar Ambiente
O arquivo `api/config/env.php` é criado automaticamente pelo instalador com:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'seu_banco');
define('DB_USER', 'seu_usuario');
define('DB_PASS', 'sua_senha');
define('JWT_SECRET', 'chave_gerada_automaticamente');
define('ALLOWED_ORIGINS', ['https://seudominio.com.br']);
```

### 3.2 Configurar URL da API  
Edite `src/lib/api.ts` antes do build:
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://seudominio.com.br/api'
  : 'http://localhost/escola-app/api';
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

## 7. Configurações de Segurança

### 7.1 Arquivos Protegidos
O `.htaccess` automaticamente protege:
- Arquivos de configuração (`/api/config/`)
- Logs do sistema (`/api/logs/`)
- Instaladores (`install_cpanel.php`)

### 7.2 CORS Configurado
- Apenas domínios autorizados podem acessar a API
- Headers de segurança aplicados automaticamente

### 7.3 JWT Seguro
- Chave de 64 caracteres gerada automaticamente
- Tokens com expiração de 1 hora
- Validação de issuer/audience

## Credenciais Padrão
- Email: admin@escola.com
- Senha: admin123

**⚠️ CRÍTICO:** Altere a senha padrão imediatamente após primeiro acesso!

## 🔧 Troubleshooting

### Erro 500 na API
- Verifique permissões dos arquivos PHP (644)
- Verifique se `api/config/env.php` existe
- Confira logs de erro do cPanel

### CORS Error
- Confirme se seu domínio está em `ALLOWED_ORIGINS`
- Verifique se está usando HTTPS em produção

### JWT Error
- Regenere a chave JWT através do instalador
- Verifique se a biblioteca Firebase JWT está instalada

### Banco de Dados
- Confirme credenciais no arquivo `env.php`
- Teste conexão pelo instalador