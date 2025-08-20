# Instalação no XAMPP - Sistema de Gestão Escolar

## 1. Preparação do Ambiente

### 1.1 Instalar XAMPP
- Baixe o XAMPP em: https://www.apachefriends.org/
- Instale e inicie Apache e MySQL no painel de controle

### 1.2 Estrutura de Pastas
Coloque o projeto em: `C:\xampp\htdocs\escola-app\`

## 2. Configuração do Banco de Dados

### 2.1 Criar Banco
1. Acesse: http://localhost/phpmyadmin
2. Crie um novo banco chamado `escola_db`
3. Importe o arquivo `schema.sql` no banco criado

### 2.2 Usuário Padrão
- **Email:** admin@escola.com
- **Senha:** admin123

## 3. Instalar Dependências PHP (JWT)

### 3.1 Opção 1: Com Composer
```bash
cd C:\xampp\htdocs\escola-app\api
composer require firebase/php-jwt
```

### 3.2 Opção 2: Manual (se não tiver Composer)
1. Baixe: https://github.com/firebase/php-jwt/archive/refs/heads/main.zip
2. Extraia para: `C:\xampp\htdocs\escola-app\api\vendor\firebase\php-jwt\`
3. Certifique-se que os arquivos estão em: `api\vendor\firebase\php-jwt\src\`

## 4. Configuração do Frontend

### 4.1 Instalar Node.js Dependencies
```bash
cd C:\xampp\htdocs\escola-app
npm install
```

### 4.2 Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

## 5. Configurações de Segurança

### 5.1 Chave JWT
Edite `api/utils/jwt.php` e altere a linha:
```php
private static $secret_key = "sua_chave_secreta_super_forte_aqui";
```

### 5.2 CORS (se necessário)
O arquivo `api/config/cors.php` já está configurado para desenvolvimento local.

## 6. Acessar o Sistema

### 6.1 URLs de Acesso
- **Frontend:** http://localhost:5173 (ou porta do Vite)
- **API:** http://localhost/escola-app/api
- **phpMyAdmin:** http://localhost/phpmyadmin

### 6.2 Primeiro Acesso
1. Acesse o frontend
2. Vá para a página de login
3. Use as credenciais padrão do administrador

## 7. Estrutura de Arquivos no XAMPP

```
C:\xampp\htdocs\escola-app\
├── api/
│   ├── auth/
│   ├── config/
│   ├── crud/
│   ├── utils/
│   └── vendor/ (após instalar JWT)
├── src/
├── public/
└── ... (outros arquivos do projeto)
```

## 8. Verificações

### 8.1 Teste da API
- Acesse: http://localhost/escola-app/api/auth/login.php
- Deve retornar um erro de método não permitido (normal, precisa ser POST)

### 8.2 Teste do Banco
- Verifique se as tabelas foram criadas corretamente no phpMyAdmin
- Confirme se o usuário admin foi inserido na tabela `profiles`

## 9. Resolução de Problemas

### 9.1 Erro de Conexão com Banco
- Verifique se MySQL está rodando no XAMPP
- Confirme as credenciais em `api/config/database.php`

### 9.2 Erro 404 na API
- Verifique se o caminho da pasta está correto
- Confirme se o Apache está rodando
- Verifique se `.htaccess` não está bloqueando

### 9.3 Erro de CORS
- Verifique se `api/config/cors.php` está sendo incluído
- Teste com uma extensão de CORS desabilitado no navegador

## 10. Próximos Passos

Após a instalação:
1. Teste o login com usuário admin
2. Explore as funcionalidades do sistema
3. Crie novos usuários e dados de teste
4. Configure conforme suas necessidades específicas