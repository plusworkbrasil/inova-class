<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método não permitido', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    sendError('Email e senha são obrigatórios');
}

$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$password = $input['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Email inválido');
}

try {
    $database = new Database();
    $db = $database->connect();

    // Buscar usuário com perfil
    $query = "SELECT u.*, p.name, p.role, p.student_id, p.class_id, p.instructor_subjects 
              FROM users u 
              LEFT JOIN profiles p ON u.id = p.id 
              WHERE u.email = :email LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendError('Email ou senha incorretos', 401);
    }

    if (!$user['email_verified']) {
        sendError('Email não verificado', 401);
    }

    // Atualizar último login
    $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $user['id']);
    $updateStmt->execute();

    // Gerar JWT
    $payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60) // 24 horas
    ];

    $token = generateJWT($payload);

    // Remover senha da resposta
    unset($user['password_hash']);

    sendResponse([
        'success' => true,
        'user' => $user,
        'token' => $token,
        'message' => 'Login realizado com sucesso'
    ]);

} catch (Exception $e) {
    sendError('Erro interno do servidor: ' . $e->getMessage(), 500);
}
?>