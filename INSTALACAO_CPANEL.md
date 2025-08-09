# 🚀 Guia de Instalação no cPanel com MySQL/MariaDB

Este guia completo te ajudará a migrar o sistema do Supabase para seu hosting cPanel com MySQL/MariaDB.

## 📋 Pré-requisitos

- ✅ Hosting com cPanel
- ✅ MySQL/MariaDB disponível
- ✅ PHP 7.4 ou superior
- ✅ Suporte a mod_rewrite (Apache)

## 🗄️ 1. Configuração do Banco de Dados

### 1.1 Criar o Banco MySQL
1. Acesse **cPanel > MySQL Databases**
2. Crie um novo banco: `escola_db`
3. Crie um usuário e atribua ao banco
4. Anote as credenciais:
   - Host: `localhost`
   - Database: `escola_db`
   - Username: `seu_usuario_mysql`
   - Password: `sua_senha_mysql`

### 1.2 Executar o Schema
1. Acesse **cPanel > phpMyAdmin**
2. Selecione o banco `escola_db`
3. Vá em **Importar**
4. Faça upload do arquivo `api/database/schema.sql`
5. Execute o script

## 📁 2. Upload dos Arquivos

### 2.1 Estrutura no cPanel
```
public_html/
├── index.html (arquivos do build React)
├── assets/
├── api/
│   ├── config/
│   │   └── database.php
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── endpoints/
│   │   └── classes.php
│   ├── utils/
│   │   └── jwt.php
│   └── .htaccess
└── .htaccess (principal)
```

### 2.2 Upload dos Arquivos API
1. Crie a pasta `api` em `public_html`
2. Faça upload de todos os arquivos da pasta `api`
3. Configure as permissões (755 para pastas, 644 para arquivos)

## ⚙️ 3. Configuração

### 3.1 Configurar Banco de Dados
Edite o arquivo `api/config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'escola_db'; // Seu banco
private $username = 'seu_usuario_mysql'; // Seu usuário
private $password = 'sua_senha_mysql'; // Sua senha
```

### 3.2 Configurar JWT
Edite o arquivo `api/utils/jwt.php`:

```php
// ALTERE ESTA CHAVE PARA UMA CHAVE ÚNICA E FORTE
define('JWT_SECRET', 'sua-chave-secreta-super-forte-aqui-' . uniqid());
```

### 3.3 Configurar URL da API
Edite o arquivo `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'https://seudominio.com/api'; // SEU DOMÍNIO AQUI
```

## 🏗️ 4. Build do Frontend

### 4.1 Configurar a API
Antes do build, certifique-se de que a URL da API esteja correta em `src/lib/api.ts`.

### 4.2 Fazer o Build
```bash
npm run build
```

### 4.3 Upload do Build
1. Faça upload de todos os arquivos da pasta `dist` para `public_html`
2. Os arquivos HTML, CSS, JS devem ficar na raiz

## 🔧 5. Configurações Avançadas

### 5.1 .htaccess Principal (public_html)
```apache
RewriteEngine On

# Força HTTPS (opcional)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API Routes
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ $1 [L]

# Frontend Routes (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### 5.2 Configurar SSL
1. Acesse **cPanel > SSL/TLS**
2. Configure certificado (Let's Encrypt gratuito)
3. Force HTTPS

## 🔐 6. Segurança

### 6.1 Permissões de Arquivos
```bash
# Pastas: 755
find api -type d -exec chmod 755 {} \;

# Arquivos PHP: 644
find api -name "*.php" -exec chmod 644 {} \;

# .htaccess: 644
chmod 644 api/.htaccess
```

### 6.2 Proteger Arquivos Sensíveis
O arquivo `api/.htaccess` já inclui proteção para:
- Logs
- Arquivos de configuração
- Arquivos .htaccess

## 🧪 7. Teste da Instalação

### 7.1 Testar API
Acesse: `https://seudominio.com/api/auth/login.php`
- Deve retornar erro JSON (método não permitido)

### 7.2 Testar Banco
1. Acesse phpMyAdmin
2. Verifique se as tabelas foram criadas
3. Verifique se o usuário admin foi inserido

### 7.3 Testar Frontend
1. Acesse seu domínio
2. Tente fazer login com:
   - Email: `admin@escola.com`
   - Senha: `admin123`

## 🎯 8. Configurações de Produção

### 8.1 Otimizações PHP
No arquivo `api/config/database.php`, adicione:

```php
// Configurações de produção
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/caminho/para/logs/php-error.log');
```

### 8.2 Cache e Compressão
O `.htaccess` já inclui:
- Compressão Gzip
- Cache de arquivos estáticos
- Headers de segurança

## 🚨 9. Troubleshooting

### 9.1 Erro de Conexão com Banco
- Verifique credenciais em `database.php`
- Teste conexão no phpMyAdmin
- Verifique se o usuário tem privilégios

### 9.2 Erro CORS
- Verifique se o `.htaccess` da API está correto
- Teste com ferramentas como Postman

### 9.3 Erro 500
- Verifique logs do PHP no cPanel
- Verifique permissões dos arquivos
- Teste sintaxe PHP

### 9.4 Rotas não Funcionam
- Verifique se mod_rewrite está habilitado
- Teste o `.htaccess` principal

## 📧 10. Primeiro Acesso

### Usuário Administrador Padrão:
- **Email:** `admin@escola.com`
- **Senha:** `admin123`

**⚠️ IMPORTANTE:** Altere a senha do administrador após o primeiro login!

## 🔄 11. Backup e Manutenção

### 11.1 Backup Automático
Configure backups regulares no cPanel:
- Banco de dados MySQL
- Arquivos da aplicação

### 11.2 Monitoramento
- Configure alertas de espaço em disco
- Monitore logs de erro PHP
- Verifique performance do banco

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro do PHP
2. Teste as conexões individualmente
3. Consulte a documentação do seu hosting

---

✅ **Sistema configurado com sucesso!** 
Agora você tem um sistema escolar completo rodando no seu cPanel com MySQL/MariaDB.