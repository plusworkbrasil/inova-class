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
        $query = "SELECT * FROM attendance WHERE student_id = :user_id ORDER BY date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else if ($user->role === 'instructor') {
        $query = "SELECT a.* FROM attendance a JOIN subjects s ON a.subject_id = s.id WHERE s.teacher_id = :user_id ORDER BY a.date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else {
        $query = "SELECT * FROM attendance ORDER BY date DESC";
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
    
    // Verificar se instrutor pode registrar presença nesta matéria
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT id FROM subjects WHERE id = :subject_id AND teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':subject_id', $data['subject_id']);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Você não pode registrar presença nesta matéria']);
            return;
        }
    }
    
    $query = "INSERT INTO attendance (id, student_id, class_id, subject_id, date, is_present, justification) VALUES (:id, :student_id, :class_id, :subject_id, :date, :is_present, :justification)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':student_id', $data['student_id']);
    $stmt->bindParam(':class_id', $data['class_id']);
    $stmt->bindParam(':subject_id', $data['subject_id']);
    $stmt->bindParam(':date', $data['date']);
    $stmt->bindParam(':is_present', $data['is_present']);
    $stmt->bindParam(':justification', $data['justification']);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Presença registrada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao registrar presença']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    // Verificar permissões para instrutores
    if ($user->role === 'instructor') {
        $checkQuery = "SELECT a.id FROM attendance a JOIN subjects s ON a.subject_id = s.id WHERE a.id = :id AND s.teacher_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    }
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['is_present', 'justification'] as $field) {
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
    
    $query = "UPDATE attendance SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Presença atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar presença']);
    }
}

function handleDelete($db, $user) {
    if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    $query = "DELETE FROM attendance WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Registro de presença excluído']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir presença']);
    }
}
?>