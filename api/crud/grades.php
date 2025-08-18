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
        $query = "SELECT * FROM grades WHERE student_id = :user_id ORDER BY date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else if ($user->role === 'instructor') {
        $query = "SELECT g.* FROM grades g JOIN subjects s ON g.subject_id = s.id WHERE s.teacher_id = :user_id ORDER BY g.date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else {
        $query = "SELECT * FROM grades ORDER BY date DESC";
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
}

function handlePost($db, $user) {
    if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = uniqid();
    
    // Verificar se instrutor pode dar nota nesta matéria
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT id FROM subjects WHERE id = :subject_id AND teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':subject_id', $data['subject_id']);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Você não pode dar notas nesta matéria']);
            return;
        }
    }
    
    $query = "INSERT INTO grades (id, student_id, subject_id, value, max_value, type, date, teacher_id) VALUES (:id, :student_id, :subject_id, :value, :max_value, :type, :date, :teacher_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':student_id', $data['student_id']);
    $stmt->bindParam(':subject_id', $data['subject_id']);
    $stmt->bindParam(':value', $data['value']);
    $stmt->bindParam(':max_value', $data['max_value'] ?? 10.00);
    $stmt->bindParam(':type', $data['type']);
    $stmt->bindParam(':date', $data['date']);
    $stmt->bindParam(':teacher_id', $user->id);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Nota criada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar nota']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Verificar permissões
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT g.id FROM grades g JOIN subjects s ON g.subject_id = s.id WHERE g.id = :id AND s.teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    } else if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['value', 'max_value', 'type', 'date'] as $field) {
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
    
    $query = "UPDATE grades SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Nota atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar nota']);
    }
}

function handleDelete($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Verificar permissões
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT g.id FROM grades g JOIN subjects s ON g.subject_id = s.id WHERE g.id = :id AND s.teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    } else if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $query = "DELETE FROM grades WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Nota excluída com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir nota']);
    }
}
?>