<?php
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/JWT.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/Key.php';
require_once __DIR__ . '/../config/env.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    private static $algorithm = "HS256";

    public static function encode($data) {
        $issued_at = time();
        $expiration = $issued_at + JWT_EXPIRATION;
        
        $payload = array(
            "iss" => $_SERVER['HTTP_HOST'] ?? 'escola-app',
            "aud" => $_SERVER['HTTP_HOST'] ?? 'escola-app',
            "iat" => $issued_at,
            "exp" => $expiration,
            "data" => $data
        );

        return JWT::encode($payload, JWT_SECRET, self::$algorithm);
    }

    public static function decode($jwt) {
        try {
            $decoded = JWT::decode($jwt, new Key(JWT_SECRET, self::$algorithm));
            
            // Validar issuer e audience se necessário
            $host = $_SERVER['HTTP_HOST'] ?? 'escola-app';
            if (isset($decoded->iss) && $decoded->iss !== $host) {
                return false;
            }
            
            return $decoded->data;
        } catch (Exception $e) {
            error_log("JWT decode error: " . $e->getMessage());
            return false;
        }
    }

    public static function validateToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (empty($authHeader)) {
            return false;
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return false;
        }

        $token = substr($authHeader, 7);
        return self::decode($token);
    }
}
?>