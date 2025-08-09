<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método não permitido', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password']) || !isset($input['name'])) {
    sendError('Email, senha e nome são obrigatórios');
}

$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$password = $input['password'];
$name = htmlspecialchars($input['name'], ENT_QUOTES, 'UTF-8');
$role = isset($input['role']) ? $input['role'] : 'student';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Email inválido');
}

if (strlen($password) < 6) {
    sendError('Senha deve ter pelo menos 6 caracteres');
}

$allowedRoles = ['admin', 'secretary', 'instructor', 'student'];
if (!in_array($role, $allowedRoles)) {
    sendError('Role inválida');
}

try {
    $database = new Database();
    $db = $database->connect();

    // Verificar se email já existe
    $checkQuery = "SELECT id FROM users WHERE email = :email LIMIT 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':email', $email);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        sendError('Email já cadastrado', 409);
    }

    // Iniciar transação
    $db->beginTransaction();

    // Gerar ID único
    $userId = bin2hex(random_bytes(18)); // 36 caracteres

    // Criar usuário
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    $userQuery = "INSERT INTO users (id, email, password_hash, email_verified) 
                  VALUES (:id, :email, :password_hash, TRUE)";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $userId);
    $userStmt->bindParam(':email', $email);
    $userStmt->bindParam(':password_hash', $passwordHash);
    $userStmt->execute();

    // Criar perfil
    $profileQuery = "INSERT INTO profiles (id, name, email, role) 
                     VALUES (:id, :name, :email, :role)";
    $profileStmt = $db->prepare($profileQuery);
    $profileStmt->bindParam(':id', $userId);
    $profileStmt->bindParam(':name', $name);
    $profileStmt->bindParam(':email', $email);
    $profileStmt->bindParam(':role', $role);
    $profileStmt->execute();

    // Commit transação
    $db->commit();

    // Gerar JWT
    $payload = [
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24 horas
    ];

    $token = generateJWT($payload);

    sendResponse([
        'success' => true,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'name' => $name,
            'role' => $role
        ],
        'token' => $token,
        'message' => 'Usuário criado com sucesso'
    ], 201);

} catch (Exception $e) {
    $db->rollback();
    sendError('Erro interno do servidor: ' . $e->getMessage(), 500);
}
?>