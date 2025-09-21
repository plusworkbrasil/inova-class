<?php
// Configurações de ambiente para produção cPanel
// IMPORTANTE: Este arquivo não deve ser versionado (.gitignore)

// Configurações do banco de dados - Use variáveis de ambiente para segurança
define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'cpanel_usuario_escola_db'); 
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'cpanel_usuario'); 
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? 'CONFIGURE_DATABASE_PASSWORD'); // ⚠️ CONFIGURE A VARIÁVEL DE AMBIENTE!

// Chave JWT - Use variável de ambiente para segurança
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?? 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION'); // ⚠️ CONFIGURE A VARIÁVEL DE AMBIENTE!

// Configurações gerais
define('ENVIRONMENT', 'production');
define('DEBUG_MODE', false);

// URLs permitidas para CORS (adicione seus domínios)
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://seudominio.com.br',
    'https://www.seudominio.com.br',
    // Adicione outras variações do seu domínio
]);

// Configurações de segurança
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutos em segundos
define('JWT_EXPIRATION', 3600); // 1 hora

?>