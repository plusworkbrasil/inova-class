<?php
// Configurações de ambiente para produção cPanel
// IMPORTANTE: Este arquivo não deve ser versionado (.gitignore)

// Configurações do banco de dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpanel_usuario_escola_db'); // Substitua pelo nome real do banco
define('DB_USER', 'cpanel_usuario'); // Substitua pelo usuário MySQL do cPanel
define('DB_PASS', 'senha_segura_aqui'); // Substitua pela senha real

// Chave JWT - Gere uma nova chave forte
define('JWT_SECRET', ''); // Será gerado automaticamente no instalador

// Configurações gerais
define('ENVIRONMENT', 'production');
define('DEBUG_MODE', false);

// URLs permitidas para CORS (adicione seus domínios)
define('ALLOWED_ORIGINS', [
    'https://seudominio.com.br',
    'https://www.seudominio.com.br',
    // Adicione outras variações do seu domínio
]);

// Configurações de segurança
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutos em segundos
define('JWT_EXPIRATION', 3600); // 1 hora

?>