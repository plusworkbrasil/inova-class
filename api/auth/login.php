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
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email e senha são obrigatórios']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT id, name, email, password, role FROM profiles WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();
        
        if (password_verify($password, $user['password'])) {
            unset($user['password']);
            
            $token = JWTHandler::encode($user);
            
            echo json_encode([
                'user' => $user,
                'token' => $token
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciais inválidas']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciais inválidas']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}
?>