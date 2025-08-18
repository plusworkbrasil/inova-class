<?php
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/JWT.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/Key.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    private static $secret_key = "sua_chave_secreta_super_forte_aqui"; // ALTERE ESTA CHAVE!
    private static $algorithm = "HS256";
    private static $expiration_time = 3600; // 1 hora

    public static function encode($data) {
        $issued_at = time();
        $expiration = $issued_at + self::$expiration_time;
        
        $payload = array(
            "iat" => $issued_at,
            "exp" => $expiration,
            "data" => $data
        );

        return JWT::encode($payload, self::$secret_key, self::$algorithm);
    }

    public static function decode($jwt) {
        try {
            $decoded = JWT::decode($jwt, new Key(self::$secret_key, self::$algorithm));
            return $decoded->data;
        } catch (Exception $e) {
            return false;
        }
    }

    public static function validateToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader)) {
            return false;
        }

        $token = str_replace('Bearer ', '', $authHeader);
        return self::decode($token);
    }
}
?>