<?php
// Chave secreta para JWT - ALTERE ESTA CHAVE EM PRODUÇÃO
define('JWT_SECRET', 'sua-chave-secreta-muito-forte-aqui-123456789');

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function generateJWT($payload) {
    $header = [
        'typ' => 'JWT',
        'alg' => 'HS256'
    ];

    $headerEncoded = base64UrlEncode(json_encode($header));
    $payloadEncoded = base64UrlEncode(json_encode($payload));
    
    $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = base64UrlEncode($signature);

    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }

    list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
    
    $signature = base64UrlDecode($signatureEncoded);
    $expectedSignature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true);

    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }

    $payload = json_decode(base64UrlDecode($payloadEncoded), true);
    
    if (!$payload || !isset($payload['exp']) || time() > $payload['exp']) {
        return false;
    }

    return $payload;
}

function getAuthenticatedUser() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : 
                 (isset($headers['authorization']) ? $headers['authorization'] : null);

    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];
    return verifyJWT($token);
}

function requireAuth($allowedRoles = null) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        sendError('Token não fornecido ou inválido', 401);
    }

    if ($allowedRoles && !in_array($user['role'], $allowedRoles)) {
        sendError('Acesso negado', 403);
    }

    return $user;
}
?>