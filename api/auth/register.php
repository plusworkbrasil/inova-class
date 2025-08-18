<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'student';

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome, email e senha são obrigatórios']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

try {
    // Verificar se email já existe
    $checkQuery = "SELECT id FROM profiles WHERE email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':email', $email);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Email já está em uso']);
        exit;
    }

    // Criar usuário
    $id = uniqid();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $query = "INSERT INTO profiles (id, name, email, password, role) VALUES (:id, :name, :email, :password, :role)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':role', $role);
    
    if ($stmt->execute()) {
        $user = [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => $role
        ];
        
        $token = JWTHandler::encode($user);
        
        echo json_encode([
            'user' => $user,
            'token' => $token
        ]);
    } else {
        throw new Exception('Erro ao criar usuário');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}
?>