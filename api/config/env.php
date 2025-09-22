<?php
// Configurações de ambiente para produção cPanel
// IMPORTANTE: Este arquivo não deve ser versionado (.gitignore)

// Configurações do banco de dados - MUST use environment variables
$db_host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
$db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME');
$db_user = $_ENV['DB_USER'] ?? getenv('DB_USER');
$db_pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS');

if (!$db_host || !$db_name || !$db_user || !$db_pass) {
    die('CRITICAL SECURITY ERROR: Database credentials not configured in environment variables');
}

define('DB_HOST', $db_host);
define('DB_NAME', $db_name);
define('DB_USER', $db_user);
define('DB_PASS', $db_pass);

// Chave JWT - MUST use environment variable
$jwt_secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET');
if (!$jwt_secret) {
    die('CRITICAL SECURITY ERROR: JWT_SECRET not configured in environment variables');
}
define('JWT_SECRET', $jwt_secret);

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