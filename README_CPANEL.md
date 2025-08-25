# 🏫 Sistema Escolar - Deploy cPanel

## 🚀 Instalação Rápida

### 1. Preparar Localmente
```bash
# Clone/baixe o projeto
git clone [seu-repositorio]
cd sistema-escolar

# Execute o script de deploy
chmod +x deploy_cpanel.sh
./deploy_cpanel.sh
```

### 2. Upload para cPanel
1. Acesse o **File Manager** do seu cPanel
2. Vá para a pasta `public_html/`
3. Faça upload de **todos** os arquivos da pasta `deploy_cpanel/`
4. Extraia se necessário

### 3. Instalação Automática
1. Acesse: `https://seudominio.com.br/install_cpanel.php`
2. Siga o assistente passo a passo
3. Configure banco de dados
4. Delete o instalador após conclusão

## ⚙️ Configurações Necessárias

### Banco de Dados
- Crie um banco MySQL no cPanel
- Anote: nome do banco, usuário e senha
- Formato comum: `cpanel_user_nomedobanco`

### PHP
- Versão mínima: PHP 7.4
- Extensões: PDO, PDO_MySQL, JSON, OpenSSL
- mod_rewrite ativo

## 🔐 Acesso Inicial

**Credenciais padrão:**
- Email: `admin@escola.com`
- Senha: `admin123`

**⚠️ ALTERE IMEDIATAMENTE após primeiro login!**

## 📁 Estrutura Final no Servidor

```
public_html/
├── index.html              # App principal
├── assets/                 # CSS, JS, imagens
├── api/                    # Backend PHP
│   ├── auth/              # Login/registro
│   ├── crud/              # CRUD endpoints
│   ├── config/            # Configurações
│   ├── utils/             # Utilitários
│   └── vendor/            # Bibliotecas
├── schema.sql             # Schema do banco
├── install_cpanel.php     # Instalador (deletar após uso)
└── .htaccess             # Configurações Apache
```

## 🛠️ Troubleshooting

### Erro 500
- Verifique permissões: pastas 755, arquivos 644
- Confira se `api/config/env.php` foi criado
- Verifique logs de erro no cPanel

### CORS Error
- Confirme domínio em `api/config/env.php`
- Use HTTPS em produção

### Banco não conecta
- Verifique credenciais no instalador
- Confirme se banco existe no cPanel
- Teste conexão pelo phpMyAdmin

### JWT Error
- Regenere chave através do instalador
- Verifique se biblioteca JWT foi instalada

## 🔧 Comandos Úteis

### Gerar novo deploy
```bash
./deploy_cpanel.sh
```

### Verificar build local
```bash
npm run build
npm run preview
```

### Instalar JWT manualmente
```bash
# Via Composer (se disponível)
cd public_html/api
composer require firebase/php-jwt

# Via download direto
# Baixe: https://github.com/firebase/php-jwt/releases
# Extraia em: api/vendor/firebase/php-jwt/
```

## 📞 Suporte

1. Verifique se seguiu todos os passos
2. Consulte logs de erro do cPanel
3. Teste em ambiente local primeiro
4. Confirme versão do PHP no servidor

---

**💡 Dica:** Mantenha backup do banco de dados antes de atualizações!