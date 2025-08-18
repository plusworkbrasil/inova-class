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
        // Verificar acesso
        if ($user->role === 'student') {
            $query = "SELECT c.* FROM classes c JOIN profiles p ON c.id = p.class_id WHERE c.id = :id AND p.id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $user->id);
        } else {
            $query = "SELECT * FROM classes WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
        }
    } else {
        if ($user->role === 'student') {
            $query = "SELECT c.* FROM classes c JOIN profiles p ON c.id = p.class_id WHERE p.id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user->id);
        } else {
            $query = "SELECT * FROM classes ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
        }
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
    
    $query = "INSERT INTO classes (id, name, grade, year, teacher_id, student_count) VALUES (:id, :name, :grade, :year, :teacher_id, :student_count)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':grade', $data['grade']);
    $stmt->bindParam(':year', $data['year'] ?? date('Y'));
    $stmt->bindParam(':teacher_id', $data['teacher_id']);
    $stmt->bindParam(':student_count', $data['student_count'] ?? 0);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Classe criada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar classe']);
    }
}

function handlePut($db, $user) {
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['name', 'grade', 'year', 'teacher_id', 'student_count'] as $field) {
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
    
    $query = "UPDATE classes SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Classe atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar classe']);
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
    
    $query = "DELETE FROM classes WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Classe excluída com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir classe']);
    }
}
?>