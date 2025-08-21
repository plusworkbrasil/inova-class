# Instalação Automática - Sistema de Gestão Escolar

## 🚀 Instalação Rápida

### Para Windows (XAMPP)

1. **Baixe e instale o XAMPP:**
   - Site: https://www.apachefriends.org/
   - Inicie Apache e MySQL no painel de controle

2. **Coloque o projeto na pasta do XAMPP:**
   ```
   C:\xampp\htdocs\escola-app\
   ```

3. **Execute o instalador automático:**
   ```bash
   # Clique duas vezes no arquivo:
   install.bat
   
   # Ou execute no prompt de comando:
   cd C:\xampp\htdocs\escola-app
   install.bat
   ```

4. **Siga o instalador web:**
   - O script abrirá automaticamente: `http://localhost/escola-app/install.php`
   - Complete a instalação seguindo as instruções na tela

### Para Linux/macOS

1. **Instale as dependências:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install apache2 mysql-server php php-pdo php-mysql nodejs npm composer
   
   # CentOS/RHEL
   sudo yum install httpd mariadb-server php php-pdo php-mysqlnd nodejs npm composer
   
   # macOS (com Homebrew)
   brew install apache2 mysql php node composer
   ```

2. **Configure o projeto:**
   ```bash
   # Clone/coloque o projeto na pasta web
   cd /var/www/html/escola-app  # ou pasta do seu servidor
   
   # Execute o instalador
   chmod +x install.sh
   ./install.sh
   ```

3. **Acesse o instalador web:**
   - Abra: `http://localhost/escola-app/install.php`
   - Complete a instalação

## 📋 O que o Instalador Faz

### Instalador em Lote (install.bat / install.sh)
✅ Verifica se XAMPP/Apache está instalado  
✅ Verifica se Node.js e npm estão disponíveis  
✅ Instala dependências do frontend (`npm install`)  
✅ Instala Firebase JWT via Composer (se disponível)  
✅ Abre o instalador web automaticamente  

### Instalador Web (install.php)
✅ **Passo 1:** Verifica ambiente (Apache, MySQL, PHP, extensões)  
✅ **Passo 2:** Verifica se JWT está instalado  
✅ **Passo 3:** Cria banco de dados `escola_db`  
✅ **Passo 4:** Importa schema e dados iniciais  
✅ **Passo 5:** Gera chave JWT segura automaticamente  

## 🎯 Acesso Rápido

Após a instalação:

### URLs do Sistema
- **Frontend:** http://localhost:5173
- **API:** http://localhost/escola-app/api
- **phpMyAdmin:** http://localhost/phpmyadmin

### Credenciais Padrão
- **Email:** admin@escola.com
- **Senha:** admin123

## 🔧 Comandos Úteis

### Iniciar o Sistema
```bash
# Na pasta do projeto
npm run dev
```

### Verificar Instalação
```bash
# Testar API
curl http://localhost/escola-app/api/auth/login.php

# Verificar banco
mysql -u root -p -e "SHOW DATABASES LIKE 'escola_db';"
```

### Resolver Problemas Comuns
```bash
# Permissões (Linux/macOS)
sudo chown -R www-data:www-data /var/www/html/escola-app
sudo chmod -R 755 /var/www/html/escola-app

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Limpar cache do navegador
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)
```

## ⚡ Instalação Express (1 Comando)

### Windows
```batch
curl -O https://raw.githubusercontent.com/seu-usuario/escola-app/main/install.bat && install.bat
```

### Linux/macOS
```bash
curl -O https://raw.githubusercontent.com/seu-usuario/escola-app/main/install.sh && chmod +x install.sh && ./install.sh
```

## 📱 Instalação via Docker (Alternativa)

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/escola-app.git
cd escola-app

# Execute com Docker Compose
docker-compose up -d

# Acesse
open http://localhost:5173
```

## 🆘 Suporte

### Problemas Comuns

**Erro 404 na API:**
- Verifique se Apache está rodando
- Confirme o caminho: `C:\xampp\htdocs\escola-app\`
- Teste: http://localhost/escola-app/

**Erro de Conexão MySQL:**
- Verifique se MySQL está rodando no XAMPP
- Confirme usuário: `root` sem senha

**Erro de CORS:**
- Certifique-se de que `api/config/cors.php` existe
- Teste com CORS desabilitado no navegador

**JWT não funciona:**
- Execute: `composer require firebase/php-jwt` na pasta `api/`
- Ou baixe manualmente conforme instruções

### Logs de Debug
```bash
# Logs do Apache (XAMPP)
C:\xampp\apache\logs\error.log

# Logs do PHP
C:\xampp\php\logs\php_error_log

# Console do navegador
F12 > Console
```

### Contato
- 📧 Email: suporte@escola-app.com
- 📖 Documentação: `/INSTALACAO_XAMPP.md`
- 🐛 Issues: GitHub Issues