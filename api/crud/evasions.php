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
        $query = "SELECT * FROM evasions WHERE student_id = :user_id ORDER BY date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else {
        $query = "SELECT * FROM evasions ORDER BY date DESC";
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
    
    $query = "INSERT INTO evasions (id, student_id, date, reason, status, reported_by, observations) VALUES (:id, :student_id, :date, :reason, :status, :reported_by, :observations)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':student_id', $data['student_id']);
    $stmt->bindParam(':date', $data['date']);
    $stmt->bindParam(':reason', $data['reason']);
    $stmt->bindParam(':status', $data['status'] ?? 'active');
    $stmt->bindParam(':reported_by', $user->id);
    $stmt->bindParam(':observations', $data['observations']);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Evasão registrada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao registrar evasão']);
    }
}

function handlePut($db, $user) {
    if ($user->role === 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['reason', 'status', 'observations'] as $field) {
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
    
    $query = "UPDATE evasions SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Evasão atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar evasão']);
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
    
    $query = "DELETE FROM evasions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Evasão excluída com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir evasão']);
    }
}
?>