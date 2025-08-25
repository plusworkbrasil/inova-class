<?php
require_once __DIR__ . '/env.php';

// Configurar CORS para produção
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Verificar se a origem está na lista permitida
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Para desenvolvimento local, permitir localhost
    if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
        header("Access-Control-Allow-Origin: " . $origin);
    }
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Content-Security-Policy: default-src 'self'");

?>