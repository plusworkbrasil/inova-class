# 🚀 Instruções Completas de Deploy para cPanel

## 📋 Checklist Pré-Deploy

### ✅ Ambiente Local
- [ ] Node.js instalado (versão 16+)
- [ ] NPM funcionando
- [ ] Projeto clonado/baixado
- [ ] Dependências instaladas (`npm install`)

### ✅ Hospedagem cPanel
- [ ] Painel cPanel acessível
- [ ] PHP 7.4+ ativo
- [ ] MySQL/MariaDB disponível
- [ ] mod_rewrite habilitado
- [ ] Domínio configurado

## 🛠️ Processo de Deploy

### 1. Preparação Local

**Windows:**
```cmd
# Execute o script de deploy
deploy_cpanel.bat
```

**Linux/macOS:**
```bash
# Torne executável e execute
chmod +x deploy_cpanel.sh
./deploy_cpanel.sh
```

### 2. Configuração do Banco de Dados no cPanel

1. Acesse **MySQL Databases** no cPanel
2. Crie um novo banco:
   - Nome: `escola_db` (ou qualquer nome)
   - O cPanel adicionará um prefixo: `cpanel_user_escola_db`
3. Crie um usuário MySQL
4. Associe o usuário ao banco com **ALL PRIVILEGES**
5. **Anote:** nome completo do banco, usuário e senha

### 3. Upload dos Arquivos

**Opção A - File Manager do cPanel:**
1. Acesse **File Manager** → `public_html/`
2. Faça upload do arquivo ZIP da pasta `deploy_cpanel/`
3. Extraia o arquivo ZIP
4. Delete o arquivo ZIP

**Opção B - FTP (FileZilla):**
1. Configure conexão FTP com dados do cPanel
2. Navegue até `/public_html/`
3. Faça upload de **todos** os arquivos de `deploy_cpanel/`

### 4. Instalação Automática

1. Acesse: `https://seudominio.com.br/install_cpanel.php`
2. O instalador verificará requisitos automaticamente
3. Configure o banco de dados com os dados anotados
4. Aguarde a importação do schema
5. Configure domínio e finalize
6. **IMPORTANTE:** Delete `install_cpanel.php` após conclusão

### 5. Configuração Final

1. Acesse o sistema: `https://seudominio.com.br`
2. Login com credenciais padrão:
   - Email: `admin@escola.com`
   - Senha: `admin123`
3. **⚠️ ALTERE A SENHA IMEDIATAMENTE**
4. Configure perfil do administrador

## 🔧 Configurações Avançadas

### Permissões de Arquivo (se necessário)
```bash
# Via SSH ou File Manager
find public_html/ -type d -exec chmod 755 {} \;
find public_html/ -type f -exec chmod 644 {} \;
```

### SSL/HTTPS
1. Ative SSL no cPanel (Let's Encrypt gratuito)
2. Force redirecionamento HTTPS (já configurado no .htaccess)

### Performance
- **Cache:** Configurado automaticamente via .htaccess
- **Compressão:** Gzip ativo para arquivos estáticos
- **CDN:** Considere Cloudflare para melhor performance

## 🚨 Troubleshooting

### Erro 500 - Internal Server Error
**Possíveis causas:**
- Permissões incorretas nos arquivos
- PHP versão incompatível
- Biblioteca JWT não instalada
- Erro no arquivo `env.php`

**Soluções:**
1. Verifique logs de erro no cPanel
2. Confirme PHP 7.4+ ativo
3. Execute instalador novamente
4. Verifique se `api/config/env.php` existe

### CORS Error
**Causa:** Domínio não autorizado
**Solução:** 
1. Edite `api/config/env.php`
2. Adicione seu domínio em `ALLOWED_ORIGINS`

### Banco não conecta
**Soluções:**
1. Confirme credenciais no instalador
2. Teste conexão via phpMyAdmin
3. Verifique se usuário tem privilégios no banco

### JWT Error
**Soluções:**
1. Regenere chave via instalador
2. Instale biblioteca JWT:
   ```bash
   cd public_html/api
   composer require firebase/php-jwt
   ```

### Páginas não carregam (404)
**Causa:** mod_rewrite não ativo
**Solução:** Contate suporte da hospedagem

## 📊 Monitoramento

### Logs Importantes
- `public_html/api/logs/` - Logs da aplicação
- cPanel → **Error Logs** - Logs do servidor
- cPanel → **Raw Access Logs** - Logs de acesso

### Backup Recomendado
- **Banco de dados:** Export via phpMyAdmin
- **Arquivos:** Download via File Manager
- **Frequência:** Semanal ou antes de atualizações

## 🔄 Atualizações Futuras

### Para atualizar o sistema:
1. Execute script de deploy local
2. Faça backup do banco atual
3. Faça upload apenas dos arquivos alterados
4. Execute migrations se necessário
5. Teste funcionalidades críticas

### Versionamento
- Mantenha backup da versão anterior
- Teste em ambiente de desenvolvimento primeiro
- Documente mudanças realizadas

---

## 📞 Suporte

**Antes de solicitar ajuda:**
1. ✅ Seguiu todas as instruções
2. ✅ Verificou logs de erro
3. ✅ Testou em ambiente local
4. ✅ Confirmou versão do PHP

**Informações necessárias para suporte:**
- Versão do PHP do servidor
- Mensagens de erro específicas
- Logs do navegador (F12 → Console)
- Logs do servidor (cPanel)

**💡 Dica:** 90% dos problemas são resolvidos verificando permissões e configurações do banco de dados!