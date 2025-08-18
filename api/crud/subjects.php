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
    if ($user->role === 'student') {
        $query = "SELECT s.* FROM subjects s JOIN profiles p ON s.class_id = p.class_id WHERE p.id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else if ($user->role === 'instructor') {
        $query = "SELECT * FROM subjects WHERE teacher_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else {
        $query = "SELECT * FROM subjects ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
}

function handlePost($db, $user) {
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = uniqid();
    
    $query = "INSERT INTO subjects (id, name, class_id, teacher_id) VALUES (:id, :name, :class_id, :teacher_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':class_id', $data['class_id']);
    $stmt->bindParam(':teacher_id', $data['teacher_id']);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Matéria criada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar matéria']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Verificar permissões
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT id FROM subjects WHERE id = :id AND teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    } else if ($user->role !== 'admin' && $user->role !== 'secretary') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['name', 'class_id', 'teacher_id'] as $field) {
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
    
    $query = "UPDATE subjects SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Matéria atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar matéria']);
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
    
    $query = "DELETE FROM subjects WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Matéria excluída com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir matéria']);
    }
}
?>