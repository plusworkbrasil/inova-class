<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = JWTHandler::validateToken();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

switch ($method) {
    case 'GET':
        handleGet($db, $user);
        break;
    case 'POST':
        handlePost($db, $user);
        break;
    case 'PUT':
        handlePut($db, $user);
        break;
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
}

function handleGet($db, $user) {
    $id = $_GET['id'] ?? '';
    
    if ($id) {
        // Buscar perfil específico
        if ($user->role !== 'admin' && $user->role !== 'secretary' && $user->id !== $id) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
        
        $query = "SELECT * FROM profiles WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
    } else {
        // Listar todos os perfis (apenas admin/secretário)
        if ($user->role !== 'admin' && $user->role !== 'secretary') {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
        
        $query = "SELECT * FROM profiles ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    $result = $id ? $stmt->fetch() : $stmt->fetchAll();
    
    echo json_encode($result);
}

function handlePost($db, $user) {
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = uniqid();
    $hashedPassword = password_hash($data['password'] ?? 'temp123', PASSWORD_DEFAULT);
    
    $query = "INSERT INTO profiles (id, name, email, password, role, phone, cep, street, number, complement, neighborhood, city, state, student_id, class_id, cpf, full_name, parent_name, escolaridade, guardian_name, guardian_phone) VALUES (:id, :name, :email, :password, :role, :phone, :cep, :street, :number, :complement, :neighborhood, :city, :state, :student_id, :class_id, :cpf, :full_name, :parent_name, :escolaridade, :guardian_name, :guardian_phone)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':role', $data['role'] ?? 'student');
    $stmt->bindParam(':phone', $data['phone']);
    $stmt->bindParam(':cep', $data['cep']);
    $stmt->bindParam(':street', $data['street']);
    $stmt->bindParam(':number', $data['number']);
    $stmt->bindParam(':complement', $data['complement']);
    $stmt->bindParam(':neighborhood', $data['neighborhood']);
    $stmt->bindParam(':city', $data['city']);
    $stmt->bindParam(':state', $data['state']);
    $stmt->bindParam(':student_id', $data['student_id']);
    $stmt->bindParam(':class_id', $data['class_id']);
    $stmt->bindParam(':cpf', $data['cpf']);
    $stmt->bindParam(':full_name', $data['full_name']);
    $stmt->bindParam(':parent_name', $data['parent_name']);
    $stmt->bindParam(':escolaridade', $data['escolaridade']);
    $stmt->bindParam(':guardian_name', $data['guardian_name']);
    $stmt->bindParam(':guardian_phone', $data['guardian_phone']);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Perfil criado com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar perfil']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Usuário só pode editar próprio perfil, admin/secretário pode editar qualquer um
    if ($user->role !== 'admin' && $user->role !== 'secretary' && $user->id !== $id) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['name', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'student_id', 'class_id', 'cpf', 'full_name', 'parent_name', 'escolaridade', 'guardian_name', 'guardian_phone'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhum campo para atualizar']);
        return;
    }
    
    $query = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Perfil atualizado com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar perfil']);
    }
}

function handleDelete($db, $user) {
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    $query = "DELETE FROM profiles WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Perfil excluído com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir perfil']);
    }
}
?>